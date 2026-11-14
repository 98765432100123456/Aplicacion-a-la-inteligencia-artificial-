# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ICA Bienestar Animal: an Angular 20 web app for evaluating animal welfare on cattle farms against the ICA (Instituto Colombiano Agropecuario) methodology. There is no custom backend: everything runs on Firebase (project `bienestar-animal-ica`) — Authentication, Firestore protected by security rules, Hosting, and Firebase AI Logic (Gemini) for owner recommendations. Code identifiers, comments, docs and UI text are in Spanish; keep it that way.

## Commands

Node 22. Java 21 is needed only for the Firebase emulators. On Windows PowerShell the team uses `npm.cmd`/`npx.cmd`.

Frontend (`cd frontend`):

| Command | Purpose |
|---|---|
| `npm start` | Dev server on :4200 against the real Firebase project |
| `npm run demo` | Dev server with no Firebase: in-browser fake data (login `admin@ica-bienestar.local` / `CambiarEsta.2026`) |
| `npm run start:emuladores` | Dev server against local emulators |
| `npm run build` | Production build to `dist/frontend/browser` (what Hosting serves) |
| `npm run test:ci` | Karma unit tests, headless (`CHROME_BIN` must point to a Chrome/Chromium) |
| `npx ng test --watch=false --browsers=ChromeHeadlessCI --include='src/app/core/norma/**/*.spec.ts'` | Run a single unit spec |
| `npx playwright test` | E2E (needs emulators running and seeded; Playwright starts `start:emuladores` itself) |
| `npx playwright test e2e/predios.spec.ts -g "texto del test" --project=escritorio` | Single E2E test (projects: `escritorio`, `movil`) |

Firebase tools (`cd firebase`):

| Command | Purpose |
|---|---|
| `npm run emuladores` | Builds `funciones/`, then Auth :9099, Firestore :8080, Functions :5001, UI :4000 (project `demo-ica`) |
| `npm run semilla:emulador` | Seed the emulators; set `SEMILLA_ADMIN_CORREO` and `SEMILLA_ADMIN_CLAVE` first to create an admin |
| `npm run test:reglas` | Firestore rules tests (node:test + `@firebase/rules-unit-testing`) inside the emulators |
| `npm run typecheck` | tsc on rules tests and seed |
| `npm run semilla` | Seed the real project (needs `GOOGLE_APPLICATION_CREDENTIALS` with a service-account key, never committed) |
| `npm run desplegar:funciones` / `desplegar:reglas` / `desplegar:sitio` | Deploy Cloud Functions / rules / Hosting to `bienestar-animal-ica` (functions before rules: the rules require the 2FA they write) |

Full E2E run exactly as CI does it (from `firebase/`):

```
SEMILLA_ADMIN_CORREO=admin@ica-bienestar.local SEMILLA_ADMIN_CLAVE=CambiarEsta.2026 \
  npx firebase emulators:exec --config ../firebase.json --project demo-ica --only auth,firestore,functions \
  "npm run semilla:emulador && cd ../frontend && npx playwright test"
```

CI (`.github/workflows/ci.yml`) runs three jobs: `reglas` (copy check + typecheck + rules tests), `interfaz` (unit tests + production and demo builds), `extremo-a-extremo` (the command above).

## Architecture

### Shared domain code: edit `compartido/`, never the copies

`compartido/` at the repo root holds the business rules used by both the browser and the Firebase tools: the 23-criterion checklist (`lista-chequeo.ts`), freedoms/weights/levels/sample size (`norma.ts`), scoring (`calificacion.ts`, function `calificar`), rule-based recommendations, permissions catalog and base roles (`permisos.ts`), AI prompt/schema/validation (`ia.ts`) and the pdfmake report templates (`informes.ts`).

`node scripts/compartido.mjs` copies these files into `frontend/src/app/compartido/` and `firebase/compartido/` with a "generated" header. After editing anything in `compartido/`, run it; CI fails (`--verificar`) if the copies are stale.

### Firebase vs. demo: one facade, two backends

Screens never talk to Firebase directly. They use facade services in `frontend/src/app/core/services/`:

- `AuthService`: delegates to a `ProveedorSesion` (`core/services/sesion/`): `SesionFirebase` or `SesionDemo`.
- `ApiService` (users/roles) and `FarmsApiService` (farms, evaluations, reports): when `environment.demo` is false they call `core/firebase/*` (`usuarios-roles.ts`, `predios-evaluaciones.ts`); in demo mode they make HTTP calls to `/api` that `core/demo/demo-api.interceptor.ts` answers from localStorage data (`core/demo/`).

A feature change usually touches the facade, the Firebase implementation and the demo routes so both modes keep working. Environment files under `src/environments/` select the mode (`environment.ts`, `.development`, `.emuladores`, `.demo`); `firebase.config.ts` holds the public web config and which sign-in providers the UI shows.

