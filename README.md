# ICA Bienestar Animal

Aplicación web para evaluar el bienestar animal en fincas: listas de chequeo por especie, puntaje automático, diagnóstico, recomendaciones con IA y plan de mejora. Se construye a partir del documento *Requerimientos funcionales Aplicación ICA – Bienestar Animal* (PhD. Paola Andrea Valencia A.).

**Estado: Sprint 1.** Ya funcionan el ingreso, la recuperación de contraseña, la gestión de usuarios y la gestión de roles con permisos. El avance por requerimiento está en [docs/PLAN-DE-TRABAJO.md](docs/PLAN-DE-TRABAJO.md).

| | |
|---|---|
| Frontend | Angular 20 · `frontend/` |
| Backend | NestJS 11 + TypeORM · `backend/` |
| Base de datos | PostgreSQL 16 (Cloud SQL en producción) |
| Nube | Google Cloud: Firebase Hosting, Cloud Run, Cloud SQL y Secret Manager |

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md): diagramas, conexión frontend–backend–base de datos, modelo de datos, API y despliegue.
- [Sistema de diseño](docs/SISTEMA-DE-DISENO.md): paleta con contrastes en modo claro y oscuro, tipografía, componentes y decisiones.
- [Revisión con Apple HIG](docs/REVISION-APPLE-HIG.md): auditoría de diseño con las guías de Apple y de Vercel, y lo que se corrigió.
- [Plan de trabajo](docs/PLAN-DE-TRABAJO.md): qué está hecho y qué sigue, requerimiento por requerimiento.
- [Ramas](docs/RAMAS.md): flujo de trabajo con Git.

## Ejecutar en local

Requisitos: Node.js 22 y PostgreSQL 16 (o Docker).

### 1. Base de datos

```bash
# Con Docker
docker compose up -d db

# O con un PostgreSQL ya instalado
psql -U postgres -c "CREATE USER ica WITH PASSWORD 'ica_dev' CREATEDB;"
psql -U postgres -c "CREATE DATABASE ica_bienestar OWNER ica;"
```

### 2. API

```bash
cd backend
cp .env.example .env        # revisar valores
npm install
npm run migration:run       # crea las tablas
npm run seed                # crea los roles base y el administrador inicial
npm run start:dev           # http://localhost:3000/api  ·  Swagger en /api/docs
```

### 3. Web

```bash
cd frontend
npm install
npm start                   # http://localhost:4200 (envía /api al puerto 3000)
```

Ingrese con el administrador que define `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) y cambie la contraseña en **Cuenta**.

En desarrollo, si `SMTP_HOST` está vacío, los correos de invitación y recuperación no se envían: se escriben en la consola de la API, de donde se copia el enlace.

### Todo con Docker

```bash
docker compose up --build
docker compose exec api node dist/database/seed.js
# Web: http://localhost:8080
```

## Pruebas

| Comando | Qué prueba |
|---|---|
| `cd backend && npm test` | Pruebas unitarias de la API |
| `cd backend && npm run test:e2e` | Flujos completos contra PostgreSQL (base `ica_bienestar_test`, se reinicia en cada ejecución) |
| `cd frontend && npm run test:ci` | Pruebas unitarias del frontend (Chrome sin interfaz) |
| `cd frontend && npm run e2e` | Playwright a 1440 y 390 px: flujos, accesibilidad con axe-core en modo claro y oscuro, texto al 200 %, teclado, desbordamiento y tamaño táctil. Requiere la API (con `THROTTLE_DISABLED=true`) y la web corriendo |

La CI (`.github/workflows/ci.yml`) ejecuta las pruebas de la API y del frontend, y el build, en cada push y pull request.

## Estructura

```
.
├── backend/              API NestJS
│   ├── src/auth/         ingreso, JWT, recuperación de contraseña
│   ├── src/users/        gestión de usuarios
│   ├── src/roles/        roles y catálogo de permisos
│   ├── src/audit/        bitácora de auditoría
│   ├── src/mail/         envío de correo
│   ├── src/database/     migraciones y seed
│   └── test/             pruebas e2e
├── frontend/             aplicación Angular
│   ├── src/app/core/     sesión, API, guards
│   ├── src/app/shared/   componentes reutilizables
│   ├── src/app/features/ pantallas por módulo
│   └── e2e/              pruebas Playwright
├── docs/                 arquitectura, diseño, plan y ramas
├── .claude/agents/       agentes especializados (agency-agents) para el desarrollo con Claude Code
├── .claude/skills/       skills de diseño y pruebas (ver abajo)
└── docker-compose.yml
```

## Skills de Claude Code

En `.claude/skills/` hay skills que Claude Code carga automáticamente al trabajar en este repositorio:

| Skill | Para qué | Origen |
|---|---|---|
| `apple-design` | Revisar y mejorar la interfaz con las Human Interface Guidelines de Apple (123 páginas) | [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill) |
| `web-design-guidelines` | Revisar el código contra las Web Interface Guidelines de Vercel | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| `design-taste-frontend` | Dirección de arte para páginas públicas (no para pantallas de la app) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| `image-to-code` | Generar un diseño en imagen y llevarlo a código (requiere generación de imágenes) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| `playwright-cli` | Automatizar el navegador desde la terminal | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) |

`apple-design/references/design-md/apple-DESIGN.md` es la referencia del sistema visual de Apple tomada de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).

## Equipo

- **Esteban:** arquitectura, desarrollo completo y gestión del repositorio.
