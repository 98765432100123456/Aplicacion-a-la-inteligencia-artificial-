import type { User } from 'firebase/auth';
import { ROLES_BASE } from '../../../compartido/permisos';
import { firebase, Firebase } from '../../firebase/conexion';
import { SessionUser } from '../../models/models';
import { Proveedor } from '../../models/predios';
import { ErrorVisible } from '../../utils/http-error';
import { enmascarar, ProveedorSesion } from './sesion';

const INACTIVO = 'Su usuario está inactivo. Contacte al administrador del sistema.';

/**
 * Sesión con Firebase Authentication. Firebase confirma la identidad; el rol y los
 * permisos salen de los documentos `usuarios/{uid}` y `roles/{rol}` de Firestore.
 */
export class SesionFirebase implements ProveedorSesion {
  readonly token = null;
  private cancelar: (() => void)[] = [];

  async restaurar() {
    const fb = await firebase();
    await fb.auth.authStateReady();
    const usuario = fb.auth.currentUser;
    if (!usuario) return null;
    try {
      return await this.sesionDe(fb, usuario);
    } catch {
      await fb.fa.signOut(fb.auth);
      return null;
    }
  }

  async ingresar(correo: string, clave: string) {
    const fb = await firebase();
    const { user } = await fb.fa.signInWithEmailAndPassword(fb.auth, correo.trim().toLowerCase(), clave);
    return this.abrir(fb, user);
  }

  async ingresarConProveedor(proveedor: Proveedor) {
    const fb = await firebase();
    const proveedores = {
      google: () => new fb.fa.GoogleAuthProvider(),
      facebook: () => new fb.fa.FacebookAuthProvider().addScope('email'),
      microsoft: () => new fb.fa.OAuthProvider('microsoft.com').addScope('email'),
    };
    const { user } = await fb.fa.signInWithPopup(fb.auth, proveedores[proveedor]());
    return this.abrir(fb, user);
  }

  /** Cuenta de propietario: se crea, se envía la verificación del correo y se cierra la sesión. */
  async registrar(nombres: string, apellidos: string, correo: string, clave: string) {
    const fb = await firebase();
    const { user } = await fb.fa.createUserWithEmailAndPassword(fb.auth, correo, clave);
    await fb.fa.updateProfile(user, { displayName: `${nombres} ${apellidos}` });
    await this.crearPropietario(fb, user, nombres, apellidos);
    await fb.fa.sendEmailVerification(user, { url: `${location.origin}/ingresar` });
    await fb.fa.signOut(fb.auth);
    return `Cuenta creada. Enviamos a ${correo} un enlace para confirmar su correo; ábralo y luego ingrese. Revise también la carpeta de spam.`;
  }

  async cambiarClave(actual: string, nueva: string) {
    const fb = await firebase();
    const usuario = fb.auth.currentUser;
    if (!usuario?.email || !usuario.providerData.some((p) => p.providerId === 'password')) {
      throw new ErrorVisible('Su cuenta ingresa con Google, Facebook o Microsoft; la contraseña se cambia en ese servicio.');
    }
    await fb.fa.reauthenticateWithCredential(usuario, fb.fa.EmailAuthProvider.credential(usuario.email, actual));
    await fb.fa.updatePassword(usuario, nueva);
    return null;
  }

  /** La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados. */
  async olvideClave(correo: string) {
    const fb = await firebase();
    try {
      await fb.fa.sendPasswordResetEmail(fb.auth, correo.trim().toLowerCase(), { url: `${location.origin}/ingresar` });
    } catch (e) {
      if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    }
    return 'Si el correo está registrado y activo, enviamos un enlace para restablecer la contraseña.';
  }

  async validarEnlace(codigo: string) {
    const fb = await firebase();
    try {
      return { valid: true, email: enmascarar(await fb.fa.verifyPasswordResetCode(fb.auth, codigo)) };
    } catch {
      return { valid: false };
    }
  }

  async restablecerClave(codigo: string, clave: string) {
    const fb = await firebase();
    await fb.fa.confirmPasswordReset(fb.auth, codigo, clave);
    return 'Contraseña actualizada. Ya puede ingresar.';
  }

  async salir() {
    this.cancelar.forEach((c) => c());
    this.cancelar = [];
    const fb = await firebase();
    await fb.fa.signOut(fb.auth);
  }

  /** Escucha el documento del usuario y el de su rol: un cambio de rol o una inactivación aplican de inmediato. */
  observar(alCambiar: (usuario: SessionUser | null) => void) {
    this.cancelar.forEach((c) => c());
    this.cancelar = [];
    void firebase().then((fb) => {
      const usuario = fb.auth.currentUser;
      if (!usuario) return;
      const { doc, onSnapshot } = fb.fs;
      let rolActual = '';
      const recalcular = () => this.sesionDe(fb, usuario).then(alCambiar, () => alCambiar(null));
      const dejarUsuario = onSnapshot(doc(fb.db, 'usuarios', usuario.uid), (d) => {
        const rol = d.get('rol') as string;
        if (rol !== rolActual) {
          rolActual = rol;
          this.cancelar[1]?.();
          this.cancelar[1] = onSnapshot(doc(fb.db, 'roles', rol), recalcular, () => alCambiar(null));
        }
        void recalcular();
      }, () => alCambiar(null));
      this.cancelar[0] = dejarUsuario;
    });
  }

  private async abrir(fb: Firebase, usuario: User) {
    try {
      const sesion = await this.sesionDe(fb, usuario);
      const { doc, updateDoc, serverTimestamp } = fb.fs;
      await updateDoc(doc(fb.db, 'usuarios', usuario.uid), { ultimoIngreso: serverTimestamp() }).catch(() => undefined);
      return sesion;
    } catch (e) {
      await fb.fa.signOut(fb.auth);
      throw e;
    }
  }

  private async sesionDe(fb: Firebase, usuario: User): Promise<SessionUser> {
    const { doc, getDoc } = fb.fs;
    let datos = await getDoc(doc(fb.db, 'usuarios', usuario.uid));
    if (!datos.exists()) {
      // Primer ingreso con Google, Facebook o Microsoft: la cuenta nace como propietario.
      const [nombres, ...resto] = (usuario.displayName ?? usuario.email ?? 'Propietario').split(' ');
      await this.crearPropietario(fb, usuario, nombres, resto.join(' ') || '-');
      datos = await getDoc(doc(fb.db, 'usuarios', usuario.uid));
    }
    const u = datos.data()!;
    const rol = await getDoc(doc(fb.db, 'roles', u['rol']));
    if (!u['activo'] || !rol.exists() || !rol.get('activo')) throw new ErrorVisible(INACTIVO);
    return {
      id: usuario.uid,
      email: u['correo'],
      firstName: u['nombres'],
      lastName: u['apellidos'],
      role: { id: rol.id, code: rol.id.toUpperCase(), name: rol.get('nombre') },
      permissions: rol.get('permisos') ?? [],
    };
  }

  private async crearPropietario(fb: Firebase, usuario: User, nombres: string, apellidos: string) {
    const { doc, setDoc, serverTimestamp } = fb.fs;
    if (!usuario.email) throw new ErrorVisible('La cuenta del proveedor no tiene correo electrónico.');
    await setDoc(doc(fb.db, 'usuarios', usuario.uid), {
      nombres: nombres.trim().slice(0, 80),
      apellidos: apellidos.trim().slice(0, 80) || '-',
      correo: usuario.email.toLowerCase(),
      documento: null,
      telefono: null,
      rol: ROLES_BASE.PROPIETARIO,
      activo: true,
      ultimoIngreso: null,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }
}
