Manual de instalación
=====================

Este manual describe cómo preparar un equipo para ejecutar ICA Bienestar Animal en modo de desarrollo y cómo consultar la aplicación desde un computador o desde un teléfono móvil.


Vista rápida sin base de datos
------------------------------

Si el propósito es únicamente conocer las pantallas, no es necesario instalar MariaDB ni ejecutar el servicio de aplicación. Basta con instalar Node.js 22 desde https://nodejs.org, abrir una terminal nueva en la carpeta del proyecto y ejecutar:

```bash
cd frontend
npm install
npm run demo
```

La aplicación queda disponible en `http://localhost:4200`, con el correo `admin@ica-bienestar.local` y la contraseña `CambiarEsta.2026`. Con la misma contraseña se puede ingresar como `evaluador@ica-bienestar.local` o como `propietario@ica-bienestar.local` para ver la aplicación desde esos roles. En este modo los datos son de prueba, se guardan solo en el navegador y no se envían correos. Para el uso real del sistema se siguen las secciones restantes de este manual.

**Ubicación de la carpeta en Windows.** Al descomprimir el archivo ZIP, Windows suele crear una carpeta dentro de otra con el mismo nombre. Antes de ejecutar `cd frontend` debe abrirse la carpeta que contiene directamente las carpetas `backend`, `frontend` y `docs`. En Visual Studio Code esto se logra con **File → Open Folder** sobre esa carpeta interior.

**Comando `npm` no reconocido.** Este mensaje indica que Node.js no está instalado o que la terminal se abrió antes de instalarlo. Debe instalarse Node.js y abrirse una terminal nueva; si se usa Visual Studio Code, debe cerrarse y abrirse de nuevo el programa.


Componentes que se ejecutan
---------------------------

El sistema se compone de tres elementos, y los tres deben estar activos para usar la aplicación:

- **Base de datos MariaDB:** almacena usuarios, roles, predios, evaluaciones, recomendaciones, informes y la bitácora de auditoría.
- **Servicio de aplicación (API):** atiende el inicio de sesión, la gestión de la información, el cálculo de las evaluaciones y la generación de los informes PDF. Se ejecuta desde la carpeta `backend`.
- **Interfaz web:** presenta las pantallas en el navegador. Se ejecuta desde la carpeta `frontend`.

El servicio de aplicación y la interfaz web se mantienen abiertos, cada uno en una terminal diferente, mientras se usa la aplicación.


Requisitos del equipo
---------------------

| Programa | Versión | Uso |
|---|---|---|
| Node.js | 22 o superior | Ejecuta el servicio de aplicación y la interfaz web |
| MariaDB | 10.11 o superior; se recomienda la 11.4 | Base de datos |
| Git | Reciente | Descarga del repositorio |
| Google Chrome | Reciente | Navegador recomendado |


Descarga del repositorio
------------------------

El código completo se encuentra en la rama `main`. Puede descargarse desde GitHub con el botón **Code** y la opción **Download ZIP**, o clonarse con Git:

```bash
git clone https://github.com/98765432100123456/Aplicacion-a-la-inteligencia-artificial-.git
cd Aplicacion-a-la-inteligencia-artificial-
```

La descarga no incluye las dependencias de Node.js (carpetas `node_modules`); estas se instalan con `npm install`, como se indica en las secciones siguientes.


Preparación de la base de datos
-------------------------------

**Instalación de MariaDB**

- **Windows.** Se descarga el instalador MSI de la versión 11.4 desde https://mariadb.org/download. Durante la instalación se define una contraseña para el usuario `root`, se deja marcada la opción *Install as service* y se conserva el puerto 3306. El instalador agrega la consola **MariaDB Command Prompt** y el programa gráfico HeidiSQL.
- **macOS.** Con Homebrew: `brew install mariadb` y luego `brew services start mariadb`.
- **Linux (Ubuntu o Debian).** `sudo apt install mariadb-server` y luego `sudo systemctl enable --now mariadb`.

