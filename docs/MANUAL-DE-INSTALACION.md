Manual de instalación
=====================

Este manual describe cómo preparar un equipo para ejecutar ICA Bienestar Animal y cómo consultar la aplicación desde un computador o desde un teléfono móvil. La aplicación trabaja con Firebase: no hay que instalar una base de datos ni un servidor propio.


Formas de ejecutar la aplicación
--------------------------------

| Forma | Comando, en `frontend` | Datos | Requisitos |
|---|---|---|---|
| Demostración | `npm run demo` | De prueba, solo en el navegador | Node.js 22 |
| Proyecto real | `npm start` | Los del proyecto de Firebase `bienestar-animal-ica` | Node.js 22 y una cuenta en la aplicación |
| Emuladores | `npm run start:emuladores` | Locales, en los emuladores de Firebase | Node.js 22 y Java 21 |

La demostración sirve para conocer las pantallas; el proyecto real, para trabajar; y los emuladores, para probar cambios sin tocar los datos del equipo.


Requisitos del equipo
---------------------

| Programa | Versión | Uso |
|---|---|---|
| Node.js | 22 o superior | Ejecuta la interfaz web y las herramientas de Firebase |
| Java | 21 o superior | Solo para los emuladores de Firebase |
| Git | Reciente | Descarga del repositorio |
| Google Chrome | Reciente | Navegador recomendado |

Node.js se descarga desde https://nodejs.org y Java desde https://adoptium.net (versión 21, *Temurin*). Después de instalarlos se abre una terminal nueva.


Descarga del repositorio
------------------------

El código completo se encuentra en la rama `main`. Puede descargarse desde GitHub con el botón **Code** y la opción **Download ZIP**, o clonarse con Git:

```bash
git clone https://github.com/98765432100123456/Aplicacion-a-la-inteligencia-artificial-.git
cd Aplicacion-a-la-inteligencia-artificial-
```

La descarga no incluye las dependencias de Node.js (carpetas `node_modules`); estas se instalan con `npm install`.

**Ubicación de la carpeta en Windows.** Al descomprimir el archivo ZIP, Windows suele crear una carpeta dentro de otra con el mismo nombre. Antes de ejecutar `cd frontend` debe abrirse la carpeta que contiene directamente las carpetas `frontend`, `firebase` y `docs`. En Visual Studio Code esto se logra con **File → Open Folder** sobre esa carpeta interior.

**PowerShell.** Si PowerShell indica que no puede cargar `npm.ps1` porque la ejecución de scripts está deshabilitada, se usa `npm.cmd` en lugar de `npm` en todos los comandos, o se habilitan los scripts una sola vez para el usuario con `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.


Vista rápida en modo demostración
---------------------------------

```bash
cd frontend
npm install
npm run demo
```

La aplicación queda disponible en `http://localhost:4200`, con el correo `admin@ica-bienestar.local` y la contraseña `CambiarEsta.2026`. Con la misma contraseña se puede ingresar como `evaluador@ica-bienestar.local` o como `propietario@ica-bienestar.local` para ver la aplicación desde esos roles. En este modo los datos son de prueba, se guardan solo en el navegador y no se envían correos.


