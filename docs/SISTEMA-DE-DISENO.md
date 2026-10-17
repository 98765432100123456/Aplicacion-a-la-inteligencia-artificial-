Sistema de diseño
=================

Este documento expone los fundamentos visuales de la interfaz de ICA Bienestar Animal y justifica cada decisión. Los valores se implementan como variables CSS en `frontend/src/styles.scss`. Las capturas de cada pantalla, en escritorio y teléfono y en modo claro y oscuro, se encuentran en la carpeta [docs/disenos](disenos/). El sistema fue revisado con las guías de interfaz de Apple; el informe correspondiente se encuentra en la [revisión con las guías de Apple](REVISION-APPLE-HIG.md).


Concepto
--------

El concepto rector es **mostrar el producto antes que prometerlo**. La pantalla de ingreso no describe la plataforma con viñetas: enseña, en un teléfono, cómo se verá una evaluación en finca con su puntaje, su nivel de bienestar y la lista de chequeo por secciones. El dibujo se rotula como ejemplo ilustrativo, porque el módulo de evaluación se entrega en un sprint posterior.

Dentro de la aplicación el concepto es **el libro de registro**: titulares grandes, filas separadas por líneas finas, una regla oscura que abre cada lista y un punto de color que indica el estado. Es la manera en que un técnico de campo lleva sus anotaciones, trasladada a la pantalla sin imitar el papel.

El diseño se rige por cinco principios:

- **Jerarquía por tamaño, no por adornos:** el titular de cada pantalla mide entre 38 y 60 px con letras juntas; el resto del texto es pequeño y tranquilo. No hay tarjetas con sombra, degradados ni íconos decorativos.
- **Un solo color de acción:** el verde pasto `#4cc77f` aparece únicamente en la acción principal de cada pantalla, en los interruptores encendidos y en el punto de estado activo.
- **Capas por color y línea:** las zonas se separan con el cambio de fondo (noche, fondo, superficie) y con líneas de 1 px. La sombra queda reservada para lo que flota.
- **Estado siempre legible:** cada estado combina un punto de color con su palabra (Activo, Inactivo, Bloqueado), de modo que nunca depende solo del color.
- **Movimiento con propósito:** cada animación explica de dónde viene un elemento o confirma un toque, dura menos de un tercio de segundo y desaparece cuando el dispositivo pide movimiento reducido.


Paleta de colores
-----------------

Los colores son semánticos: cada variable nombra una función y adopta un valor distinto según la apariencia configurada en el dispositivo. La aplicación sigue la preferencia del sistema operativo (`prefers-color-scheme`), conforme a la guía `dark-mode.md` de Apple. Los contrastes se calcularon con la fórmula de WCAG 2.1 sobre el fondo correspondiente.

| Variable | Modo claro | Modo oscuro | Uso | Contraste claro y oscuro |
|---|---|---|---|---|
| `--noche` | `#0e1210` | `#0e1210` | Héroe de la pantalla de ingreso | No aplica |
| `--fondo` | `#f2f3f0` | `#0e1210` | Fondo de la aplicación | No aplica |
| `--superficie` | `#ffffff` | `#151a17` | Campos, paneles y filas | No aplica |
| `--superficie-elevada` | `#ffffff` | `#1c221e` | Diálogos, hojas y menú desplegable | No aplica |
| `--tinta` | `#1a1f1c` | `#e8ece9` | Texto principal | 15.0:1 y 15.8:1 |
| `--tinta-suave` | `#59625c` | `#a9b3ac` | Texto secundario y metadatos | 5.7:1 y 8.7:1 |
| `--linea` | `#dde1dc` | `#2a312c` | Separación entre filas | No aplica |
| `--linea-fuerte` | `#1a1f1c` | `#e8ece9` | Regla que abre cada lista o tabla | No aplica |
| `--linea-control` | `#7b877e` | `#6f7c73` | Borde de los campos, con un mínimo de 3:1 | 3.7:1 y 4.0:1 |
| `--accion` | `#4cc77f` | `#4cc77f` | Fondo del botón principal, con texto `#0e1210` | 8.8:1 y 8.8:1 |
| `--acento` | `#1d6b40` | `#8fe0b0` | Enlaces, estado activo y foco | 5.8:1 y 12.1:1 |
| `--maiz` | `#8a5a00` | `#e5ad4f` | Advertencia y estado bloqueado | 5.3:1 y 9.4:1 |
| `--alerta` | `#b42318` | `#ff8f80` | Mensajes de error | 5.9:1 y 8.5:1 |
| `--peligro` | `#b42318` | `#c2342a` | Fondo de acciones destructivas, con texto blanco | 6.6:1 y 5.5:1 |

El botón principal usa texto oscuro sobre el verde claro, y no texto blanco, porque así alcanza 8.8:1 y conserva un verde luminoso que se reconoce a pleno sol. El mismo verde funciona en ambos modos.

Cuando el dispositivo solicita contraste aumentado (`prefers-contrast: more`), el texto secundario adopta el color del texto principal y los bordes de los campos se refuerzan a `#3d453f` en modo claro y a `#b3bdb5` en modo oscuro.


