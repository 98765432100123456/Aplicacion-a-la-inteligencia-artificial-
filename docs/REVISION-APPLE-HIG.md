Revisión de diseño de la interfaz web
=====================================

Este informe documenta la revisión de diseño de la interfaz web de ICA Bienestar Animal. Se realizó con la habilidad `apple-design`, basada en las Human Interface Guidelines de Apple, y con la habilidad `web-design-guidelines`, basada en las Web Interface Guidelines de Vercel. Ambas están instaladas en `.claude/skills/`. La revisión abarcó el código de `frontend/src` y capturas de pantalla en anchos de 390, 820 y 1440 px, en modo claro y oscuro.


Alcance y método
----------------

Por tratarse de una aplicación web, se aplicaron los principios de diseño de Apple y sus fundamentos de accesibilidad, color, tipografía, disposición y redacción. Se excluyeron las convenciones exclusivas de iOS y macOS, como la barra de pestañas inferior, la barra de menús o los puntos suspensivos en botones que abren ventanas. Los contrastes se calcularon a partir de los valores hexadecimales del código y no mediante estimación visual.

Se consultaron las siguientes guías de Apple: `accessibility.md`, `layout.md`, `typography.md`, `color.md`, `dark-mode.md`, `design-principles.md`, `writing.md`, `modality.md`, `buttons.md`, `entering-data.md`, `sidebars.md` y `feedback.md`, además de la guía de equivalencias `cross-platform.md` de la habilidad.


Resultado
---------

| Momento | Calificación según la escala de la habilidad |
|---|---|
| Antes de la revisión | Con problemas críticos |
| Después de las correcciones | Buena |

La revisión identificó un problema crítico de contraste en los bordes de los campos, así como la ausencia de modo oscuro, de soporte para texto ampliado y de protecciones contra la pérdida de datos. Todos los hallazgos fueron corregidos y quedaron cubiertos por pruebas automatizadas.

Después de la revisión, la interfaz se rediseñó por completo para abandonar una apariencia que resultaba genérica. El rediseño, descrito en la sección siguiente, conservó todas las correcciones de esta revisión y las verificó de nuevo.


Rediseño de la interfaz
-----------------------

El primer diseño, basado en sellos rectangulares, navegación lateral y casillas de verificación, cumplía las guías pero no tenía carácter propio. El rediseño tomó como referencia el oficio visual del proyecto Forja Digital y aplicó tres fuentes de criterio:

| Fuente | Qué aportó al rediseño |
|---|---|
| Habilidad `apple-design` | Interruptores con `role="switch"` para los permisos, control segmentado para el filtro de estado, hojas inferiores con agarradera en el teléfono, barra superior translúcida, curva de cajón de iOS y radio de 22 px en diálogos |
| Criterios de movimiento de Emil Kowalski | Curva de salida `cubic-bezier(0.23, 1, 0.32, 1)`, presión a `scale(0.97)`, entradas de 360 ms solo con `transform` y `opacity`, filas escalonadas en la pantalla de inicio y eliminación total con movimiento reducido |
| Habilidad `design-taste-frontend` | Titulares grandes de letras juntas, un solo color de acción, capas separadas por color y línea en lugar de sombras, y el producto mostrado en lugar de descrito en la pantalla de ingreso |

| Antes | Después |
|---|---|
| Public Sans en todos los textos | Manrope para la interfaz y Unbounded para el logotipo |
| Botón principal verde oscuro con texto blanco | Verde pasto `#4cc77f` con texto oscuro, 8.8:1 |
| Navegación lateral fija | Barra superior translúcida con menú desplegable en el teléfono |
| Ficha con los roles en la pantalla de ingreso | Héroe oscuro con un teléfono que muestra una evaluación ilustrativa |
| Tarjetas con cifras en la pantalla de inicio | Libro de cifras grandes y hoja de ruta de los próximos sprints |
| Casillas de verificación para los permisos | Interruptores agrupados por módulo, con estado intermedio en el grupo |
| Lista desplegable para el estado | Control segmentado con opciones de 44 px |
| Sellos rectangulares de estado | Punto de color seguido de la palabra |
| Diálogo a pantalla completa en el teléfono | Hoja que sube desde el borde inferior |

Los mensajes emergentes dejaron de interceptar los toques sobre el contenido que cubren: solo su botón de cierre recibe eventos. El hallazgo surgió de las pruebas en el teléfono, donde un mensaje tapaba el botón de la última fila de la tabla.


