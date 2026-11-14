# Política de seguridad

ICA Bienestar Animal guarda datos de predios, evaluaciones y personas. Si encuentra una vulnerabilidad, gracias por avisarnos en privado.

## Cómo reportar

- Use **[Reportar una vulnerabilidad](https://github.com/98765432100123456/Aplicacion-a-la-inteligencia-artificial-/security/advisories/new)** en la pestaña *Security* de este repositorio. El reporte solo lo ven los administradores.
- No abra un *issue* público ni publique el problema antes de que esté corregido.
- Incluya los pasos para reproducirlo, qué datos o permisos quedan expuestos y, si puede, una prueba de concepto.

Respondemos en un máximo de 5 días hábiles y avisamos cuando la corrección esté publicada.

## Qué se puede probar

- Use los emuladores locales (`firebase/`, `npm run emuladores`) o el modo demostración (`frontend/`, `npm run demo`).
- **No** pruebe contra `bienestar-animal-ica.web.app` con datos reales, ni haga pruebas de denegación de servicio, ingeniería social o fuerza bruta contra cuentas de otras personas.

## Versiones con soporte

Solo la rama `main`, que es la que está publicada.

## Cómo protegemos el proyecto

El detalle está en [docs/SEGURIDAD.md](docs/SEGURIDAD.md): modelo de amenazas, controles frente al OWASP Top 10, verificación en dos pasos, reglas de Firestore, cabeceras de seguridad, control automático de secretos y dependencias, y riesgos residuales.
