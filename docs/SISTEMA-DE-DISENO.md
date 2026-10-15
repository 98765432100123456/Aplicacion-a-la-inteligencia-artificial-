Sistema de diseño
=================

Este documento expone los fundamentos visuales de la interfaz de ICA Bienestar Animal y justifica cada decisión. Los valores se implementan como variables CSS en `frontend/src/styles.scss`. El sistema fue revisado con las guías de interfaz de Apple; el informe correspondiente se encuentra en la [revisión con las guías de Apple](REVISION-APPLE-HIG.md).


Concepto
--------

El concepto rector es **la ficha de campo**. El evaluador trabaja con formularios impresos que se caracterizan por rótulos claros, renglones y sellos de estado. La interfaz retoma esa claridad sin imitar la apariencia del papel.

El diseño se rige por cuatro principios:

- **Legibilidad en campo:** contraste alto, texto de al menos 16 px en los controles y áreas táctiles de 44 px, dado que la aplicación se usa en tabletas y teléfonos, en ocasiones a plena luz del día.
- **Estado siempre visible:** los estados activo, inactivo y bloqueado se presentan con sellos rectos con borde y texto, y no únicamente mediante el color.
- **Una acción principal por pantalla:** cada vista contiene un solo botón verde sólido.
- **Sobriedad institucional:** se prescinde de degradados, brillos e ilustraciones decorativas.


Paleta de colores
-----------------

Los colores son semánticos: cada variable nombra una función (`--superficie`, `--acento`, `--accion`, `--alerta`) y adopta un valor distinto según la apariencia configurada en el dispositivo. La aplicación no ofrece un selector propio de tema y sigue la preferencia del sistema operativo (`prefers-color-scheme`), conforme a la guía `dark-mode.md` de Apple. Los contrastes se calcularon con la fórmula de WCAG 2.1.

| Variable | Modo claro | Modo oscuro | Uso | Contraste claro y oscuro |
|---|---|---|---|---|
| `--fondo` | `#eef1ed` | `#111613` | Fondo de la aplicación | No aplica |
| `--superficie` | `#ffffff` | `#1a201c` | Paneles y tablas | No aplica |
| `--superficie-elevada` | `#ffffff` | `#222a25` | Diálogos y panel desplegable | No aplica |
| `--tinta` | `#1c211d` | `#e6ebe7` | Texto principal | 16.3:1 y 13.7:1 |
| `--tinta-suave` | `#4d564f` | `#b3bdb5` | Texto secundario | 7.6:1 y 8.6:1 |
| `--tinta-tenue` | `#5f6862` | `#97a39a` | Ayudas, metadatos y ejemplos en los campos | 5.8:1 y 6.3:1 |
| `--linea-control` | `#7b877e` | `#6f7c73` | Borde de los campos, con un mínimo de 3:1 | 3.7:1 y 3.8:1 |
| `--acento` | `#1f5135` | `#8bd3a8` | Enlaces, estado activo e íconos | 9.2:1 y 9.5:1 |
| `--accion` | `#1f5135` | `#2f7d50` | Fondo del botón principal, con texto blanco | 9.2:1 y 5.0:1 |
| `--maiz` | `#8a5a0b` | `#e5ad4f` | Advertencia y estado bloqueado | 5.9:1 y 8.2:1 |
| `--alerta` | `#a8261b` | `#ff9585` | Mensajes de error | 7.1:1 y 7.8:1 |
| `--peligro` | `#a8261b` | `#b3261e` | Fondo de acciones destructivas, con texto blanco | 7.1:1 y 6.5:1 |
| `--foco` | `#1d5fa8` | `#7fb2f0` | Indicador de foco | 6.5:1 y 7.5:1 |

Cuando el dispositivo solicita contraste aumentado (`prefers-contrast: more`), el texto secundario adopta el color del texto principal y los bordes se refuerzan a `#3d453f` en modo claro y a `#b3bdb5` en modo oscuro.

El verde remite al potrero y no responde a una tendencia. El azul se reserva para el indicador de foco, de modo que nunca se confunde con una acción.


Tipografía
----------

Se emplea **Public Sans**, en su versión variable y alojada en el propio proyecto mediante `@fontsource-variable`. Es una familia diseñada para interfaces gubernamentales, neutra, con cifras claras y soporte completo para el español. Las cifras de tablas y resúmenes usan dígitos de ancho uniforme (`tabular-nums`, clase `.cifras`).

La escala tipográfica tiene una razón de 1.2 sobre una base de 16 px, con los tamaños de 12, 14, 16, 19, 23, 28 y 33 px, definidos en las variables `--texto-xs` a `--texto-3xl`.


Espaciado y adaptación a la pantalla
------------------------------------

El espaciado parte de una base de 4 px, con las variables `--e-1` (4 px) a `--e-16` (64 px). El ancho de los formularios se limita para favorecer la lectura: 24 rem en la pantalla de ingreso y 52 rem en el editor de roles.

Los puntos de quiebre se expresan en unidades `em`, de manera que responden tanto al ancho de la pantalla como al tamaño de letra configurado en el navegador, conforme a la guía `typography.md` de Apple. Con el texto ampliado al doble en una pantalla de escritorio, la interfaz adopta por sí sola la disposición móvil.