Hallazgo crítico
----------------

**Contraste insuficiente en los bordes de los campos**

| Aspecto | Detalle |
|---|---|
| Situación | El borde de los campos de texto y de las listas desplegables era `#9aa59c` sobre blanco, con un contraste de 2.55:1, inferior al mínimo de 3:1 requerido para identificar un control |
| Guía | `accessibility.md`, sección *Vision*: "Strive to meet color contrast minimum standards." |
| Corrección | La variable `--linea-control` pasó a `#7b877e`, con un contraste de 3.74:1 sobre blanco y de 3.29:1 sobre el fondo. En modo oscuro su valor es `#6f7c73`, con 3.79:1 |


Mejoras de prioridad alta
-------------------------

**Ausencia de modo oscuro**

| Aspecto | Detalle |
|---|---|
| Guía | `dark-mode.md`, sección *Best practices*: "Ensure that your app looks good in both appearance modes." `color.md`, sección *Best practices*: "Make sure all your app's colors work well in light, dark, and increased contrast contexts." |
| Corrección | Se definieron colores semánticos con una variante para `prefers-color-scheme: dark`, sin selector propio de tema, como establece `dark-mode.md`: "Avoid offering an app-specific appearance setting." Contrastes vigentes en modo oscuro: texto principal 15.8:1, texto secundario 8.7:1, acento 12.1:1 y botón principal 8.8:1 |

**Ausencia de contraste aumentado**

| Aspecto | Detalle |
|---|---|
| Corrección | Con `prefers-contrast: more`, el texto secundario adopta el color del texto principal y los bordes se refuerzan a `#3d453f` |

**Desbordamiento con texto ampliado**

| Aspecto | Detalle |
|---|---|
| Situación | Con el tamaño de letra del navegador al doble, la página de usuarios se desbordaba 541 px en sentido horizontal, debido a que los puntos de quiebre estaban definidos en píxeles |
| Guía | `typography.md`, sección *Supporting Dynamic Type*: "Make sure your app's layout adapts to all font sizes." `layout.md`, sección *Size classes*: "Determine layout based on size classes, not device type." |
| Corrección | Los puntos de quiebre se expresaron en unidades `em` (por ejemplo, `63.99em` en lugar de `1023px`), de modo que con letra ampliada la interfaz adopta la disposición móvil. Los íconos de la barra superior también aumentan de tamaño con el texto |

**Mensajes con tiempo límite**

| Aspecto | Detalle |
|---|---|
| Situación | Los mensajes de confirmación desaparecían a los 5 segundos y los de error a los 8 segundos |
| Guía | `accessibility.md`, sección *Cognitive*: "Minimize use of time-boxed interface elements." |
| Corrección | Los mensajes de error permanecen hasta que la persona los cierra. Los de confirmación duran 6 segundos y se detienen mientras el puntero o el foco están sobre ellos o mientras la pestaña está oculta |

**Panel desplegable móvil sin soporte de teclado**

| Aspecto | Detalle |
|---|---|
| Corrección | Al abrir el panel, el foco se traslada al primer enlace; la tecla `Escape` lo cierra y devuelve el foco al botón de menú; el contenido posterior queda inactivo mediante el atributo `inert` |


Mejoras de prioridad media
--------------------------

**Pérdida de datos al cerrar un diálogo**

| Aspecto | Detalle |
|---|---|
| Situación | Cerrar los diálogos de creación o edición de usuarios con `Escape`, con el botón de cierre o al tocar fuera de ellos eliminaba la información escrita |
| Guía | `modality.md`, sección *Best practices*: "help people avoid data loss by getting confirmation before closing a modal view." |
| Corrección | Cuando hay datos escritos, el diálogo presenta el aviso "Hay cambios sin guardar" con las opciones **Seguir editando** y **Descartar cambios**. El editor de roles y la sección Cuenta solicitan confirmación antes de abandonar la pantalla con cambios pendientes, conforme a la regla de Vercel "Warn before navigation with unsaved changes" |

**Ausencia de estado de presión en botones secundarios**

| Aspecto | Detalle |
|---|---|
| Guía | `buttons.md`, sección *Best practices*: "Always include a press state for a custom button." |
| Corrección | Todos los botones se reducen a `scale(0.97)` durante 140 ms al presionarlos |

