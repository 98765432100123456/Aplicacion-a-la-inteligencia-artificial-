# Sistema de diseño

Revisado con las guías de Apple (skill `apple-design`); el informe completo está en [REVISION-APPLE-HIG.md](REVISION-APPLE-HIG.md).

Los tokens están en `frontend/src/styles.scss`. Este documento explica por qué son así.

## Idea

**La ficha de campo.** El evaluador del ICA trabaja con formularios impresos: rótulos claros, renglones y sellos de estado. La interfaz toma esa claridad, sin imitar el papel.

Principios:

1. **Legible en campo.** Contraste alto, texto de 16 px como mínimo en los controles y objetivos táctiles de 44 px. Se usa en tabletas y celulares, a veces al sol.
2. **El estado siempre a la vista.** Activo, inactivo y bloqueado se muestran con sellos rectos y con borde, no con color solo.
3. **Una acción principal por pantalla.** Solo hay un botón verde sólido por vista.
4. **Institucional y sobrio.** Sin degradados, brillos ni ilustraciones decorativas.

## Paleta

Los colores son **semánticos**: cada token nombra un rol (`--superficie`, `--acento`, `--accion`, `--alerta`…) y cambia de valor según la apariencia del sistema. No hay interruptor propio de tema; se sigue `prefers-color-scheme` (HIG `dark-mode.md`). Contrastes medidos con la fórmula WCAG 2.1.

| Token | Claro | Oscuro | Uso | Contraste claro / oscuro |
|---|---|---|---|---|
| `--fondo` | `#eef1ed` | `#111613` | Fondo de la aplicación | — |
| `--superficie` | `#ffffff` | `#1a201c` | Paneles y tablas | — |
| `--superficie-elevada` | `#ffffff` | `#222a25` | Diálogos y cajón | — |
| `--tinta` | `#1c211d` | `#e6ebe7` | Texto | 16.3:1 / 13.7:1 |
| `--tinta-suave` | `#4d564f` | `#b3bdb5` | Texto secundario | 7.6:1 / 8.6:1 |
| `--tinta-tenue` | `#5f6862` | `#97a39a` | Ayudas, metadatos y ejemplos en campos | 5.8:1 / 6.3:1 |
| `--linea-control` | `#7b877e` | `#6f7c73` | Borde de campos (mínimo 3:1) | 3.7:1 / 3.8:1 |
| `--acento` | `#1f5135` | `#8bd3a8` | Enlaces, estado activo e íconos | 9.2:1 / 9.5:1 |
| `--accion` | `#1f5135` | `#2f7d50` | Fondo del botón principal (texto blanco) | 9.2:1 / 5.0:1 |
| `--maiz` | `#8a5a0b` | `#e5ad4f` | Advertencia y bloqueado | 5.9:1 / 8.2:1 |
| `--alerta` | `#a8261b` | `#ff9585` | Error | 7.1:1 / 7.8:1 |
| `--peligro` | `#a8261b` | `#b3261e` | Fondo de acción destructiva (texto blanco) | 7.1:1 / 6.5:1 |
| `--foco` | `#1d5fa8` | `#7fb2f0` | Anillo de foco | 6.5:1 / 7.5:1 |

Con **contraste aumentado** (`prefers-contrast: more`), el texto secundario toma el color del texto principal y los bordes se oscurecen a `#3d453f` (o se aclaran a `#b3bdb5` en oscuro).

El verde es el del potrero, no un acento de moda. El azul se reserva para el foco, así nunca se confunde con una acción.

## Tipografía

**Public Sans** (variable y autoalojada con `@fontsource-variable`) es una tipografía pensada para interfaces de gobierno: neutra, con cifras claras y buen soporte del español. Las cifras usan `tabular-nums` (`.cifras`).

Escala de 1.2 sobre 16 px: 12 · 14 · 16 · 19 · 23 · 28 · 33 px (`--texto-xs` a `--texto-3xl`).

## Espaciado, grid y puntos de quiebre

- Base de 4 px: `--e-1` (4) a `--e-16` (64).
- Puntos de quiebre en `em`, para que reaccionen al tamaño de letra del navegador y no solo al ancho (HIG `typography.md › Supporting Dynamic Type`). Con texto al 200 % en una pantalla de escritorio, la interfaz pasa sola al diseño de celular:
  - 37.5em (600 px): los diálogos ocupan toda la pantalla.
  - 45em (720 px): la tabla de usuarios pasa a bloques.
  - 56.25em (900 px): el ingreso pasa a una columna.
  - 64em (1024 px): la navegación lateral pasa a cajón.
