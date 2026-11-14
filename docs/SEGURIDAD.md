Seguridad
=========

Informe de seguridad de ICA Bienestar Animal, con el mismo formato y los mismos estándares que se aplicaron en Forja Digital (`docs/memoria/seguridad.md` de ese proyecto), adaptados a una aplicación con cuentas, roles y datos personales.

**Alcance:** el código de este repositorio (`main`), sus dependencias, las reglas de Firestore, las Cloud Functions, la configuración de Firebase Hosting y el proceso de publicación.
**Fecha:** 14 de noviembre de 2026.
**Método:** revisión estática del código, control automático (`scripts/control-seguridad.mjs`), `npm audit` de los tres paquetes, búsqueda de secretos en todo el historial de Git, pruebas de las reglas en el emulador (16), pruebas unitarias (42) y pruebas en el navegador con Playwright, incluida una suite de regresión de seguridad (`frontend/e2e/seguridad.spec.ts`).

> No se identificaron vulnerabilidades críticas ni altas abiertas en las pruebas realizadas bajo este alcance. Eso **no** significa que la aplicación sea "100 % segura": significa que lo que se probó, pasó. Lo que no se probó y lo que depende del dueño del proyecto está listado al final.

Los estados usan el vocabulario de Forja: **VERIFIED** (se reprodujo y se comprobó la corrección), **PASSED** (la prueba pasa), **RESIDUAL RISK** (riesgo aceptado y explicado), **NOT YET VALIDATED** (depende de una acción pendiente), **NOT TESTED**.


1. Arquitectura y fronteras de confianza
----------------------------------------

```
Navegador ──HTTPS──► Firebase Hosting (Angular compilado, cabeceras de seguridad)
   │
   ├──HTTPS──► Firebase Authentication (contraseña, Google, Facebook, Microsoft)
   ├──HTTPS──► Cloud Functions ──SMTP/TLS──► correo de la persona (código de verificación)
   │              └──► Firestore con permisos de administrador (codigosAcceso, verificaciones, auditoria)
   ├──HTTPS──► Cloud Firestore  ◄── reglas de seguridad evaluadas en los servidores de Google
   └──HTTPS──► Firebase AI Logic (Gemini): recomendaciones y asistente Clara
```

No hay servidor propio: **la frontera de seguridad real son las reglas de Firestore y las Cloud Functions**, que corren en Google. Todo lo que hace la interfaz (ocultar botones, guardas de ruta) es comodidad, no protección: se asume que un atacante puede llamar a Firestore directamente con su token.

| Frontera | Qué cruza | Confianza | Control |
|---|---|---|---|
| Navegador → Firestore | Lecturas y escrituras con el token de la persona | No confiable | Reglas: sesión verificada en dos pasos, rol activo, permiso del rol, propiedad del predio y validación de cada campo |
| Navegador → Cloud Functions | Pedir y comprobar el código | No confiable | Token de Firebase verificado, límites por usuario, código guardado solo como resumen SHA-256, comparación en tiempo constante |
| Cloud Functions → correo | Código y correo de destino | Confiable (servidor) | El destino sale del token, no de la petición; credenciales en Secret Manager |
| Navegador → Gemini | Hallazgos de la evaluación; preguntas al asistente | No confiable | Sin nombres, documentos, teléfonos ni correos; salida validada o mostrada como texto; límite de preguntas |
| URL → aplicación | Ruta, `?volver=`, `#fragmento` | No confiable | Router de Angular; `rutaDeRegreso` solo acepta rutas internas; nada de la URL se inserta como HTML |
| Formularios → Firestore | Datos de predios, usuarios, evaluaciones | No confiable | Validación en el navegador **y** en las reglas (tipos, longitudes, valores permitidos) |


2. Modelo de amenazas
---------------------