**Base de datos y usuario de la aplicación**

Se abre la consola de MariaDB como administrador. En Windows se usa **MariaDB Command Prompt** con `mariadb -u root -p`; en macOS y Linux, `sudo mariadb`. Dentro de la consola se ejecuta, una sola vez:

```sql
CREATE DATABASE ica_bienestar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ica_bienestar_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ica'@'localhost' IDENTIFIED BY 'ica_dev';
CREATE USER 'ica'@'127.0.0.1' IDENTIFIED BY 'ica_dev';
GRANT ALL PRIVILEGES ON ica_bienestar.* TO 'ica'@'localhost', 'ica'@'127.0.0.1';
GRANT ALL PRIVILEGES ON ica_bienestar_test.* TO 'ica'@'localhost', 'ica'@'127.0.0.1';
EXIT;
```

La base `ica_bienestar` guarda la información de la aplicación y `ica_bienestar_test` se usa solo para las pruebas automáticas, que la borran y la recrean en cada ejecución. El usuario `ica` solo tiene permisos sobre esas dos bases; la contraseña `ica_dev` sirve únicamente para un equipo de desarrollo.


Preparación del servicio de aplicación
--------------------------------------

Desde la carpeta `backend` se instalan las dependencias y se copia la configuración de ejemplo:

```bash
cd backend
npm install
cp .env.example .env
```

En Windows, con la consola de comandos, la copia se realiza con `copy .env.example .env`. Los valores del archivo `.env` funcionan sin cambios con la base de datos creada en la sección anterior.

A continuación se crean las tablas y se cargan los roles base, las especies y el administrador inicial:

```bash
npm run migration:run
npm run seed
```


Preparación de la interfaz web
------------------------------

Desde la carpeta `frontend` se instalan las dependencias:

```bash
cd frontend
npm install
```


Ejecución diaria
----------------

Con el equipo preparado, cada vez que se desee usar la aplicación se abren dos terminales. En la primera se inicia el servicio de aplicación:

```bash
cd backend
npm run start:dev
```

En la segunda se inicia la interfaz web:

```bash
cd frontend
npm start
```

La aplicación queda disponible en Chrome en la dirección `http://localhost:4200`. Para detener cualquiera de los dos procesos se presiona `Ctrl + C` en su terminal.

**Cuenta inicial**

| Campo | Valor |
|---|---|
| Correo electrónico | `admin@ica-bienestar.local` |
| Contraseña | `CambiarEsta.2026` |

Se recomienda cambiar la contraseña desde la sección **Cuenta** después del primer ingreso.


Consulta desde un teléfono móvil
--------------------------------

El teléfono no ejecuta ningún comando; únicamente abre la página que sirve el computador. Para ello, el computador y el teléfono deben estar conectados a la misma red WiFi, y la interfaz web se inicia de modo que acepte conexiones de otros dispositivos de la red:

```bash
cd frontend
npm start -- --host 0.0.0.0
```

Luego se consulta la dirección IP del computador en la red local. En Windows se obtiene con el comando `ipconfig`, en la línea *Dirección IPv4*; en macOS, con `ipconfig getifaddr en0`; en Linux, con `hostname -I`. Con esa dirección, por ejemplo `192.168.1.20`, se abre en el Chrome del teléfono:

```text
http://192.168.1.20:4200
```

El servicio de aplicación no requiere ningún ajuste adicional, porque la interfaz web le reenvía las peticiones dentro del mismo computador. Si el teléfono no logra abrir la página, se debe verificar que el cortafuegos del computador permita conexiones entrantes en el puerto 4200.

**Vista de teléfono en el computador**

Para revisar el diseño móvil sin un teléfono, se abre `http://localhost:4200` en Chrome, se presiona `Ctrl + Shift + M` (en macOS, `Cmd + Shift + M`) y se selecciona un modelo de teléfono en la barra superior de la vista.


Servicios opcionales
--------------------

