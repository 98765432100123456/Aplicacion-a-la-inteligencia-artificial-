Herramientas de Firebase
========================

Esta carpeta contiene lo que vive en el proyecto de Firebase `bienestar-animal-ica` y no en la interfaz: las reglas de seguridad de Firestore, la carga inicial de datos y las pruebas de las reglas. La configuración general está en `firebase.json` y `.firebaserc`, en la raíz del repositorio.

| Archivo | Contenido |
|---|---|
| `firestore.rules` | Reglas de seguridad: quién puede leer y escribir cada colección |
| `firestore.indexes.json` | Índices compuestos de Firestore (por ahora no se necesitan) |
| `semilla.ts` | Carga inicial: roles, especies, libertades, niveles, los 23 criterios y el primer administrador |
| `pruebas/reglas.test.ts` | Pruebas de las reglas contra el emulador |
| `compartido/` | Copia generada de la carpeta `compartido/` de la raíz. No se edita aquí |


Requisitos
----------

Node.js 22 y Java 21 o posterior (los emuladores de Firebase son programas Java). Las dependencias se instalan con `npm install` en esta carpeta.


Comandos
--------

| Comando | Función |
|---|---|
| `npm run emuladores` | Inicia los emuladores de Auth (puerto 9099) y Firestore (puerto 8080) y su consola en `http://localhost:4000` |
| `npm run semilla:emulador` | Carga los datos iniciales en los emuladores en ejecución |
| `npm run test:reglas` | Inicia los emuladores, ejecuta las pruebas de las reglas y los detiene |
| `npm run semilla` | Carga los datos iniciales en el proyecto real; requiere una cuenta de servicio |
| `npm run desplegar:reglas` | Publica las reglas y los índices en el proyecto real |
| `npm run desplegar:sitio` | Publica la interfaz compilada en Firebase Hosting |

Para crear el administrador inicial, la semilla lee las variables `SEMILLA_ADMIN_CORREO` y `SEMILLA_ADMIN_CLAVE`. En PowerShell se definen antes de ejecutarla:

```powershell
$env:SEMILLA_ADMIN_CORREO = "admin@ica-bienestar.local"
$env:SEMILLA_ADMIN_CLAVE = "CambiarEsta.2026"
npm.cmd run semilla:emulador
```

La guía completa de publicación, cuentas de servicio y configuración de la consola de Firebase está en [docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md).