| Actor | Qué buscaría | Defensa principal |
|---|---|---|
| Visitante anónimo | Leer datos sin cuenta | Reglas: sin sesión verificada no se lee nada (prueba *sin sesión no se lee nada*) |
| Persona con la contraseña de otra (robada o adivinada) | Entrar a su cuenta | Verificación en dos pasos por correo; bloqueo de Firebase ante intentos repetidos |
| Propietario curioso | Ver predios o evaluaciones de otras fincas (IDOR/BOLA) | Reglas: solo lo registrado con su correo verificado (pruebas de propietarios) |
| Evaluador o consultor | Darse permisos de administrador, cambiar su rol, editar una evaluación finalizada | Reglas: nadie cambia su propio rol; evaluaciones finalizadas inmutables; nivel coherente con el puntaje |
| Usuario inactivado con sesión abierta | Seguir trabajando | Reglas consultan `activo` en cada operación; la interfaz cierra la sesión al instante |
| Atacante que manipula la URL | Redirigir a un sitio falso o ejecutar código | `rutaDeRegreso`, escape de Angular, CSP sin scripts en línea |
| Atacante que inyecta instrucciones en Gemini | Hacer que el asistente revele datos o actúe | El modelo no tiene herramientas ni datos privados; la respuesta se muestra como texto |
| Abuso de costos (denial of wallet) | Agotar la cuota de correos, funciones o IA | Límites de envío de códigos, `maxInstances: 10`, tope de preguntas al asistente, alerta de presupuesto |
| Dependencia maliciosa o vulnerable | Ejecutar código en la compilación o en el navegador | Lockfiles con integridad, `npm audit` en la CI, Dependabot |
| Agente de IA comprometido o equivocado | Publicar algo inseguro | Control de seguridad automático y CI obligatoria antes de publicar (sección 9) |


3. Controles frente al OWASP Top 10 (2021)
------------------------------------------