Tipografía
----------

| Familia | Uso | Justificación |
|---|---|---|
| **Manrope** (variable, de 200 a 800) | Todo el texto de la interfaz | Geométrica y compacta, con cifras claras; admite pesos altos sin perder legibilidad en titulares de letras juntas |
| **Unbounded** (700) | Solo el logotipo | Ancha y redonda; distingue la marca sin competir con los titulares |

Ambas familias se alojan en el propio proyecto mediante `@fontsource`, de modo que la aplicación no depende de servicios externos de fuentes.

Los titulares (`.titular`) usan peso 800, interlineado de 1.0 y espaciado entre letras de −0.045 em; la bajada (`.bajada`) usa 21 px con peso 400 y color secundario. Las cifras de resúmenes y tablas usan dígitos de ancho uniforme (`tabular-nums`).

| Variable | Tamaño | Uso |
|---|---|---|
| `--texto-xs` | 13 px | Encabezados de tabla y metadatos |
| `--texto-sm` | 15 px | Botones, navegación y ayudas |
| `--texto-md` | 17 px | Texto de lectura y campos |
| `--texto-lg` | 21 px | Bajadas y subtítulos |
| `--texto-xl` | 27 px | Títulos de sección |
| `--texto-2xl` | de 32 a 44 px | Títulos de formulario |
| `--texto-3xl` | de 38 a 60 px | Titular de cada pantalla |
| `--texto-heroe` | de 40 a 76 px | Titular del héroe de ingreso |

Los tamaños con intervalo se calculan con `clamp()` según el ancho de la ventana.


Espaciado y adaptación a la pantalla
------------------------------------

El espaciado parte de una base de 4 px, con las variables `--e-1` (4 px) a `--e-24` (96 px). El margen lateral (`--margen`) crece con la pantalla: 20 px en teléfonos, 32 px en tabletas y 48 px en escritorio. El contenido se centra con un ancho máximo de 75 rem.

Los puntos de quiebre se expresan en unidades `em`, de manera que responden tanto al ancho de la pantalla como al tamaño de letra configurado en el navegador, conforme a la guía `typography.md` de Apple. Con el texto ampliado al doble en una pantalla de escritorio, la interfaz adopta por sí sola la disposición móvil.

| Punto de quiebre | Equivalencia con letra estándar | Efecto |
|---|---|---|
| 37.5em | 600 px | Los diálogos se convierten en hojas que suben desde el borde inferior |
| 45em | 720 px | La tabla de usuarios se presenta como lista de fichas |
| 52em | 832 px | La navegación superior se convierte en menú desplegable |
| 64em | 1024 px | La pantalla de ingreso pasa a una sola columna y oculta el teléfono ilustrativo |


Forma y elevación
-----------------

| Elemento | Radio | Justificación |
|---|---|---|
| Botones, buscador, control segmentado y mensajes | Píldora (999 px) | Se reconocen como tocables a primera vista |
| Campos de texto y listas desplegables | 10 px | Distinguen el lugar donde se escribe del lugar donde se actúa |
| Paneles y grupos de permisos | 18 px | Agrupan contenido relacionado |
| Diálogos y hojas | 22 px | Siguen el radio de las hojas de iOS |

La sombra (`--sombra-flotante`) se reserva para los elementos que flotan sobre el contenido: diálogos, menú desplegable y mensajes emergentes. Todo lo demás se separa con líneas.


Componentes
-----------

| Componente | Clase o archivo | Descripción |
|---|---|---|
| Logotipo | `shared/logo.ts` | Sello verde con marca de verificación y el nombre en Unbounded |
| Encabezado de página | `shared/page-header.ts` | Titular, bajada y acción principal alineada a la derecha |
| Botones | `.btn-principal`, `.btn-secundario`, `.btn-fantasma`, `.btn-peligro`, `.btn-texto` | Píldoras de 48 px; la versión `.btn-sm` mide 44 px, el mínimo táctil |
| Interruptor | `.interruptor` | Casilla con `role="switch"` dibujada como el interruptor de iOS; admite el estado intermedio en los grupos de permisos |
| Control segmentado | `.segmentado` | Filtro de estado con opciones excluyentes (Todos, Activos, Inactivos) |
| Punto de estado | `.estado-activo`, `.estado-inactivo`, `.estado-alerta` | Punto de color seguido de la palabra |
| Libro de cifras | `.libro` en `features/home/home.ts` | Cifras grandes separadas por líneas verticales, sin tarjetas |
| Ficha | `.ficha` | Lista de pares rótulo y valor separados por líneas |
| Diálogo y hoja | `shared/dialog.ts` | Diálogo centrado en escritorio; hoja inferior con agarradera en el teléfono |
| Mensajes emergentes | `shared/toasts.ts` | Píldora oscura que sube desde abajo y no bloquea el contenido que cubre |


Estados interactivos
--------------------

