// Control de seguridad automático ("security gate"), como en Forja Digital.
// Corre en la integración continua y al final de `npm run build` en frontend/: si encuentra un problema,
// termina con error y no se publica. Cada regla está explicada en docs/SEGURIDAD.md.
//
//   node scripts/control-seguridad.mjs          revisa el código y la configuración
//   node scripts/control-seguridad.mjs --dist   además revisa la compilación de producción (frontend/dist)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'frontend/dist/frontend/browser');
const fallas = [];
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');
const recorrer = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? recorrer(p) : [p];
  });

// ---------- 1. Ningún secreto en el repositorio ni en lo que llega al navegador ----------
const SECRETOS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'llave privada'],
  [/"private_key"\s*:\s*"/, 'credencial de cuenta de servicio de Google/Firebase'],
  [/"type"\s*:\s*"service_account"/, 'archivo de cuenta de servicio'],
  [/AKIA[0-9A-Z]{16}/, 'clave de AWS'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'token de GitHub'],
  [/github_pat_[A-Za-z0-9_]{40,}/, 'token de GitHub'],
  [/sk-[A-Za-z0-9_-]{20,}/, 'clave tipo sk-'],
  [/sk_live_[A-Za-z0-9]{10,}/, 'clave secreta de Stripe'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'token de Slack'],
  [/(postgres|mongodb(\+srv)?|mysql|smtps?):\/\/[^\s"'/]+:[^\s"'@]+@/, 'cadena de conexión con contraseña'],
  [/\b(CORREO_CLAVE|SMTP_PASS(WORD)?)\s*[=:]\s*['"][^'"]{6,}['"]|^(CORREO_CLAVE|SMTP_PASS(WORD)?)=\S{6,}/m, 'contraseña de correo escrita en un archivo'],
];
// La configuración web de Firebase (apiKey "AIza…") es pública por diseño; solo puede estar en su archivo.
const CLAVE_WEB = /AIza[0-9A-Za-z_-]{35}/;
const PERMITIDA_CLAVE_WEB = 'frontend/src/environments/firebase.config.ts';
const TEXTO = new Set(['.ts', '.js', '.mjs', '.cjs', '.json', '.html', '.scss', '.css', '.md', '.yml', '.yaml', '.rules', '.txt', '.xml', '.env', '']);

const rastreados = execFileSync('git', ['ls-files', '-z'], { cwd: RAIZ, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const archivo of rastreados) {
  if (!TEXTO.has(extname(archivo)) || archivo.endsWith('package-lock.json') || archivo === 'scripts/control-seguridad.mjs') continue;
  if (!existsSync(join(RAIZ, archivo))) continue;
  const texto = leer(archivo);
  for (const [re, nombre] of SECRETOS) if (re.test(texto)) fallas.push(`${nombre} en ${archivo}`);
  if (CLAVE_WEB.test(texto) && archivo !== PERMITIDA_CLAVE_WEB) fallas.push(`clave web de Firebase fuera de ${PERMITIDA_CLAVE_WEB}: ${archivo}`);
  if (/(^|\/)\.env(\..+)?$/.test(archivo) && !archivo.endsWith('.env.example')) fallas.push(`archivo de variables de entorno versionado: ${archivo}`);
  if (/(cuenta-de-servicio|firebase-adminsdk|\.secret\.local)/.test(archivo)) fallas.push(`archivo de credenciales versionado: ${archivo}`);
}

// Git debe ignorar los archivos donde suelen quedar secretos.
const ignorados = ['.env', '.env.local', 'firebase/cuenta-de-servicio.json', 'firebase/x-firebase-adminsdk-1.json', 'firebase/funciones/.secret.local', 'llave.pem'];
for (const ruta of ignorados) {
  try {
    execFileSync('git', ['check-ignore', '-q', ruta], { cwd: RAIZ });
  } catch {
    fallas.push(`.gitignore no excluye ${ruta}`);
  }
}

// ---------- 2. Sin APIs que ejecuten texto como código o lo inserten como HTML (XSS) ----------
const PELIGROSOS = [
  [/\.innerHTML\s*=|\[innerHTML\]/, 'innerHTML'],
  [/\.outerHTML\s*=/, 'outerHTML'],
  [/insertAdjacentHTML\s*\(/, 'insertAdjacentHTML'],
  [/bypassSecurityTrust\w*\s*\(/, 'bypassSecurityTrust (desactiva la protección de Angular)'],
  [/\beval\s*\(/, 'eval'],
  [/new Function\s*\(/, 'new Function'],
  [/document\.write\s*\(/, 'document.write'],
  [/setTimeout\s*\(\s*['"`]/, 'setTimeout con texto'],
];
const fuentes = [join(RAIZ, 'frontend/src'), join(RAIZ, 'firebase/funciones/src'), join(RAIZ, 'compartido')];
for (const archivo of fuentes.flatMap(recorrer).filter((f) => /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts'))) {
  const texto = readFileSync(archivo, 'utf8');
  for (const [re, nombre] of PELIGROSOS) if (re.test(texto)) fallas.push(`${nombre} en ${relative(RAIZ, archivo)}`);
}

// Enlaces que abren otra pestaña sin rel="noopener" permiten a esa página controlar la nuestra (tabnabbing).
for (const archivo of recorrer(join(RAIZ, 'frontend/src')).filter((f) => f.endsWith('.html'))) {
  for (const etiqueta of readFileSync(archivo, 'utf8').match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? []) {
    if (!/rel="[^"]*noopener/.test(etiqueta)) fallas.push(`enlace target="_blank" sin rel="noopener" en ${relative(RAIZ, archivo)}`);
  }
}

// ---------- 3. Cabeceras de seguridad de Firebase Hosting ----------
const hosting = JSON.parse(leer('firebase.json')).hosting;
const cabeceras = Object.fromEntries(
  (hosting.headers.find((h) => h.source === '**')?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]),
);
const REQUERIDAS = [
  'content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options',
  'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy',
];
for (const c of REQUERIDAS) if (!cabeceras[c]) fallas.push(`falta la cabecera ${c} en firebase.json`);
const csp = cabeceras['content-security-policy'] ?? '';
const directiva = (n) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(n + ' ')) ?? '';
if (/'unsafe-(inline|eval)'|\bdata:|\*(\s|$)/.test(directiva('script-src'))) fallas.push('la CSP permite scripts en línea, eval, data: o cualquier origen');
if (!/frame-ancestors 'none'/.test(csp)) fallas.push("la CSP no impide incrustar el sitio (frame-ancestors 'none')");
if (!/object-src 'none'/.test(csp)) fallas.push("la CSP no bloquea plugins (object-src 'none')");
if (!/base-uri 'self'/.test(csp)) fallas.push("la CSP no fija base-uri 'self'");
if (!/default-src 'self'/.test(csp)) fallas.push("la CSP no parte de default-src 'self'");
const hsts = Number(/max-age=(\d+)/.exec(cabeceras['strict-transport-security'] ?? '')?.[1] ?? 0);
if (hsts < 31536000) fallas.push('HSTS debe durar al menos un año');
if (cabeceras['x-content-type-options'] !== 'nosniff') fallas.push('X-Content-Type-Options debe ser nosniff');
if (cabeceras['x-frame-options'] !== 'DENY') fallas.push('X-Frame-Options debe ser DENY');
// La CSP prohíbe scripts en línea: index.html tampoco puede tenerlos.
if (/<script(?![^>]*\bsrc=)[^>]*>/.test(leer('frontend/src/index.html'))) fallas.push('index.html tiene un script en línea (la CSP lo bloquearía)');

// ---------- 4. Reglas de Firestore ----------
const reglas = leer('firebase/firestore.rules');
if (/allow\s+[^;]*:\s*if\s+true\s*;/.test(reglas)) fallas.push('las reglas de Firestore tienen un "allow … if true"');
if (/request\.time\s*<\s*timestamp\.date/.test(reglas)) fallas.push('las reglas de Firestore siguen en modo de prueba (vencen por fecha)');
if (!/function sesion\(\)\s*\{[^}]*dosPasos\(\)/.test(reglas)) fallas.push('sesion() de las reglas ya no exige la verificación en dos pasos');
if (/match \/codigosAcceso/.test(reglas)) fallas.push('las reglas abren codigosAcceso; solo las Cloud Functions deben leerla');
if (!/match \/verificaciones\/\{uid\}[\s\S]*?allow write: if false;/.test(reglas)) fallas.push('las reglas permiten escribir verificaciones desde la aplicación');

// ---------- 5. Cloud Functions y entornos ----------
const funciones = leer('firebase/funciones/src/index.ts');
if (!/defineSecret\('CORREO_CLAVE'\)/.test(funciones)) fallas.push('la contraseña del correo ya no viene de Secret Manager');
if (/pass:\s*['"`]/.test(funciones)) fallas.push('contraseña escrita en el código de las funciones');
// El código solo puede volver en la respuesta dentro de los emuladores.
for (const linea of funciones.split('\n').filter((l) => /codigoPrueba\s*:/.test(l))) {
  if (!/if \(EMULADOR\)/.test(linea)) fallas.push('codigoPrueba podría salir fuera de los emuladores');
}
if (!/timingSafeEqual/.test(funciones)) fallas.push('el código se compara sin tiempo constante');
const produccion = leer('frontend/src/environments/environment.ts');
if (!/demo:\s*false/.test(produccion) || !/FIREBASE_PRODUCCION/.test(produccion)) fallas.push('environment.ts de producción no usa Firebase real');
if (!/emuladores:\s*false/.test(leer('frontend/src/environments/firebase.config.ts'))) fallas.push('la configuración de producción apunta a los emuladores');

// ---------- 6. Compilación de producción ----------
if (process.argv.includes('--dist')) {
  if (!existsSync(DIST)) {
    fallas.push(`no existe ${relative(RAIZ, DIST)}: compile antes con npm run build`);
  } else {
    for (const archivo of recorrer(DIST)) {
      const rel = relative(RAIZ, archivo);
      if (archivo.endsWith('.map')) fallas.push(`mapa de código fuente publicado: ${rel}`);
      if (!['.js', '.html', '.css', '.json', '.txt', '.xml', '.webmanifest'].includes(extname(archivo))) continue;
      const texto = readFileSync(archivo, 'utf8');
      for (const [re, nombre] of SECRETOS) if (re.test(texto)) fallas.push(`${nombre} en ${rel}`);
      // La dirección de los emuladores existe en el código detrás de un interruptor; lo que no puede llegar es su configuración.
      if (/clave-del-emulador|projectId:\s*["']demo-ica|emuladores:\s*(!0|true)/.test(texto)) fallas.push(`la compilación de producción usa la configuración de los emuladores: ${rel}`);
    }
  }
}

if (fallas.length) {
  console.error(`\n✖ Control de seguridad: ${fallas.length} problema(s). No se debe publicar.\n  - ${fallas.join('\n  - ')}\n`);
  process.exit(1);
}
console.log('✔ Control de seguridad: sin secretos, sin APIs peligrosas, cabeceras completas y reglas con verificación en dos pasos.');