Uso con el proyecto real de Firebase
------------------------------------

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200` y trabaja con los datos del proyecto `bienestar-animal-ica`. Se ingresa con la cuenta que haya creado el administrador desde la pantalla **Usuarios**; los propietarios pueden crear la suya con **Cree su cuenta**, en la pantalla de ingreso.

La configuración del proyecto ya está en `frontend/src/environments/firebase.config.ts`; no hay que copiar claves ni archivos de configuración. La primera vez que se usa el proyecto, el responsable debe seguir la guía de [implementación en Firebase](DESPLIEGUE.md): publicar las reglas de seguridad, cargar los datos iniciales y crear el primer administrador.


Pruebas locales con los emuladores
----------------------------------

Los emuladores reproducen Firebase Authentication y Firestore en el propio equipo, con las mismas reglas de seguridad. Son la forma de probar cambios sin afectar los datos del equipo. Se usan tres terminales.

**Primera terminal: emuladores**

```bash
cd firebase
npm install
npm run emuladores
```

La primera vez descargan sus archivos. Quedan activos mientras la terminal esté abierta.

**Segunda terminal: datos iniciales.** Se ejecuta una vez cada vez que se inician los emuladores, porque al cerrarlos se borran sus datos. En PowerShell:

```powershell
cd firebase
$env:SEMILLA_ADMIN_CORREO = "admin@ica-bienestar.local"
$env:SEMILLA_ADMIN_CLAVE = "CambiarEsta.2026"
npm.cmd run semilla:emulador
```

En macOS o Linux: `SEMILLA_ADMIN_CORREO=admin@ica-bienestar.local SEMILLA_ADMIN_CLAVE=CambiarEsta.2026 npm run semilla:emulador`.

**Tercera terminal: interfaz**

```bash
cd frontend
npm install
npm run start:emuladores
```

La aplicación queda en `http://localhost:4200`, con la cuenta de administrador que se acaba de crear. La consola de los emuladores, en `http://localhost:4000`, muestra los usuarios, los documentos de Firestore y los correos que se habrían enviado: allí están los enlaces para crear contraseñas y verificar correos.


Consulta desde un teléfono móvil
--------------------------------

El teléfono no ejecuta ningún comando; únicamente abre la página que sirve el computador. El computador y el teléfono deben estar conectados a la misma red WiFi, y la interfaz se inicia de modo que acepte conexiones de otros dispositivos:

```bash
cd frontend
npm start -- --host 0.0.0.0
```

Luego se consulta la dirección IP del computador en la red local. En Windows se obtiene con `ipconfig`, en la línea *Dirección IPv4*; en macOS, con `ipconfig getifaddr en0`; en Linux, con `hostname -I`. Con esa dirección, por ejemplo `192.168.1.20`, se abre en el Chrome del teléfono `http://192.168.1.20:4200`.

El ingreso con Google, Facebook o Microsoft solo funciona en los dominios autorizados en Firebase; desde la dirección IP del computador se ingresa con correo y contraseña. Si el teléfono no logra abrir la página, se verifica que el cortafuegos del computador permita conexiones entrantes en el puerto 4200.

**Vista de teléfono en el computador.** Se abre `http://localhost:4200` en Chrome, se presiona `Ctrl + Shift + M` (en macOS, `Cmd + Shift + M`) y se elige un modelo de teléfono.


Problemas frecuentes
--------------------

| Situación | Causa probable y solución |
|---|---|
| `npm` no se reconoce como comando | Node.js no está instalado, o la terminal se abrió antes de instalarlo. Se instala Node.js y se abre una terminal nueva |
| PowerShell no puede cargar `npm.ps1` | Se usa `npm.cmd`, o se ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `npm install` no encuentra `package.json` | La terminal no está en la carpeta correcta. Debe estar dentro de `frontend` (o de `firebase`, según el paso) |
| `cd frontend` indica que la ruta no existe | La terminal está en una carpeta exterior. Debe ubicarse en la que contiene `frontend` y `firebase` |
| El ingreso responde "Correo o contraseña incorrectos." | Los datos no coinciden con una cuenta del proyecto. Se usa **¿Olvidó su contraseña?** o se pide al administrador que cree la cuenta |
| El ingreso indica que el usuario está inactivo | El administrador lo inactivó, o su rol está inactivo |
| Un propietario no ve su predio | No ha confirmado su correo, o el predio se registró con otro correo. La pantalla lo indica; tras confirmar, se cierra sesión y se ingresa de nuevo |
| Aparece "Su rol no tiene permiso para esta acción." | Las reglas de Firestore rechazaron la operación para ese rol. Se revisan los permisos del rol en **Roles y permisos** |
| Los emuladores no inician y mencionan Java | Java no está instalado o es anterior a la 21 |
| Los emuladores indican que un puerto está en uso | Otra ventana de los emuladores sigue abierta. Se cierra con `Ctrl + C` |
| El puerto 4200 ya está en uso | Otra terminal de la aplicación sigue abierta. Se cierra con `Ctrl + C` |