| Riesgo | Cómo se controla | Evidencia | Estado |
|---|---|---|---|
| A01 Control de acceso roto | Reglas de Firestore por permiso, por propietario y por estado; la interfaz no decide nada | `firebase/pruebas/reglas.test.ts` (16 pruebas) | PASSED |
| A02 Fallas criptográficas | HTTPS en todo, HSTS de 2 años con `preload`; contraseñas en Firebase (nunca en Firestore); códigos como SHA-256 con sal (uid y ingreso) | Control automático (HSTS ≥ 1 año) | VERIFIED |
| A03 Inyección | Firestore no usa SQL; las reglas validan tipos y longitudes; Angular escapa todo lo que pinta; sin `innerHTML`, `eval` ni `bypassSecurityTrust`; nodemailer actualizado (inyección SMTP) | Control automático; pruebas S3 y S4 | PASSED |
| A04 Diseño inseguro | Modelo de amenazas (sección 2); límites de abuso en funciones y asistente; sesiones con vencimiento | Este documento | PASSED |
| A05 Configuración insegura | CSP sin scripts en línea, `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP; sin mapas de código en producción; producción nunca apunta a emuladores | Control automático `--dist` | VERIFIED |
| A06 Componentes vulnerables | `npm audit` sin vulnerabilidades en producción (3 paquetes); Dependabot semanal | CI, trabajo `seguridad` | VERIFIED |
| A07 Fallas de identificación y autenticación | Verificación en dos pasos; contraseñas de 10 a 72 caracteres con letra y número; mensajes que no revelan si un correo existe; cierre por inactividad y máximo de 12 horas | Pruebas S5, de ingreso y de reglas | PASSED |
| A08 Fallas de integridad de software y datos | Lockfiles con integridad; la CI corre antes de publicar; evaluaciones finalizadas inmutables; la verificación solo la escribe la función | CI; reglas | PASSED |
| A09 Fallas de registro y monitoreo | Bitácora `auditoria` de acciones administrativas y de seguridad (sesión verificada, código bloqueado por intentos) | `firebase/funciones/src/index.ts` | PASSED |
| A10 SSRF | Las funciones no piden URLs que entregue el usuario | Revisión del código | NOT APPLICABLE |


4. Usuarios, autenticación y sesiones
-------------------------------------

| Control | Detalle |
|---|---|
| Contraseñas | Las guarda y cifra Firebase Authentication; mínimo 10 caracteres con letra y número (la misma política se configura en la consola) |
| Verificación en dos pasos | Código de 6 dígitos por correo después de la contraseña o del proveedor externo. Vence en 10 minutos, admite 5 intentos, se reenvía tras 1 minuto y como máximo 5 veces por hora. Se guarda solo su resumen SHA-256 y se compara en tiempo constante |
| Aplicación en el servidor | `sesion()` en las reglas exige que el `auth_time` del token esté en `verificaciones/{uid}`, que solo escribe la Cloud Function. Sin el código, la sesión de Firebase no lee ni escribe nada |
| Fuerza bruta | Firebase bloquea temporalmente tras intentos fallidos de contraseña; el código se invalida a los 5 intentos y queda registrado en `auditoria` (`seguridad.codigo_bloqueado`) |
| Enumeración de cuentas | Ingreso y recuperación responden igual exista o no el correo |
| Duración de la sesión | Termina al cerrar la pestaña (`browserSessionPersistence`), tras 30 minutos sin actividad y, en el servidor, a las 12 horas del ingreso aunque el token se renueve |
| Revocación inmediata | Inactivar a la persona o a su rol corta el acceso en la siguiente operación. Borrar `verificaciones/{uid}` (desde la consola) obliga a todas sus sesiones a pedir un código nuevo |
| Mínimo privilegio | Cuatro roles base; nadie cambia su propio rol ni se inactiva; el Administrador conserva siempre todos los permisos; los roles base no se inactivan |
| Cuentas creadas por el administrador | Se crean en una instancia secundaria de Firebase para no tocar la sesión del administrador |


5. Ataques y cómo se bloquean
-----------------------------

| Ataque | Defensa | Prueba |
|---|---|---|
| XSS reflejado, almacenado y en el DOM | Angular escapa toda interpolación; el control automático prohíbe `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, `document.write` y `bypassSecurityTrust`; CSP sin scripts en línea | S3, S4 |
| Clickjacking | `frame-ancestors 'none'` y `X-Frame-Options: DENY` | Control automático |
| CSRF | No aplica: la autenticación viaja en un token del SDK, no en cookies que el navegador envíe solo | — |
| IDOR / BOLA | Cada documento se autoriza en las reglas por permiso o por propietario | Pruebas de reglas |
| Escalada de privilegios | Reglas: rol y estado propios no se cambian; solo `usuarios.gestionar` crea cuentas con otros roles | Pruebas de reglas |
| Redirección abierta | `rutaDeRegreso` rechaza `//`, barra invertida, esquemas y caracteres de control | `navegacion.spec.ts`, S2 |
| Tabnabbing | El control automático exige `rel="noopener"` en enlaces que abren otra pestaña | Control automático |
| Enlace con `%` mal formado | El router y el manejador global de errores mantienen la pantalla usable | S1 |
| Fuerza bruta del código | 5 intentos por código, 5 códigos por hora, registro en la bitácora | Revisión del código; prueba de código incorrecto |
| Ataque de tiempo sobre el código | `timingSafeEqual` | Control automático |
| Inyección SMTP | El destino sale del token verificado; nodemailer 10.5 corrige la inyección por CRLF | `npm audit` |
| Inyección de instrucciones en la IA | Sin herramientas ni datos privados en el contexto; respuesta tratada como texto plano; recomendaciones validadas por esquema (`validarSalidaIA`) | Revisión del código |
| Denegación de servicio y de cartera | Límites de códigos, `maxInstances: 10` en las funciones, tope de 30 preguntas libres por sesión y 2 segundos entre ellas | Revisión del código |
| Cadena de suministro | Lockfiles con `integrity`, `npm audit --omit=dev --audit-level=high` en la CI, Dependabot, versiones vulnerables de `@grpc/grpc-js` forzadas a la corregida | CI |


6. Fugas de información
-----------------------