| Punto de quiebre | Equivalencia con letra estándar | Efecto |
|---|---|---|
| 37.5em | 600 px | Los diálogos ocupan la pantalla completa |
| 45em | 720 px | La tabla de usuarios se presenta como bloques |
| 56.25em | 900 px | La pantalla de ingreso pasa a una sola columna |
| 64em | 1024 px | La navegación lateral se convierte en panel desplegable |


Radios y elevación
------------------

| Elemento | Radio | Justificación |
|---|---|---|
| Sellos de estado | 2 px | Evocan un sello de tinta, casi recto |
| Controles y botones | 4 px | Distinguen los elementos interactivos |
| Paneles y diálogos | 8 px | Agrupan contenido |

Los paneles se separan mediante bordes. La sombra (`--sombra-flotante`) se reserva para los elementos que flotan sobre el contenido: diálogos, panel desplegable y mensajes emergentes.


Estados interactivos
--------------------

| Estado | Tratamiento |
|---|---|
| Puntero encima | Cambia el fondo o el borde hacia el color de acento |
| Foco | Indicador azul de 3 px, siempre visible al navegar con teclado |
| Presión | El botón se reduce a `scale(0.97)` durante 120 ms |
| Deshabilitado | Opacidad de 0.55 y cursor `not-allowed` |
| Carga | Indicador giratorio y verbo en gerundio, por ejemplo "Guardando…" |
| Error | Borde rojo, mensaje bajo el campo y atributo `aria-invalid`; el foco se traslada al primer campo con error |
| Vacío | Mensaje que explica la situación y ofrece una acción, por ejemplo "Limpiar filtros" |


Movimiento
----------

| Elemento | Comportamiento |
|---|---|
| Presión de botones | `scale(0.97)` en 120 ms, conforme a la guía `buttons.md` de Apple, que exige un estado de presión |
| Color y puntero | Transición de 150 ms con curva `ease`. Los efectos de puntero del menú se aplican solo con dispositivos de puntero preciso |
| Diálogos | Entrada desde `scale(0.96)` con opacidad, en 200 ms con `cubic-bezier(0.23, 1, 0.32, 1)` |
| Panel desplegable móvil | Curva de iOS `cubic-bezier(0.32, 0.72, 0, 1)` en 300 ms |

No se emplean animaciones de aparición al desplazarse por la página. Cuando el dispositivo solicita movimiento reducido (`prefers-reduced-motion`), todas las transiciones se reducen a 1 ms.


Materiales
----------

La barra superior de la versión móvil es la única capa funcional que flota sobre el contenido. Por esa razón es translúcida (`backdrop-filter: saturate(180%) blur(16px)`), de acuerdo con las guías `materials.md` y `liquid-glass.md` de Apple, que reservan este material para los controles y lo excluyen del contenido. Cuando el dispositivo solicita transparencia reducida (`prefers-reduced-transparency`), la barra recupera un fondo sólido.


Esquema de pantallas
--------------------

```
INGRESO (escritorio)                      APLICACIÓN (escritorio)
┌───────────────┬──────────────────┐      ┌──────────┬─────────────────────────────┐
│ ▣ ICA BA      │                  │      │ ICA BA   │ Usuarios       [Nuevo usuario]│
│               │  Ingresar        │      │          │ descripción                  │
│ Evaluación de │  [correo      ]  │      │ Inicio   │ [Buscar........] [Rol] [Est.]│
│ bienestar...  │  [clave  ][Most] │      │>Usuarios │ ┌──────────────────────────┐ │
│ ───────────── │  [  Ingresar   ] │      │ Roles    │ │Nombre  Rol  Estado  Últ. │ │
│ Admin  │ ...  │                  │      │ Cuenta   │ │...                Editar │ │
│ Evalua │ ...  │                  │      │          │ └──────────────────────────┘ │
│ Consul │ ...  │                  │      │ Nombre   │                              │
│ pie           │                  │      │[Cerrar]  │                              │
└───────────────┴──────────────────┘      └──────────┴─────────────────────────────┘
```


Alternativas descartadas
------------------------

| Alternativa considerada | Motivo del descarte | Decisión adoptada |
|---|---|---|
| Angular Material | Produce la apariencia genérica de cualquier panel de administración y agrega cerca de 200 kB | Componentes propios basados en variables CSS |
| Fondo crema con titulares en tipografía serif | Corresponde al resultado genérico de un sitio institucional | Fondo gris verdoso frío y una sola familia tipográfica |
| Íconos en recuadros de color para cada rol en la pantalla de ingreso | Cumplen una función meramente decorativa | Ficha con renglones que indica cada rol y su función |
| Estados en forma de píldora redondeada | Se confunden con los botones | Sellos rectos con borde |
| Tarjetas con sombra en todos los bloques | Generan ruido visual y aplanan la jerarquía | Bordes, con sombra solo en elementos flotantes |
| Barra de navegación inferior en el teléfono que repite el menú | Duplica la navegación | Panel lateral desplegable con la sesión al pie |
| Tabla con desplazamiento horizontal en el teléfono | Obliga a desplazarse en dos direcciones | Cada usuario se presenta como un bloque con las acciones al pie |
| Contraseña temporal definida por el administrador | Se transmite sin protección y el administrador la conoce | Invitación por correo con enlace de un solo uso |