`core/firebase/conexion.ts` lazy-loads the Firebase SDK (never loaded in demo mode). Session persistence is per browser tab (`browserSessionPersistence`). Admin-created users are made through a secondary Firebase app (`authSecundaria`) so the admin's session survives.

### Authorization lives in Firestore rules

`firebase/firestore.rules` is the real security boundary. A user's role comes from `usuarios/{uid}.rol`, and permissions from `roles/{rol}.permisos`, checked with `puede(...)` on every read/write. Owners (`propietario` role) see only farms whose `propietarioCorreo` equals their verified email. The rules also validate data shapes, block edits to finalized evaluations and check that `nivel` matches `puntaje` (use float literals like `10.0`: the rules language does integer division otherwise). Any data-model change needs matching rule changes and tests in `firebase/pruebas/reglas.test.ts`. Rule tests use the separate project `demo-ica-reglas` so they don't wipe dev emulator data.

In the UI, `permissionGuard` and `AuthService.can(...)` only hide things; route `data.permissions` in `app.routes.ts` mirrors the rules.

### Two-step verification (email code)

After the password or OAuth popup, `SesionFirebase.siguientePaso` checks `verificaciones/{uid}.sesiones` for the token's `auth_time`; if absent it calls the Cloud Function `enviarCodigoAcceso` (`firebase/funciones/`, needs the Blaze plan and the `CORREO_USUARIO`/`CORREO_CLAVE` secrets) and `AuthService.desafio` makes the login screen show `verificacion-codigo`. `verificarCodigoAcceso` checks the SHA-256 hash in `codigosAcceso/{uid}` (no client access) and appends the `auth_time` to `verificaciones/{uid}`. In the rules, `sesion()` requires `dosPasos()`, so an unverified sign-in reads nothing. In the emulators and in demo mode no email is sent: the code comes back as `codigoPrueba` and the screen shows it (E2E reads `.codigo-prueba` in `e2e/helpers.ts`). Rule tests pass `auth_time` in the token and seed `verificaciones`.

### Evaluation flow

The checklist is filtered per farm by production system (`LECHERIA`/`CARNE`/`DOBLE_PROPOSITO`) and size (`listaPara`). Answers are stored by indicator code (`1.1`…`23.x`). If you reorder indicators, the codes of saved evaluations no longer match.

17 criteria are scored with the ICA "árbol de escenarios" decision trees (`compartido/escenarios.ts`, diagrams 1–19). Each answer adds the points from the diagram, and the cut-offs in `cortes` give the level. The route is stored in the evaluation's `escenarios.{arbolId}.ruta`; `rutaLimpia` drops answers that fall off the path. `usaArboles` keeps older evaluations, fully answered by indicators, on the indicator scoring. The diagrams are checked leaf by leaf in `core/norma/escenarios.spec.ts`, so update both together.

On finalize, `calificar` computes the per-freedom scores (weights 20/50/15/15, scale 0–5) and the level. Inside a freedom, a tree counts as `puntos / máximo` with the weight of its criterion's indicators. Recommendations are then generated with Firebase AI Logic (`core/firebase/ia.ts`, validated by `validarSalidaIA`), falling back to the rule-based ones. Both PDFs are built in the browser with pdfmake from `compartido/informes.ts` and are never stored.

### UI conventions

- Standalone components with signals and zoneless change detection.
- Each component in its own folder with separate `.ts`, `.html` and `.scss` files.
- Design tokens (colors, type scale, spacing, dark mode) are CSS variables in `src/styles/_tokens.scss`.
- Dark mode follows the system preference unless the user picks one; the choice is stored as `data-tema` on `<html>` (`TemaService`, plus an inline script in `index.html`).
- Shared building blocks are in `shared/components`: `esqueleto` (loading skeleton), `error-carga` (error with retry), `sin-conexion` (offline banner), `foto` (photos in `public/fotos`).
- The admin-only `/sistema-de-diseno` page shows the system live; documented in `docs/SISTEMA-DE-DISENO.md`.
- The floating assistant "Clara" (`features/asistente/`) lives in the shell: fixed answers in `preguntas.ts` (built from `compartido/norma.ts`), free questions via Gemini (`core/firebase/asistente-ia.ts`) with keyword fallback. The mascot SVG animates with CSS only and respects reduced motion.
- Public pages: `/privacidad`, `/terminos`, `/cookies` (`features/legal/documentos.ts`; fill `CONTACTO_PRIVACIDAD`), the `pie-legal` footer and the `aviso-cookies` notice. Hosting sends a CSP without inline scripts, so the theme bootstrap is `public/tema.js` and production builds set `inlineCritical: false`. Sessions close after 30 minutes idle (`InactividadService`).
- E2E tests assert axe accessibility, no horizontal overflow and ≥44 px touch targets (`e2e/helpers.ts`), so UI changes must keep those passing.

## Repository conventions

- Work is committed and pushed directly to `main`.
- Never commit service-account JSON files or other secrets (`firebase/.gitignore` excludes them).
- Docs in `docs/` (installation, user manual, deployment, data dictionary, UML) are maintained alongside code changes.