| Riesgo | Control | Estado |
|---|---|---|
| Secretos en el código | Control automático en cada compilación y búsqueda en todo el historial de Git (40 commits, todas las ramas: 0 secretos) | VERIFIED |
| Secretos de correo | `CORREO_USUARIO` y `CORREO_CLAVE` en Secret Manager; `.env`, `.env.*`, llaves `.pem` y cuentas de servicio ignoradas por Git | VERIFIED |
| Clave web de Firebase | Es pública por diseño y solo puede estar en `firebase.config.ts` (regla del control automático) | VERIFIED |
| Detalles técnicos en pantalla | Los errores se traducen a mensajes en español; el manejador global nunca muestra la pila | PASSED (S6) |
| Mapas de código en producción | El control `--dist` falla si aparece un `.map` | VERIFIED |
| Códigos de verificación | Solo su resumen SHA-256; nunca en registros ni en la bitácora; solo vuelven en la respuesta dentro de los emuladores | VERIFIED |
| Datos personales a la IA | No se envían nombres, documentos, teléfonos ni correos | PASSED |
| Informes PDF | Se generan en el navegador y no se guardan en ningún servidor | PASSED |
| Datos a otros sitios | `Referrer-Policy: strict-origin-when-cross-origin`; sin analítica ni publicidad; `Permissions-Policy` niega cámara, micrófono, pagos y USB | VERIFIED |
| Cookies y almacenamiento | Solo esenciales (sesión y modo claro u oscuro); aviso y política en `/cookies` | PASSED |
| Correos de propietarios en otros predios | Un propietario solo lee los documentos con su correo | PASSED |


7. Hallazgos de esta revisión
-----------------------------

### H1 · Dependencias de producción con vulnerabilidades conocidas
- **Evidence:** `npm audit --omit=dev` encontró en la interfaz una fuga del token XSRF en `@angular/common` 20.3.33 (moderada) y `@grpc/grpc-js` 1.9.16 (alta); en las funciones, inyección de comandos SMTP en `nodemailer` 7 (alta) y `uuid` vulnerable en `firebase-admin` 13 (moderada).
- **Severity:** HIGH. **Exploitability:** baja en este uso (no se usa el cliente HTTP con XSRF ni gRPC en el navegador; el destino del correo sale del token), pero se corrige igual.
- **Fix aplicado:** Angular 20.3.35, Firebase 13.3.0, `@grpc/grpc-js` ≥ 1.14.7 por `overrides`, `firebase-admin` 14.5.1, `nodemailer` 10.5.0 y `firebase-tools` 15.36.0.
- **Status:** **VERIFIED**: 0 vulnerabilidades de producción en los tres paquetes. La CI bloquea las nuevas altas o críticas.

### H2 · La sesión verificada no tenía un vencimiento absoluto
- **Evidence:** Firebase renueva el token cada hora; una pestaña abierta podía mantener el acceso durante días.
- **Severity:** LOW. **Fix aplicado:** las reglas rechazan cualquier sesión con más de 12 horas desde el ingreso.
- **Regression test:** *un inicio de sesión verificado vence a las 12 horas* (reglas). **Status:** **VERIFIED**.

### H3 · `rutaDeRegreso` aceptaba `/\otro.sitio`
- **Evidence:** los navegadores leen la barra invertida como `/`. El router de Angular navega solo dentro de la aplicación, así que **no fue explotable**, pero la función quedaba frágil ante cambios.
- **Severity:** INFORMATIONAL. **Fix aplicado:** se rechazan barras invertidas, `//`, esquemas, caracteres de control y rutas de más de 300 caracteres.
- **Regression test:** `navegacion.spec.ts` y S2. **Status:** **VERIFIED**.

### H4 · Un error inesperado dejaba la pantalla sin aviso
- **Evidence:** sin manejador propio, un fallo solo quedaba en la consola (el mismo problema que el H1 de Forja).
- **Fix aplicado:** `ManejadorErrores` muestra un aviso en español sin detalles técnicos, como el `ErrorBoundary` de Forja. **Regression test:** S1. **Status:** **VERIFIED**.

