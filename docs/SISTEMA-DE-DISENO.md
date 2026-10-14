# Sistema de diseño

Los tokens están en `frontend/src/styles.scss`. Este documento explica por qué son así.

## Idea

**La ficha de campo.** El evaluador del ICA trabaja con formularios impresos: rótulos claros, renglones y sellos de estado. La interfaz toma esa claridad, sin imitar el papel.

Principios:

1. **Legible en campo.** Contraste alto, texto de 16 px como mínimo en los controles y objetivos táctiles de 44 px. Se usa en tabletas y celulares, a veces al sol.
2. **El estado siempre a la vista.** Activo, inactivo y bloqueado se muestran con sellos rectos y con borde, no con color solo.
3. **Una acción principal por pantalla.** Solo hay un botón verde sólido por vista.
4. **Institucional y sobrio.** Sin degradados, brillos ni ilustraciones decorativas.

## Paleta

Contraste medido con la fórmula WCAG 2.1.

| Token | Color | Uso | Sobre blanco | Sobre `--fondo` |
|---|---|---|---|---|
| `--potrero-700` | `#1f5135` | Acción principal, enlaces y estado activo | 9.2:1 | 8.1:1 |
| `--potrero-900` | `#143823` | Panel de ingreso y hover principal | 13.0:1 (texto blanco encima) | — |
| `--tinta` | `#1c211d` | Texto | 16.3:1 | 14.4:1 |
| `--tinta-suave` | `#4d564f` | Texto secundario | 7.6:1 | 6.7:1 |
| `--tinta-tenue` | `#5f6862` | Ayudas y metadatos | 5.8:1 | 5.1:1 |
| `--maiz-700` | `#8a5a0b` | Advertencia y bloqueado | 5.9:1 | 5.2:1 |
| `--alerta-700` | `#a8261b` | Error y acciones destructivas | 7.1:1 | 6.2:1 |
| `--foco` | `#1d5fa8` | Anillo de foco | 6.5:1 | 5.7:1 |
| `--fondo` | `#eef1ed` | Fondo de la aplicación | — | — |

El verde es el del potrero, no un acento de moda. El azul se reserva para el foco, así nunca se confunde con una acción.

## Tipografía

**Public Sans** (variable y autoalojada con `@fontsource-variable`) es una tipografía pensada para interfaces de gobierno: neutra, con cifras claras y buen soporte del español. Las cifras usan `tabular-nums` (`.cifras`).

Escala de 1.2 sobre 16 px: 12 · 14 · 16 · 19 · 23 · 28 · 33 px (`--texto-xs` a `--texto-3xl`).

## Espaciado, grid y puntos de quiebre

- Base de 4 px: `--e-1` (4) a `--e-16` (64).
- Puntos de quiebre:
  - 600 px: los diálogos ocupan toda la pantalla.
  - 720 px: la tabla de usuarios pasa a bloques.
  - 900 px: el ingreso pasa a una columna.
  - 1024 px: la navegación lateral pasa a cajón.
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

- 150 ms para hover y color; 240 ms para diálogos, cajón y mensajes.
- No hay animaciones de aparición al hacer scroll.
- `prefers-reduced-motion` reduce todo a 1 ms.

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
