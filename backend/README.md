Servicio de aplicación (API)
============================

API REST de ICA Bienestar Animal, construida con NestJS 11, TypeORM y PostgreSQL. Atiende la autenticación, la recuperación de contraseña, la gestión de usuarios y roles y el registro de auditoría. Todas las rutas se publican bajo el prefijo `/api`.


Requisitos
----------

Node.js 22 y PostgreSQL 16, local o administrado en Cloud SQL.


Configuración
-------------

La configuración se lee de variables de entorno. El archivo `.env.example` contiene una plantilla con valores para desarrollo; se copia como `.env` y se ajusta según el ambiente. El archivo `.env` nunca debe incorporarse al repositorio.

| Variable | Descripción | Valor de desarrollo |
|---|---|---|
| `NODE_ENV` | Ambiente de ejecución | `development` |
| `PORT` | Puerto del servicio | `3000` |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma | `http://localhost:4200` |
| `DB_HOST`, `DB_PORT` | Servidor de PostgreSQL | `localhost`, `5432` |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciales y base de datos | `ica`, `ica_dev`, `ica_bienestar` |
| `DB_SOCKET_PATH` | Socket del conector de Cloud SQL. Si se define, reemplaza a `DB_HOST` | vacío |
| `DB_SSL` | Conexión cifrada con la base de datos | `false` |
| `DB_MIGRATIONS_RUN` | Aplica las migraciones pendientes al iniciar | sin definir |
| `JWT_SECRET` | Clave de firma de los tokens. En producción debe tener al menos 32 caracteres | valor de ejemplo |
| `JWT_EXPIRES_IN` | Vigencia del token de acceso | `8h` |
| `FRONTEND_URL` | Dirección de la interfaz, usada en los enlaces de los correos | `http://localhost:4200` |
| `RESET_TOKEN_TTL_MINUTES` | Vigencia del enlace de recuperación de contraseña | `30` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Servidor de correo. Sin `SMTP_HOST`, los correos se escriben en el registro del servicio. En producción es obligatorio | vacío |
| `MAIL_FROM` | Remitente de los correos | `ICA Bienestar Animal <no-responder@ica-bienestar.local>` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Cuenta de administrador inicial que crea la carga de datos | `admin@ica-bienestar.local`, `CambiarEsta.2026` |
| `THROTTLE_DISABLED` | Desactiva el límite de peticiones. Solo para pruebas locales; el servicio no inicia con este valor en producción | `false` |


Comandos
--------

| Comando | Función |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run migration:run` | Crea o actualiza las tablas de la base de datos |
| `npm run seed` | Crea los roles base y el administrador inicial. Puede ejecutarse varias veces sin duplicar información |
| `npm run start:dev` | Inicia el servicio en modo desarrollo, con recarga automática |
| `npm run build` | Compila el servicio en `dist/` |
| `npm run start:prod` | Inicia el servicio compilado |
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm test` | Ejecuta las pruebas unitarias |
| `npm run test:e2e` | Ejecuta las pruebas de extremo a extremo contra la base `ica_bienestar_test` |
| `npm run migration:generate -- src/database/migrations/Nombre` | Genera una migración a partir de los cambios en las entidades |

Con el servicio en ejecución en modo desarrollo, la documentación interactiva de la API está disponible en `http://localhost:3000/api/docs` y el estado del servicio y de la base de datos en `http://localhost:3000/api/health`.


Organización del código
-----------------------

| Ruta | Responsabilidad |
|---|---|
| `src/auth/` | Inicio de sesión, estrategia JWT, recuperación y cambio de contraseña |
| `src/users/` | Consulta, creación, edición, activación e inactivación de usuarios |
| `src/roles/` | Roles y catálogo de permisos (`constants/permissions.ts`) |
| `src/audit/` | Bitácora de acciones críticas |
| `src/mail/` | Envío de correos y plantillas |
| `src/common/` | Decoradores, guardas de acceso, tipos compartidos, paginación y política de contraseñas |
| `src/config/` | Lectura de la configuración y de la conexión a la base de datos |
| `src/database/` | Fuente de datos, migraciones y carga inicial |
| `src/health/` | Verificación de disponibilidad |
| `test/` | Pruebas de extremo a extremo |

Dentro de cada módulo, el controlador, el servicio y el módulo de Nest están en la raíz de su carpeta; las entidades de TypeORM en `entities/`, los objetos de entrada validados en `dto/` y, cuando aplica, las estrategias en `strategies/` y las constantes en `constants/`. En `src/common/`, las guardas están en `guards/`, los decoradores en `decorators/`, los tipos compartidos en `interfaces/` y las funciones auxiliares en `utils/`.


Seguridad
---------

Las contraseñas se almacenan cifradas con bcrypt y deben tener entre 10 y 72 caracteres, con al menos una letra y un número. Una cuenta se bloquea durante 15 minutos tras cinco intentos fallidos. El inicio de sesión y la solicitud de recuperación tienen límites de peticiones por minuto.

Los enlaces de recuperación son de un solo uso y en la base de datos solo se guarda su huella SHA-256. En cada petición se vuelve a consultar el usuario autenticado, de modo que una inactivación, un cambio de rol o un cambio de contraseña surten efecto de inmediato. Las acciones críticas quedan registradas en la tabla `audit_logs`.

El detalle de la arquitectura, el modelo de datos y la lista de servicios se encuentra en [docs/ARQUITECTURA.md](../docs/ARQUITECTURA.md).
