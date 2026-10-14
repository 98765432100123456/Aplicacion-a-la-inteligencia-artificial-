# Revisión de diseño: ICA Bienestar Animal (frontend)

Revisión hecha con la skill `apple-design` (Human Interface Guidelines de Apple) y `web-design-guidelines` (Vercel), instaladas en `.claude/skills/`. Revisa el código de `frontend/src` y capturas a 390, 820 y 1440 px, en modo claro y oscuro.

**Alcance.** Es una aplicación web, así que se aplican los principios y fundamentos de Apple: accesibilidad, color, tipografía, layout y redacción. No se aplican las convenciones exclusivas de iOS y macOS (barra de pestañas inferior, barra de menús, botones con "…" que abren ventanas). Los contrastes se calcularon con los valores hexadecimales reales, no a ojo.

Referencias usadas: `accessibility.md`, `layout.md`, `typography.md`, `color.md`, `dark-mode.md`, `design-principles.md`, `writing.md`, `modality.md`, `buttons.md`, `entering-data.md`, `sidebars.md`, `feedback.md` y `cross-platform.md`.

## Resumen

**Antes: Critical issues. Después: Good.**

La tesis de la interfaz es *la ficha de campo*: sellos de estado rectos, renglones en el ingreso y un solo verde de potrero para la acción principal. Es una herramienta deliberadamente sobria, y eso es lo correcto para un evaluador que trabaja en campo.

Había un problema crítico de contraste en los bordes de los campos y faltaban el modo oscuro, el soporte de texto grande y varias protecciones contra la pérdida de datos. Todo quedó corregido y cubierto con pruebas.

## Critical (corregido)

- **Qué:** el borde de los campos de texto y de las listas era `#9aa59c` sobre blanco, **2.55:1**, por debajo del mínimo de 3:1 para identificar un control.
  - **Por qué:** `accessibility.md › Vision`: "Strive to meet color contrast minimum standards."
  - **Corrección:** el token `--linea-control` pasa a `#7b877e`, **3.74:1** sobre blanco y 3.29:1 sobre el fondo. En modo oscuro es `#6f7c73`, 3.79:1.

## Improvements (corregido)

- **[High] Faltaba el modo oscuro.**
  - **Por qué:** `dark-mode.md › Best practices`: "Ensure that your app looks good in both appearance modes." y `color.md › Best practices`: "Make sure all your app's colors work well in light, dark, and increased contrast contexts."
  - **Corrección:** colores semánticos (`--superficie`, `--acento`, `--accion`…) con variante para `prefers-color-scheme: dark`, sin interruptor propio, como pide `dark-mode.md`: "Avoid offering an app-specific appearance setting". Contrastes en oscuro: texto 13.7:1, secundario 8.6:1, ayudas 6.3:1, acento 9.5:1 y botón principal 5.0:1.
- **[High] Faltaba el contraste aumentado.**
  - **Corrección:** con `prefers-contrast: more`, los textos secundarios pasan al color del texto principal y los bordes se oscurecen (`#3d453f`).
- **[High] El texto grande rompía el diseño.**
  - **Qué:** con el tamaño de letra del navegador al 200 %, la página de usuarios se desbordaba **541 px** en horizontal, porque los puntos de quiebre estaban en px y no reaccionaban al tamaño de texto.
  - **Por qué:** `typography.md › Supporting Dynamic Type`: "Make sure your app's layout adapts to all font sizes." y `layout.md › Size classes`: "Determine layout based on size classes, not device type."
  - **Corrección:** los puntos de quiebre pasan a `em` (`63.99em` en lugar de `1023px`), así que con letra grande la interfaz cambia sola al diseño de cajón. Los íconos de la barra también crecen con el texto.
- **[High] Los mensajes desaparecían por tiempo.**
  - **Qué:** los de éxito duraban 5 s y los de error 8 s.
  - **Por qué:** `accessibility.md › Cognitive`: "Minimize use of time-boxed interface elements."
  - **Corrección:** los errores quedan hasta que la persona los cierra. Los de éxito duran 6 s y se detienen mientras el puntero o el foco están encima, o mientras la pestaña está oculta.
- **[High] El cajón del celular no funcionaba con teclado.**
  - **Corrección:**
    - Al abrirlo, el foco entra al primer enlace.
    - `Escape` lo cierra y el foco vuelve al botón de menú.
    - El contenido de detrás queda `inert`.
