Diccionario de datos
====================

Colecciones de Cloud Firestore del proyecto `bienestar-animal-ica`. La columna **Obligatorio** indica si las reglas de seguridad o la aplicación exigen el campo. Las fechas son marcas de tiempo del servidor de Firestore, salvo `fechaVisita`, que es texto con formato AAAA-MM-DD.

Seguridad y acceso
------------------

**roles**

Roles del sistema y permisos que otorgan. El identificador es el código del rol en minúsculas.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Nombre visible, de 2 a 80 caracteres |
| `descripcion` | texto o nulo | No | Descripción, hasta 255 caracteres |
| `permisos` | lista de texto | Sí | Claves de permiso de `compartido/permisos.ts` |
| `sistema` | booleano | Sí | Rol base: no se puede inactivar |
| `activo` | booleano | Sí | Si es falso, sus usuarios pierden el acceso |
| `actualizadoEn` | fecha | No | Última modificación |

**usuarios**

Personas con acceso a la plataforma. El identificador es el `uid` de Firebase Authentication; la contraseña la guarda Firebase, nunca Firestore.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombres` | texto | Sí | Nombres, hasta 80 caracteres |
| `apellidos` | texto | Sí | Apellidos, hasta 80 caracteres |
| `correo` | texto | Sí | Correo en minúsculas; igual al de Firebase Authentication |
| `documento` | texto o nulo | No | Número de documento |
| `telefono` | texto o nulo | No | Teléfono |
| `rol` | texto | Sí | Identificador del documento en `roles` |
| `activo` | booleano | Sí | Si es falso, la persona pierde el acceso de inmediato |
| `ultimoIngreso` | fecha o nulo | No | Último ingreso |
| `creadoEn`, `actualizadoEn` | fecha | No | Creación y última modificación |

**auditoria**

Bitácora de acciones relevantes. Solo se agregan entradas.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `actorId` | texto | Sí | `uid` de quien hizo la acción; debe ser quien la registra |
| `accion` | texto | Sí | Por ejemplo `evaluacion.finalizada` o `usuario.creado` |
| `entidad` | texto | Sí | Tipo de registro afectado |
| `entidadId` | texto | Sí | Identificador del registro afectado |
| `detalle` | mapa | No | Datos adicionales de la acción |
| `creadoEn` | fecha | Sí | Hora del servidor |


Parametrización de la norma
---------------------------

**especies**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Nombre visible, por ejemplo Bovinos |
| `activa` | booleano | Sí | Si se puede registrar y evaluar |

**libertades**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Nombre de la libertad según la norma |
| `codigo` | texto | No | Código que usa la aplicación: `NUTRICION`, `SALUD`, `CONFORT` o `COMPORTAMIENTO` |
| `peso` | número | Sí | Peso en la nota total, de 0 a 1 (0,2, 0,5, 0,15 y 0,15) |

**niveles**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Bajo, Medio, Alto o Excelente |
| `min` | número | Sí | Límite inferior en la escala de 0 a 5 |
| `max` | número | Sí | Límite superior |

**criterios**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Nombre del criterio, por ejemplo Suministro de agua |
| `libertad` | texto | Sí | Identificador del documento en `libertades` |
| `sistemas` | lista de texto | Sí | `lecheria`, `carne` y `doble_proposito` donde aplica |
| `tamanos` | lista de texto | Sí | `pequeno` y `mediano_grande` donde aplica |
| `indicadores` | lista de texto | Sí | Indicadores que se califican |
| `orden` | número | Sí | Posición en la lista de chequeo |
| `version` | texto | No | Versión de la lista, por ejemplo `ICA-2023.1` |


Predios y evaluaciones
----------------------

**predios**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | texto | Sí | Nombre de la finca, de 2 a 120 caracteres |
| `propietario` | mapa | Sí | `nombre`, `documento`, `telefono` y `correo` del propietario |
| `propietarioCorreo` | texto o nulo | Sí | Copia del correo en minúsculas; con él el propietario consulta el predio |
| `departamento`, `municipio` | texto | Sí | Ubicación |
| `vereda`, `direccion` | texto o nulo | No | Ubicación detallada |
| `latitud`, `longitud` | número o nulo | No | Coordenadas |
| `areaHectareas` | número o nulo | No | Área |
| `sistema` | texto o nulo | No | `LECHERIA`, `CARNE` o `DOBLE_PROPOSITO`; define los criterios que aplican |
| `notas` | texto o nulo | No | Información adicional para la visita |
| `especies` | lista de mapas | Sí | De 1 a 10 elementos con `especieId`, `crias`, `jovenes` y `adultos` |
| `totalAnimales` | número | No | Suma del inventario |
| `creadoPor` | texto | Sí | `uid` de quien registró el predio |
| `creadoEn`, `actualizadoEn` | fecha | No | Creación y última modificación |

**evaluaciones**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `predioId` | texto | Sí | Predio evaluado |
| `propietarioCorreo` | texto o nulo | Sí | Copia del correo del predio |
| `especieId` | texto | Sí | Especie evaluada |
| `evaluadorId` | texto | Sí | `uid` del evaluador |
| `evaluadorNombre` | texto | No | Nombre del evaluador para los informes |
| `estado` | texto | Sí | `borrador` o `finalizada` |
| `versionLista` | texto | Sí | Versión de la lista de chequeo aplicada |
| `fechaVisita` | texto | Sí | Fecha de la visita, AAAA-MM-DD |
| `inventario` | mapa | Sí | Copia de `crias`, `jovenes` y `adultos` al iniciar |
| `sistema` | texto o nulo | No | Copia del sistema productivo del predio |
| `respuestas` | mapa | Sí | Por código de indicador (`1.1`, `1.2`…): `respuesta` (`CUMPLE`, `PARCIAL`, `NO_CUMPLE`, `NO_APLICA`) y `observacion` |
| `observacionGeneral` | texto o nulo | No | Observación de la visita |
| `puntaje` | número | Al finalizar | Puntaje total de 0 a 5 |
| `nivel` | texto | Al finalizar | `BAJO`, `MEDIO`, `ALTO` o `EXCELENTE`; debe corresponder al puntaje |
| `resultado` | mapa | Al finalizar | Puntaje por libertad, libertades en nivel bajo y hallazgos |
| `recomendacion` | mapa | Al finalizar | Recomendaciones vigentes: `origen`, `modelo`, `resumen`, `recomendaciones` y `creadoEn` |
| `guardadoEn` | fecha | Sí | Último guardado |
| `finalizadaEn` | fecha | Al finalizar | Hora del servidor al finalizar |
| `creadoEn` | fecha | Sí | Inicio de la evaluación |

**recomendaciones**

Historial de las recomendaciones de cada evaluación; se agrega un documento cada vez que se generan.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `evaluacionId` | texto | Sí | Evaluación finalizada |
| `predioId` | texto | Sí | Predio de la evaluación |
| `propietarioCorreo` | texto o nulo | Sí | Copia del correo de la evaluación |
| `origen` | texto | Sí | `IA` o `REGLAS` |
| `modelo` | texto o nulo | No | Modelo de IA que las generó |
| `resumen` | texto | Sí | Resumen en lenguaje sencillo |
| `recomendaciones` | lista de mapas | Sí | `prioridad`, `titulo`, `problema`, `porque` y `acciones` |
| `creadoPor` | texto | Sí | `uid` de quien las generó |
| `creadoEn` | fecha | Sí | Momento de la generación |
