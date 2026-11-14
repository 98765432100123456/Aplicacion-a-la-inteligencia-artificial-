/**
 * Verificación en dos pasos de ICA Bienestar Animal.
 *
 * Después de la contraseña (o de Google, Facebook o Microsoft), la persona recibe en su correo
 * un código de 6 dígitos. Al verificarlo, el inicio de sesión actual (`auth_time` del token)
 * queda registrado en `verificaciones/{uid}`; las reglas de Firestore no dejan leer ni escribir
 * nada a una sesión que no esté en esa lista. Los códigos se guardan solo como resumen SHA-256
 * en `codigosAcceso/{uid}`, una colección que ningún usuario puede leer.
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { cuerpoCorreo } from './correo.js';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });
const db = getFirestore();

/** Cuenta de correo que envía los códigos (por ejemplo, Gmail con una contraseña de aplicación). */
const CORREO_USUARIO = defineSecret('CORREO_USUARIO');
const CORREO_CLAVE = defineSecret('CORREO_CLAVE');

const VIGENCIA_MS = 10 * 60_000;
const ESPERA_REENVIO_MS = 60_000;
const ENVIOS_POR_HORA = 5;
const INTENTOS_POR_CODIGO = 5;
const SESIONES_RECORDADAS = 10;

/** En los emuladores no se envían correos: el código vuelve en la respuesta para las pruebas. */
const EMULADOR = process.env.FUNCTIONS_EMULATOR === 'true';

interface Pendiente {
  resumen: string;
  expira: number;
  intentos: number;
  ultimoEnvio: number;
}

interface Codigos {
  envios?: number[];
  pendientes?: Record<string, Pendiente>;
}

function sesionDe(req: CallableRequest) {
  const correo = req.auth?.token.email;
  const authTime = Number(req.auth?.token.auth_time);
  if (!req.auth || !correo || !Number.isInteger(authTime)) {
    throw new HttpsError('unauthenticated', 'Su sesión terminó. Ingrese de nuevo.');
  }
  return { uid: req.auth.uid, correo: correo.toLowerCase(), authTime };
}

function resumen(uid: string, authTime: number, codigo: string) {
  return createHash('sha256').update(`${uid}:${authTime}:${codigo}`).digest('hex');
}

function iguales(a: string, b: string) {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

function enmascarar(correo: string) {
  const [local, dominio] = correo.split('@');
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(3, local.length - 2))}@${dominio}`;
}

async function enviarCorreo(destino: string, codigo: string) {
  const { createTransport } = await import('nodemailer');
  const remitente = CORREO_USUARIO.value();
  const transporte = createTransport({
    host: process.env.CORREO_SERVIDOR || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: remitente, pass: CORREO_CLAVE.value() },
  });
  const { texto, html } = cuerpoCorreo(codigo, VIGENCIA_MS / 60_000);
  await transporte.sendMail({
    from: `"ICA Bienestar Animal" <${remitente}>`,
    to: destino,
    subject: `${codigo} es su código de verificación`,
    text: texto,
    html,
  });
}

/** Genera un código nuevo para el inicio de sesión actual y lo envía al correo de la cuenta. */
export const enviarCodigoAcceso = onCall({ secrets: [CORREO_USUARIO, CORREO_CLAVE] }, async (req) => {
  const { uid, correo, authTime } = sesionDe(req);
  const ref = db.doc(`codigosAcceso/${uid}`);
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const ahora = Date.now();

  const rechazo = await db.runTransaction(async (tx) => {
    const datos = ((await tx.get(ref)).data() ?? {}) as Codigos;
    const envios = (datos.envios ?? []).filter((t) => ahora - t < 3_600_000);
    const pendientes = Object.fromEntries(Object.entries(datos.pendientes ?? {}).filter(([, p]) => p.expira > ahora));
    const anterior = pendientes[authTime];
    if (anterior && ahora - anterior.ultimoEnvio < ESPERA_REENVIO_MS) return 'Espere un minuto antes de pedir otro código.';
    // En los emuladores las pruebas ingresan muchas veces seguidas con la misma cuenta.
    if (!EMULADOR && envios.length >= ENVIOS_POR_HORA) return 'Pidió demasiados códigos. Intente de nuevo en una hora.';
    pendientes[authTime] = { resumen: resumen(uid, authTime, codigo), expira: ahora + VIGENCIA_MS, intentos: 0, ultimoEnvio: ahora };
    tx.set(ref, { envios: [...envios, ahora], pendientes });
    return null;
  });
  if (rechazo) throw new HttpsError('resource-exhausted', rechazo);

  if (EMULADOR) return { correo: enmascarar(correo), minutos: VIGENCIA_MS / 60_000, codigoPrueba: codigo };
  try {
    await enviarCorreo(correo, codigo);
  } catch (e) {
    console.error('No se pudo enviar el código de verificación', e);
    throw new HttpsError('unavailable', 'No se pudo enviar el correo con el código. Intente de nuevo en unos minutos.');
  }
  return { correo: enmascarar(correo), minutos: VIGENCIA_MS / 60_000 };
});

/** Comprueba el código; si es correcto, la sesión actual queda verificada para las reglas de Firestore. */
export const verificarCodigoAcceso = onCall(async (req) => {
  const { uid, authTime } = sesionDe(req);
  const codigo = String((req.data as { codigo?: unknown } | null)?.codigo ?? '').replace(/\D/g, '');
  if (codigo.length !== 6) throw new HttpsError('invalid-argument', 'Escriba los 6 dígitos del código.');

  const codigosRef = db.doc(`codigosAcceso/${uid}`);
  const verificacionRef = db.doc(`verificaciones/${uid}`);
  // El resultado se devuelve en lugar de lanzarse: un error dentro de la transacción
  // desharía también el conteo de intentos fallidos.
  const resultado = await db.runTransaction(async (tx) => {
    const [codigos, verificacion] = await Promise.all([tx.get(codigosRef), tx.get(verificacionRef)]);
    const pendiente = (codigos.data() as Codigos | undefined)?.pendientes?.[authTime];
    if (!pendiente || pendiente.expira < Date.now()) return 'vencido';
    if (pendiente.intentos >= INTENTOS_POR_CODIGO) return 'bloqueado';
    if (!iguales(pendiente.resumen, resumen(uid, authTime, codigo))) {
      tx.update(codigosRef, { [`pendientes.${authTime}.intentos`]: FieldValue.increment(1) });
      return pendiente.intentos + 1 >= INTENTOS_POR_CODIGO ? 'bloqueado' : 'incorrecto';
    }
    tx.update(codigosRef, { [`pendientes.${authTime}`]: FieldValue.delete() });
    const sesiones = ((verificacion.get('sesiones') as number[] | undefined) ?? []).filter((s) => s !== authTime);
    tx.set(verificacionRef, { sesiones: [...sesiones, authTime].slice(-SESIONES_RECORDADAS), actualizadoEn: FieldValue.serverTimestamp() });
    return 'ok';
  });

  const mensajes: Record<string, string> = {
    vencido: 'El código venció. Pida uno nuevo.',
    bloqueado: 'Demasiados intentos con este código. Pida uno nuevo.',
    incorrecto: 'El código no es correcto. Revíselo e intente de nuevo.',
  };
  if (resultado !== 'ok') throw new HttpsError(resultado === 'incorrecto' ? 'invalid-argument' : 'failed-precondition', mensajes[resultado]);
  return { verificado: true };
});