- **[Medium] Se podían perder datos al cerrar un diálogo.**
  - **Qué:** cerrar "Nuevo usuario" o "Editar usuario" con Escape, con la X o tocando fuera borraba lo escrito.
  - **Por qué:** `modality.md › Best practices`: "help people avoid data loss by getting confirmation before closing a modal view."
  - **Corrección:** si hay datos escritos, aparece "Hay cambios sin guardar", con **Seguir editando** y **Descartar cambios**. El editor de roles y la pantalla de Cuenta piden confirmación antes de salir con cambios sin guardar (`web-design-guidelines`: "Warn before navigation with unsaved changes").
- **[Medium] Los botones secundarios no tenían estado de presión.**
  - **Por qué:** `buttons.md › Best practices`: "Always include a press state for a custom button."
  - **Corrección:** todos los botones bajan a `scale(0.97)` en 120 ms con una curva *ease-out* fuerte.
- **[Medium] Los campos no mostraban un ejemplo del formato.**
  - **Por qué:** `writing.md › Best practices`: "Show hints in text fields."
  - **Corrección:** ejemplos en correo (`nombre@dominio.co`), documento (`1020304050`) y teléfono (`300 123 4567`). El texto de ejemplo usa `--tinta-tenue`, con contraste de 5.8:1 en claro y 6.3:1 en oscuro.
- **[Low] El foco inicial de las confirmaciones destructivas no estaba en Cancelar.**
  - **Por qué:** `buttons.md › Role`: "Don't assign the primary role to a button that performs a destructive action."
  - **Corrección:** en "Inactivar usuario" e "Inactivar rol", el foco inicial queda en **Cancelar**.
- **[Low] La sección se llamaba "Mi cuenta".**
  - **Por qué:** `writing.md › Best practices`: "Use possessive pronouns sparingly."
  - **Corrección:** pasa a **Cuenta**.

## Craft notes

- **Punto de vista.** La interfaz se recuerda por la *ficha de campo*: los sellos de estado y los renglones del ingreso con lo que hace cada rol. El verde se reserva para la acción principal y el estado activo, como pide `branding.md`. No cae en ninguno de los tres estilos genéricos que señala la skill (crema con serif y terracota, negro con un acento ácido, o una cuadrícula de líneas finas sin radios).
- **Material translúcido.** La barra superior del celular es la única capa funcional que flota sobre el contenido, así que se volvió translúcida (`backdrop-filter`). Con `prefers-reduced-transparency` vuelve a ser sólida. No se aplicó desenfoque a ningún contenido.
- **Movimiento.** El diálogo entra desde `scale(0.96)`, no desde cero. El cajón usa la curva de iOS `cubic-bezier(0.32, 0.72, 0, 1)` y `prefers-reduced-motion` desactiva todo.
- **Qué se puede quitar.** Nada importante. La interfaz ya es austera.

## What works

- Objetivos táctiles de 44 px en todos los controles, verificado con Playwright.
- Validación en línea con el mensaje junto al campo y el foco en el primer error (`entering-data.md`).
- La navegación lateral tiene un solo nivel y en el celular pasa a cajón (`sidebars.md`).
- Los errores dicen qué pasó y cómo resolverlo, sin pedir disculpas (`writing.md › Write clear error messages`).

## Platform notes

- **Mayúsculas en botones.** Apple y Vercel piden *Title Case* ("Guardar Cambios"). En español la norma es la mayúscula solo inicial ("Guardar cambios"), y se mantiene así de forma consistente.
- **Elipsis en botones que abren diálogos.** `buttons.md` lo pide solo en macOS ("Nuevo usuario…"); en web no es convención y no se aplicó.
- **Sesión al pie de la barra lateral.** `sidebars.md` desaconseja acciones críticas al pie de la barra lateral en macOS, porque la ventana puede quedar cortada. En web la barra está fija a la altura de la pantalla y siempre es visible, así que se mantiene.

## Skills que no aplican a estas pantallas

- **`design-taste-frontend`** (taste-skill): su descripción dice "Not for dashboards or app screens". Se usará cuando haya una página pública del proyecto.
- **`image-to-code`**: necesita generar imágenes de diseño, y esta sesión no tiene esa herramienta.
- **`playwright-cli`**: el proyecto ya usa Playwright en `frontend/e2e/`. La skill sirve para automatizar el navegador desde la terminal.

## Pruebas

`frontend/e2e/apple-hig.spec.ts` cubre:

- Modo oscuro sin violaciones de axe en las 5 pantallas.
- Bordes reforzados con contraste aumentado.
- Texto al 200 % sin desbordamiento, con el ajuste real de tamaño de letra del navegador vía CDP.
- Foco y Escape en el cajón móvil.
- Confirmación al descartar.
- Foco inicial en Cancelar.
- Estado de presión de los botones.