### H5 · `.gitignore` no cubría `.env.*`, llaves ni `.secret.local` en la raíz
- **Fix aplicado:** patrones agregados y comprobados por el control automático con `git check-ignore`. **Status:** **VERIFIED**.

### H6 · La integración continua tenía permisos por defecto
- **Fix aplicado:** `permissions: contents: read`, tiempo máximo por trabajo, cancelación de corridas repetidas y un trabajo `seguridad` del que dependen las pruebas de extremo a extremo. **Status:** **VERIFIED** (revisión).

### H7 · El asistente no limitaba las preguntas libres
- **Impact:** cada pregunta consume cuota de Gemini (denegación de cartera).
- **Fix aplicado:** 30 preguntas libres por sesión y 2 segundos entre ellas. **Status:** **RESIDUAL RISK**: el límite vive en el navegador. El control de servidor es App Check (acción del dueño, sección 10).

### H8 · Vulnerabilidades moderadas en herramientas de desarrollo
- **Evidence:** `npm audit` (incluyendo desarrollo) reporta moderadas en `@angular/cli`, `karma` y `firebase-tools`. No llegan al navegador ni a las funciones.
- **Status:** **RESIDUAL RISK** aceptado; Dependabot las propondrá cuando haya versiones compatibles (algunas exigen Angular 21).

### H9 · La CSP permite estilos en línea (`style-src 'unsafe-inline'`)
- **Evidence:** Angular inserta los estilos de cada componente en etiquetas `<style>`. Los scripts sí están restringidos, así que no permite ejecutar JavaScript.
- **Status:** **RESIDUAL RISK** aceptado (igual que el H4 de Forja).

### H10 · Protección de la rama `main`
- **Evidence:** el equipo publica directamente en `main`; no se pudo comprobar si GitHub exige la CI antes de fusionar.
- **Recommended fix:** en GitHub, *Settings › Branches*, exigir que los trabajos `seguridad`, `reglas`, `interfaz` y `extremo-a-extremo` pasen antes de actualizar `main`. **Status:** **NOT YET VALIDATED** (requiere al dueño).


8. Postura de los controles
---------------------------

| Control | Estado | Evidencia |
|---|---|---|
| Secretos en código, historial, compilación y paquete | VERIFIED (ninguno) | Control automático y búsqueda en `git log --all -p` |
| Dependencias de producción vulnerables | VERIFIED (0) | `npm audit --omit=dev` en `frontend`, `firebase` y `firebase/funciones` |
| Integridad de los lockfiles | VERIFIED | `package-lock.json` con `integrity` en los tres paquetes |
| Reglas de Firestore | PASSED | 16 pruebas en el emulador |
| Verificación en dos pasos | PASSED | Reglas, pruebas unitarias y de navegador |
| XSS, redirección abierta, entradas mal formadas | PASSED | `e2e/seguridad.spec.ts` (S1–S6), `navegacion.spec.ts` |
| Cabeceras de seguridad | VERIFIED en la compilación | Control automático; servidor local con las cabeceras de `firebase.json`, sin violaciones de CSP |
| Accesibilidad sin romper la seguridad | PASSED | axe en todas las pantallas (pruebas de navegador) |
| Protección de `main` | NOT YET VALIDATED | H10 |
| App Check | NOT YET VALIDATED | Acción del dueño |
| Pruebas de penetración por una persona experta | NOT TESTED | — |
| Ataques y carga reales | NOT YET AVAILABLE | La aplicación aún no tiene tráfico real que observar |


9. Control de seguridad automático
----------------------------------

`scripts/control-seguridad.mjs` corre en el trabajo `seguridad` de la CI y al final de `npm run build` (`postbuild`). Si algo falla, **la compilación termina con error y no se publica**:

1. Ningún secreto en los archivos versionados ni en `frontend/dist`: llaves privadas, cuentas de servicio, tokens de GitHub, AWS, Stripe o Slack, cadenas de conexión con contraseña y contraseñas de correo.
2. La clave web de Firebase solo en `firebase.config.ts`; ningún `.env` ni credencial versionados; `.gitignore` los excluye.
3. Sin APIs que ejecuten texto como código o lo inserten como HTML.
4. Enlaces `target="_blank"` siempre con `rel="noopener"`.
5. Cabeceras completas en `firebase.json`; CSP sin `'unsafe-inline'`, `'unsafe-eval'` ni `data:` en `script-src`, con `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` y `default-src 'self'`; HSTS de al menos un año; `index.html` sin scripts en línea.
6. Reglas sin `allow … if true`, sin modo de prueba, con `sesion()` exigiendo `dosPasos()`, `codigosAcceso` cerrada y `verificaciones` sin escritura desde la aplicación.
7. Funciones con la contraseña desde Secret Manager, comparación en tiempo constante y el código de prueba solo en los emuladores.
8. Producción con Firebase real; la compilación sin mapas de código ni configuración de emuladores.

Se comprobó plantando un token falso de GitHub, un `innerHTML` y `'unsafe-inline'` en la CSP: el control falló con los tres problemas (14 de noviembre de 2026).


10. Acciones pendientes del dueño del proyecto
----------------------------------------------

Estas acciones requieren permisos de administrador en GitHub o en la consola de Firebase, que el agente no tiene:

1. **Proteger `main`** y exigir la CI (H10).
2. **Activar el reporte privado de vulnerabilidades** en GitHub (*Settings › Code security › Private vulnerability reporting*), al que apuntan `SECURITY.md` y `/.well-known/security.txt`, y las **alertas de Dependabot**.
3. **Activar App Check** con reCAPTCHA Enterprise para Firestore, Functions y AI Logic, de modo que solo la aplicación publicada pueda usarlos (H7).
4. En Authentication: **política de contraseñas** (10 caracteres y un número) y **protección contra la enumeración de correos** (*Settings › User actions*).
5. **Verificación en dos pasos en las cuentas de Google** de quienes administran la consola de Firebase.
6. **Alerta de presupuesto** en el plan Blaze (por ejemplo, 5 USD).
7. Borrar las claves de cuentas de servicio que ya no se usen (*Configuración del proyecto › Cuentas de servicio*).
8. Escribir el correo de contacto de datos personales en `CONTACTO_PRIVACIDAD`.


11. Respuesta a incidentes
--------------------------

| Situación | Qué hacer |
|---|---|
| Cuenta comprometida | Inactivar al usuario en *Usuarios* (corta el acceso al instante), borrar `verificaciones/{uid}` en la consola y pedirle restablecer la contraseña |
| Se filtró la contraseña del correo que envía los códigos | Revocar la contraseña de aplicación en Google y guardar una nueva con `firebase functions:secrets:set CORREO_CLAVE` |
| Se filtró una cuenta de servicio | Borrar la clave en la consola de Firebase y revisar la bitácora `auditoria` |
| Muchos `seguridad.codigo_bloqueado` | Posible ataque a esa cuenta: contactar a la persona y cambiar su contraseña |
| Datos alterados | Revisar `auditoria` y restaurar desde la exportación de Firestore (`docs/DESPLIEGUE.md`, *Respaldos*) |
| Vulnerabilidad reportada | Confirmar en menos de 5 días hábiles, corregir con prueba de regresión y anotarla en este documento |


12. Seguridad del proceso con agentes de IA
-------------------------------------------

| Control | Estado |
|---|---|
| El contenido externo (páginas, documentos, otros repositorios como Forja Digital) se trata como datos, no como instrucciones | Aplicado |
| Mínimo privilegio | El agente puede escribir en el repositorio; **no** tiene la cuenta de servicio, los secretos de correo ni acceso a la consola de Firebase |
| Ejecución aislada | Compilaciones y pruebas en un contenedor temporal, nunca en el equipo del dueño |
| Nada se publica sin pruebas | El agente corre el control automático y las cuatro suites antes de cada commit; la publicación en Firebase la hace una persona |
| Rastro de auditoría | Cada commit describe qué cambió y qué pruebas pasaron |