**Campos sin ejemplo de formato**

| Aspecto | Detalle |
|---|---|
| Guía | `writing.md`, sección *Best practices*: "Show hints in text fields." |
| Corrección | Se agregaron ejemplos en los campos de correo (`nombre@dominio.co`), documento (`1020304050`) y teléfono (`300 123 4567`). El texto de ejemplo usa `--tinta-tenue`, con contraste de 5.7:1 en modo claro y 8.7:1 en modo oscuro |


Mejoras de prioridad baja
-------------------------

**Foco inicial en confirmaciones destructivas**

| Aspecto | Detalle |
|---|---|
| Guía | `buttons.md`, sección *Role*: "Don't assign the primary role to a button that performs a destructive action." |
| Corrección | En los diálogos "Inactivar usuario" e "Inactivar rol", el foco inicial se ubica en el botón **Cancelar** |

**Uso de pronombre posesivo en la navegación**

| Aspecto | Detalle |
|---|---|
| Guía | `writing.md`, sección *Best practices*: "Use possessive pronouns sparingly." |
| Corrección | La sección "Mi cuenta" pasó a denominarse **Cuenta** |


Observaciones de diseño
-----------------------

**Identidad visual.** La interfaz se distingue por el héroe oscuro con el teléfono ilustrativo, los titulares grandes de letras juntas y el libro de registro con puntos de estado. El verde pasto se reserva para la acción principal, los interruptores encendidos y el estado activo, como recomienda `branding.md`.

**Material translúcido.** La barra superior, única capa funcional que flota sobre el contenido, adoptó un fondo translúcido mediante `backdrop-filter`. Con la preferencia de transparencia reducida recupera un fondo sólido. No se aplicó desenfoque a ningún elemento de contenido.

**Movimiento.** Los diálogos aparecen desde `scale(0.96)` y no desde cero; en el teléfono se presentan como hojas que suben desde el borde inferior. Las hojas y el menú desplegable emplean la curva de iOS `cubic-bezier(0.32, 0.72, 0, 1)`, y la preferencia de movimiento reducido desactiva todas las transiciones.

**Elementos prescindibles.** El rediseño retiró la navegación lateral, las tarjetas de cifras y los sellos rectangulares, que ocupaban espacio sin aportar información.


Aspectos favorables
-------------------

- Todos los controles tienen un área táctil de al menos 44 px, verificada con Playwright.
- La validación se presenta junto a cada campo y el foco se traslada al primer error, conforme a `entering-data.md`.
- La navegación tiene un solo nivel, se ubica en la barra superior y en el teléfono se convierte en menú desplegable con la sesión al final.
- Los mensajes de error indican qué ocurrió y cómo resolverlo, sin fórmulas de disculpa, conforme a la sección *Write clear error messages* de `writing.md`.


Consideraciones de plataforma
-----------------------------

**Uso de mayúsculas en botones.** Las guías de Apple y de Vercel recomiendan mayúscula inicial en cada palabra ("Guardar Cambios"). La norma del español establece mayúscula solo en la primera palabra ("Guardar cambios"), criterio que se mantiene de manera uniforme.

**Puntos suspensivos en botones que abren diálogos.** La guía `buttons.md` los exige únicamente en macOS ("Nuevo usuario…"). No constituyen una convención web y no se aplicaron.

Habilidades no aplicadas a estas pantallas
------------------------------------------

| Habilidad | Motivo |
|---|---|
| `image-to-code` | Requiere una herramienta de generación de imágenes de diseño, no disponible en la sesión de trabajo |
| `playwright-cli` | El proyecto ya emplea Playwright en `frontend/e2e/`; la habilidad está orientada a la automatización del navegador desde la terminal |


Verificación
------------

El archivo `frontend/e2e/apple-hig.spec.ts` verifica de forma automatizada:

- La ausencia de violaciones de accesibilidad con axe-core en modo oscuro, medida cuando las animaciones de entrada han terminado, en todas las pantallas internas.
- El refuerzo de los bordes con la preferencia de contraste aumentado.
- La ausencia de desbordamiento con el texto ampliado al doble, mediante el ajuste real de tamaño de letra del navegador.
- El manejo del foco y de la tecla `Escape` en el menú desplegable móvil.
- La confirmación antes de descartar cambios.
- El foco inicial en el botón Cancelar de las confirmaciones destructivas.
- El estado de presión de los botones.