El sistema funciona completo sin servicios externos. Dos de ellos se activan con variables del archivo `backend/.env`, y el servicio de aplicación debe reiniciarse después de cambiarlas:

| Servicio | Variables | Sin configurar |
|---|---|---|
| Recomendaciones con IA (API de Claude) | `ANTHROPIC_API_KEY`, con una clave creada en https://console.anthropic.com | Las recomendaciones se generan con reglas a partir de la norma |
| Ingreso con Google, Facebook o Microsoft (Firebase Authentication) | `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` y `FIREBASE_AUTH_DOMAIN` | Solo se ingresa con correo y contraseña |

La configuración de cada servicio se detalla en la guía de [implementación del servidor](DESPLIEGUE.md). Las claves nunca se escriben en el código ni se suben al repositorio.


Correos electrónicos en desarrollo
----------------------------------

Mientras la variable `SMTP_HOST` permanezca vacía en `backend/.env`, el sistema no envía correos: el contenido de cada mensaje de invitación o de recuperación de contraseña se escribe en la terminal del servicio de aplicación. Desde allí se copia el enlace y se abre en el navegador. Para el envío real se configuran las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASSWORD` con los datos de un servidor de correo.


Alternativa con contenedores
----------------------------

En un equipo con Docker instalado es posible levantar la base de datos, el servicio de aplicación y la interfaz web con un solo comando desde la raíz del repositorio:

```bash
docker compose up --build
```

Una vez iniciados los contenedores, se cargan los datos iniciales con:

```bash
docker compose exec api node dist/database/seed.js
```

En esta modalidad la aplicación se consulta en `http://localhost:8080`. Para un servidor de producción, con HTTPS y respaldos, se sigue la guía de [implementación del servidor](DESPLIEGUE.md).


Problemas frecuentes
--------------------

| Situación | Causa probable y solución |
|---|---|
| La pantalla de ingreso indica que no hay conexión con el servidor | El servicio de aplicación no está en ejecución. Debe iniciarse con `npm run start:dev` en la carpeta `backend` |
| El servicio de aplicación no inicia y menciona la base de datos | MariaDB no está en ejecución o los datos de conexión en `backend/.env` no coinciden con los de la base creada. En Windows se revisa que el servicio *MariaDB* esté iniciado en la aplicación **Servicios** |
| El servicio indica `Access denied for user 'ica'` | El usuario no se creó o la contraseña no coincide con `DB_PASSWORD`. Se repiten las instrucciones de *Base de datos y usuario de la aplicación* |
| El servicio indica que falta la variable `JWT_SECRET` | No existe el archivo `backend/.env`. Debe copiarse desde `.env.example` |
| El ingreso responde "Demasiados intentos seguidos" | Se superó el límite de peticiones por minuto. Basta con esperar un minuto |
| El ingreso indica que la cuenta está bloqueada | Hubo cinco intentos fallidos. La cuenta se desbloquea a los 15 minutos o al restablecer la contraseña |
| `npm` no se reconoce como comando | Node.js no está instalado, o la terminal se abrió antes de instalarlo. Debe instalarse Node.js y abrirse una terminal nueva |
| PowerShell indica que no se puede cargar `npm.ps1` porque la ejecución de scripts está deshabilitada | Windows bloquea los scripts de PowerShell por defecto. Se habilitan una sola vez para el usuario con `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, o se usa `npm.cmd` en lugar de `npm` |
| `mariadb` no se reconoce como comando | La carpeta de MariaDB no está en la ruta del sistema. Se usa la consola **MariaDB Command Prompt** del menú Inicio, o la ruta completa, por ejemplo `& "C:\Program Files\MariaDB 11.4\bin\mariadb.exe" -u root -p` |
| `cd frontend` indica que la ruta no existe | La terminal está en una carpeta exterior. Debe ubicarse en la carpeta que contiene `backend` y `frontend` |
| El puerto 4200 o 3000 ya está en uso | Otro proceso ocupa el puerto. Debe cerrarse ese proceso o la terminal anterior de la aplicación |