| Estado | Tratamiento |
|---|---|
| Puntero encima | Cambio sutil de fondo; solo se aplica con dispositivos de puntero preciso (`hover: hover`) |
| Foco | Contorno verde de 3 px con separación de 2 px, siempre visible al navegar con teclado; en los campos, borde verde con halo |
| Presión | El botón se reduce a `scale(0.97)` en 140 ms |
| Deshabilitado | Opacidad de 0.55 y cursor `not-allowed` |
| Carga | Indicador giratorio y verbo en gerundio, por ejemplo "Guardando…" |
| Error | Borde rojo, mensaje bajo el campo y atributo `aria-invalid`; el foco se traslada al primer campo con error |
| Vacío | Mensaje que explica la situación y ofrece una acción, por ejemplo "Limpiar filtros" |


Movimiento
----------

Las animaciones siguen los criterios de Emil Kowalski: salida rápida y llegada suave, duraciones cortas y ninguna animación sin propósito.

| Variable | Valor | Uso |
|---|---|---|
| `--curva` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entradas de contenido, diálogos y mensajes |
| `--curva-cajon` | `cubic-bezier(0.32, 0.72, 0, 1)` | Hojas inferiores y menú desplegable, la curva de los cajones de iOS |
| `--dur-presion` | 140 ms | Respuesta al presionar |
| `--dur-rapida` | 160 ms | Cambios de color y de fondo |
| `--dur-media` | 240 ms | Apertura y cierre de capas |

| Elemento | Comportamiento |
|---|---|
| Contenido de cada pantalla | Sube 10 px desde opacidad 0 en 360 ms (`.entrada`) |
| Listas de la pantalla de inicio | Cada fila entra 45 ms después de la anterior |
| Teléfono del héroe | Asoma desde el borde inferior en 700 ms, con 120 ms de espera |
| Diálogo en escritorio | Crece desde `scale(0.96)` con opacidad |
| Hoja en el teléfono | Sube desde el borde inferior con la curva de cajón |
| Interruptor | La perilla se desliza y el fondo pasa a verde en 240 ms |

Las animaciones solo modifican `transform` y `opacity`, que el navegador compone sin recalcular el diseño. Cuando el dispositivo solicita movimiento reducido (`prefers-reduced-motion`), las entradas se eliminan y las transiciones se reducen a 1 ms.


Materiales
----------

La barra superior es la única capa funcional que flota sobre el contenido. Por esa razón es translúcida (`backdrop-filter: saturate(1.6) blur(20px)`), de acuerdo con las guías `materials.md` y `liquid-glass.md` de Apple, que reservan este material para los controles y lo excluyen del contenido. Cuando el dispositivo solicita transparencia reducida (`prefers-reduced-transparency`), la barra recupera un fondo sólido.


Esquema de pantallas
--------------------

```
INGRESO (escritorio)                         APLICACIÓN (escritorio)
┌──────────────────────────┬──────────────┐  ┌──────────────────────────────────────────┐
│ ▣ ICA Bienestar          │              │  │ ▣ ICA Bienestar  Inicio Usuarios  AD [Salir]│
│                          │  Ingresar    │  ├──────────────────────────────────────────┤
│ Bienestar animal,        │  [correo   ] │  │ Usuarios                  (Nuevo usuario)│
│ evaluado en campo.       │  [clave    ] │  │ bajada                                   │
│ bajada        ┌──────┐   │  (Ingresar ) │  │ (Buscar.......) [Rol] (Todos|Act.|Inac.) │
│               │ 82   │   │              │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ pie           │ lista│   │              │  │ AD Nombre      Rol     ● Activo   Editar │
└───────────────┴──────┴───┴──────────────┘  └──────────────────────────────────────────┘
```


Alternativas descartadas
------------------------

| Alternativa considerada | Motivo del descarte | Decisión adoptada |
|---|---|---|
| Angular Material | Produce la apariencia genérica de cualquier panel de administración y agrega cerca de 200 kB | Componentes propios basados en variables CSS |
| Navegación lateral fija | Ocupa un tercio de la pantalla para cuatro enlaces | Barra superior translúcida y menú desplegable en el teléfono |
| Tarjetas con sombra para las cifras de inicio | Generan ruido visual y aplanan la jerarquía | Libro de cifras grandes separadas por líneas |
| Lista de roles con viñetas en la pantalla de ingreso | Describe la plataforma en lugar de mostrarla | Teléfono con una evaluación ilustrativa |
| Casillas de verificación para los permisos | Leen como un formulario largo y no comunican encendido o apagado | Interruptores agrupados por módulo |
| Lista desplegable para filtrar por estado | Oculta tres opciones que caben a la vista | Control segmentado |
| Estados en sellos rectangulares con borde | Compiten visualmente con los botones | Punto de color seguido de la palabra |
| Texto blanco sobre verde oscuro en el botón principal | Verde apagado, poco reconocible a pleno sol | Verde pasto claro con texto oscuro |
| Tabla con desplazamiento horizontal en el teléfono | Obliga a desplazarse en dos direcciones | Cada usuario se presenta como una ficha con las acciones al pie |