- Ancho de lectura limitado en los formularios: 24 rem en ingreso y 52 rem en el editor de roles.

## Radios y elevación

| Elemento | Radio |
|---|---|
| Sellos de estado | 2 px, casi rectos como un sello de tinta |
| Controles y botones | 4 px |
| Paneles y diálogos | 8 px |

Los paneles se separan con bordes. La sombra (`--sombra-flotante`) queda solo para lo que flota: diálogos, cajón móvil y mensajes.

## Estados interactivos

- **Hover:** cambia el fondo o el borde a potrero.
- **Focus:** anillo azul de 3 px, siempre visible con teclado.
- **Active:** el botón principal baja 1 px.
- **Deshabilitado:** opacidad de 0.55 y cursor `not-allowed`.
- **Cargando:** spinner y verbo en gerundio ("Guardando…").
- **Error:** borde rojo, mensaje debajo del campo y `aria-invalid`; el foco va al primer campo con error.
- **Vacío:** dice qué pasó y ofrece una acción ("Limpiar filtros").

## Movimiento

- **Presión:** todos los botones bajan a `scale(0.97)` en 120 ms (HIG `buttons.md`: "Always include a press state").
- **Color y hover:** 150 ms con `ease`. Los efectos de hover del menú solo aplican con puntero fino (`hover: hover`).
- **Diálogos:** entran desde `scale(0.96)` con opacidad, en 200 ms con `cubic-bezier(0.23, 1, 0.32, 1)`. Nunca desde `scale(0)`.
- **Cajón móvil:** curva de iOS `cubic-bezier(0.32, 0.72, 0, 1)` en 300 ms.
- No hay animaciones de aparición al hacer scroll.
- `prefers-reduced-motion` reduce todo a 1 ms.

## Materiales

La barra superior del celular es la única capa funcional que flota sobre el contenido. Es translúcida (`backdrop-filter: saturate(180%) blur(16px)`), según HIG `materials.md` y `liquid-glass.md`, que reservan el material para los controles y nunca para el contenido. Con `prefers-reduced-transparency` vuelve a ser sólida.

## Wireframe

```
INGRESO (escritorio)                      APLICACIÓN (escritorio)
┌───────────────┬──────────────────┐      ┌──────────┬─────────────────────────────┐
│ ▣ ICA BA      │                  │      │ ICA BA   │ Usuarios       [Nuevo usuario]│
│               │  Ingresar        │      │          │ descripción                  │
│ Evaluación de │  [correo      ]  │      │ Inicio   │ [Buscar........] [Rol] [Est.]│
│ bienestar...  │  [clave  ][Most] │      │>Usuarios │ ┌──────────────────────────┐ │
│ ───────────── │  [  Ingresar   ] │      │ Roles    │ │Nombre  Rol  Estado  Últ. │ │
│ Admin  │ ...  │                  │      │ Mi cuenta│ │...                Editar │ │
│ Evalua │ ...  │                  │      │          │ └──────────────────────────┘ │
│ Consul │ ...  │                  │      │ Nombre   │                              │
│ pie           │                  │      │[Cerrar]  │                              │
└───────────────┴──────────────────┘      └──────────┴─────────────────────────────┘
```

## Decisiones descartadas

| Primera idea | Por qué se descartó | Decisión final |
|---|---|---|
| Angular Material | Su aspecto es el de cualquier panel de administración y suma unos 200 kB | Componentes propios sobre variables CSS |
| Fondo crema con titular serif | Es el resultado genérico de "sitio institucional" | Fondo gris verdoso frío, una sola familia tipográfica |
| Íconos en cajas de color para cada rol en el ingreso | Solo decoran | Ficha con renglones: rol y qué hace |
| Píldoras redondeadas para los estados | No se distinguen de los botones | Sellos rectos con borde |
| Tarjetas con sombra para todo | Ruido visual y jerarquía plana | Bordes, con sombra solo en lo que flota |
| Menú del celular con los mismos ítems en barra inferior | Duplica la navegación | Cajón lateral con la sesión al pie |
| Tabla con scroll horizontal en móvil | Obliga a desplazarse en dos ejes | Cada usuario es un bloque con las acciones abajo |
| Contraseña temporal escrita por el administrador | Viaja en claro y el administrador la conoce | Invitación por correo con enlace de un solo uso |
