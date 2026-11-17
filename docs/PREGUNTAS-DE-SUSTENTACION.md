Preguntas de sustentación
=========================

Preguntas que haría un profesor experto en ingeniería de software, seguridad e inteligencia artificial, con una respuesta argumentada y la evidencia que se puede mostrar en el código. Complementa el [informe técnico](INFORME-TECNICO.md).

**Cómo usar este documento.** Responda primero la idea central en una frase, luego el argumento y al final muestre la evidencia (archivo, prueba o pantalla). Si una pregunta toca una limitación, reconózcala y explique cómo se resolvería: un evaluador valora más la honestidad técnica que una respuesta que lo promete todo.


1. Arquitectura y decisiones de diseño
--------------------------------------

**1. ¿Por qué no tiene un servidor propio (backend)? ¿No es inseguro que el navegador hable directamente con la base de datos?**

No es inseguro porque la seguridad no está en el navegador sino en las **reglas de Firestore**, que Google ejecuta en su servidor antes de cada lectura y escritura. Un atacante puede modificar la aplicación o llamar a Firestore con su propio código, y aun así las reglas revisan su sesión, su rol, sus permisos y la forma de los datos. Es el mismo principio de un backend ("nunca confiar en el cliente"), aplicado por la plataforma. A cambio se elimina un servidor que mantener, actualizar, escalar y pagar, y la superficie de ataque que ese servidor tendría.
*Evidencia:* `firebase/firestore.rules` y sus 16 pruebas en `firebase/pruebas/reglas.test.ts` (por ejemplo, "el propietario solo ve los predios registrados con su correo verificado" o "nadie cambia su propio rol").

**2. El proyecto empezó con NestJS y PostgreSQL, pasó a MariaDB y terminó en Firebase. ¿No es eso una mala planificación?**

Fue una decisión de arquitectura tomada con evidencia, no improvisación. Con NestJS teníamos que administrar servidor, base de datos, respaldos, certificados y autenticación con Google, Facebook y Microsoft. Firebase resolvía esos requerimientos (autenticación con proveedores, HTTPS, reglas en el servidor, publicación) sin infraestructura propia. El costo del cambio fue bajo porque las pantallas ya dependían de **fachadas** (`AuthService`, `ApiService`, `FarmsApiService`) y no del servidor: se cambió la implementación detrás de las fachadas, no las pantallas. Eso muestra que la arquitectura estaba bien desacoplada.
*Evidencia:* historial de Git (commits del 27 de octubre) y `core/services/`.

**3. ¿Qué es el patrón de fachada y por qué hay dos implementaciones (Firebase y demostración)?**

La fachada es una interfaz única que usan las pantallas y que oculta quién atiende detrás. Hay dos implementaciones: Firebase (uso real) y una API simulada en el navegador (modo demostración). Eso permite mostrar y probar la aplicación sin conexión ni datos reales, y probar las pantallas sin depender de servicios externos. Es una aplicación del principio de inversión de dependencias.
*Evidencia:* `PROVEEDOR_SESION` en `core/services/auth.service.ts`, `core/demo/demo-api.interceptor.ts`.

**4. ¿Por qué existe la carpeta `compartido/` y cómo evitan que las copias se desincronicen?**

La norma del ICA, el cálculo, los permisos y las plantillas de los PDF los usan tanto la interfaz como las herramientas de Firebase (semilla y pruebas). Escribirlos dos veces es una fuente segura de errores. Se escriben una vez en `compartido/` y `scripts/compartido.mjs` los copia; la integración continua ejecuta `--verificar` y falla si alguna copia quedó desactualizada. Una sola fuente de verdad.

**5. ¿Por qué Angular y no React u otro marco?**

Angular trae de fábrica lo que la aplicación necesita: enrutador con guardas por permiso, formularios reactivos con validación, cliente HTTP con interceptores (que usamos para el modo demostración), inyección de dependencias (que usamos para las fachadas) y TypeScript estricto. Usamos la versión moderna: componentes independientes, señales y detección de cambios sin Zone.js, que reducen el tamaño y mejoran el rendimiento. Con React habría que elegir y mantener cada una de esas piezas por separado.

**6. ¿Cómo escala si el ICA lo usa en todo el país?**

Firestore y Hosting escalan horizontalmente sin configuración: no hay un servidor que se sature. Las consultas son por documento o por índice (predios por correo del propietario, evaluaciones por predio), así que su costo no crece con el tamaño total de la base. Lo que habría que vigilar son los costos (lecturas, llamadas a Gemini y funciones), y para eso hay límites de uso y alerta de presupuesto.


2. Firebase, datos y seguridad
------------------------------

**7. Explique paso a paso qué pasa cuando un propietario intenta leer un predio que no es suyo.**

La lectura llega a Firestore. Antes de responder, las reglas evalúan `esPropietarioDe(resource.data)`: la sesión debe estar verificada (`dosPasos()`), el usuario y su rol deben estar activos, el rol debe tener `predios.propios`, el correo del token debe estar verificado y debe ser igual al `propietarioCorreo` del predio. Si cualquiera falla, Firestore responde `permission-denied` y no entrega el documento. No importa que el atacante haya modificado la interfaz.
*Evidencia:* prueba "el propietario solo ve los predios registrados con su correo verificado".

**8. ¿Cuál es la diferencia entre autenticación y autorización en su sistema?**

La **autenticación** (quién es) la hace Firebase Authentication con contraseña o proveedor externo, más el código por correo. La **autorización** (qué puede hacer) la deciden el documento `usuarios/{uid}` (rol y estado) y los permisos del rol en `roles/{rol}`, que las reglas consultan en cada operación. Por eso inactivar a alguien o cambiarle el rol surte efecto de inmediato, aunque tenga la sesión abierta.

**9. ¿Por qué los permisos están en la base de datos y no en el token (custom claims)?**

Porque los permisos en el token solo cambian cuando el token se renueva (hasta una hora). En la base de datos, un cambio de rol o una inactivación aplica en la siguiente operación. El costo es una o dos lecturas extra por evaluación de las reglas, aceptable a esta escala. Además el administrador puede crear roles nuevos sin tocar código.

**10. ¿Cómo funciona la verificación en dos pasos y por qué no se puede saltar desde el navegador?**

Tras la contraseña, una Cloud Function genera un código aleatorio de 6 dígitos, guarda solo su resumen SHA-256 y lo envía por correo. Al verificarlo, la función registra el `auth_time` de ese inicio de sesión (un dato firmado por Google en el token) en `verificaciones/{uid}`, una colección que nadie puede escribir desde la aplicación. Las reglas exigen que el `auth_time` del token esté en esa lista. Saltarse la pantalla del código no sirve: sin ese registro, Firestore no entrega ningún dato.
*Evidencia:* regla `dosPasos()`, pruebas "sin el código del segundo paso…" y S5 en `e2e/seguridad.spec.ts`.

**11. ¿Por qué guardan el código como resumen SHA-256 y lo comparan con `timingSafeEqual`?**

Si alguien obtuviera acceso a la base, no vería códigos utilizables. El resumen lleva como sal el usuario y el momento del ingreso, así que un mismo código no sirve para otra sesión. `timingSafeEqual` compara en tiempo constante: evita que un atacante deduzca dígitos midiendo cuánto tarda la respuesta (ataque de tiempo).

**12. Con 6 dígitos hay un millón de combinaciones. ¿No se puede adivinar por fuerza bruta?**

Cada código admite 5 intentos y vence en 10 minutos; se pueden pedir máximo 5 códigos por hora. La probabilidad de acertar en una hora es de 25 en un millón, y cada bloqueo queda en la bitácora (`seguridad.codigo_bloqueado`). Además, para llegar al código el atacante ya necesita la contraseña.

**13. ¿Qué es la CSP y por qué no tienen scripts en línea?**

La política de seguridad de contenido le dice al navegador desde qué orígenes puede ejecutar código. Al prohibir scripts en línea, aunque alguien lograra inyectar HTML, el navegador no ejecutaría su JavaScript (defensa contra XSS). Por eso el script del modo oscuro está en un archivo (`tema.js`) y la compilación desactiva el CSS crítico en línea. El control automático falla si alguien debilita la política.

**14. ¿Cómo evitan que se suba una contraseña o una llave al repositorio?**

Tres capas: `.gitignore` excluye `.env`, llaves y cuentas de servicio; el control de seguridad automático busca patrones de secretos en cada compilación y detiene la publicación; y la integración continua revisa todo el historial de Git. Lo probamos plantando un token falso: el control lo detectó y detuvo la compilación. Las credenciales reales (correo, publicación) viven en Secret Manager y en los secretos de GitHub.

**15. ¿Qué pasa si una dependencia tiene una vulnerabilidad?**

La CI ejecuta `npm audit --omit=dev --audit-level=high` en los tres paquetes y falla con cualquier vulnerabilidad alta o crítica en lo que llega a producción. Dependabot propone actualizaciones cada semana. En esta revisión corregimos así una fuga de token en Angular y una inyección SMTP en nodemailer.

**16. ¿Por qué la sesión dura solo lo que la pestaña, se cierra a los 30 minutos sin uso y vence a las 12 horas?**

Los evaluadores trabajan en equipos compartidos en campo. Que la sesión no quede guardada al cerrar el navegador, que se cierre sola si el equipo queda desatendido y que el servidor la rechace a las 12 horas reduce el riesgo de que otra persona use la cuenta. La evaluación se guarda sola, así que cerrar la sesión no pierde trabajo.

**17. ¿Cumplen la Ley 1581 de 2012 de protección de datos?**

La aplicación publica la política de tratamiento de datos (finalidades, derechos del titular, plazos de respuesta), los términos y la política de cookies; solo usa almacenamiento esencial y no hace analítica ni publicidad. Los datos se minimizan: a la IA no se envían datos personales. Hay un pendiente que reconocemos: el correo de contacto para las solicitudes de los titulares debe definirlo el equipo (`CONTACTO_PRIVACIDAD`). Además, los servidores de Firebase pueden estar fuera de Colombia, y así se informa en la política.


3. Norma del ICA y cálculo
--------------------------

**18. ¿Cómo garantizan que el cálculo es fiel a la metodología del ICA?**

Cada árbol de escenarios está escrito como datos (preguntas, opciones, puntos, siguiente pregunta y cortes) y se prueba **hoja por hoja** contra los diagramas: para cada camino posible se comprueba la suma de puntos y el nivel resultante. Los pesos de las libertades, la escala y la muestra mínima están en un solo archivo (`norma.ts`) que también usan la guía de inicio, el asistente y los informes, así que no pueden contradecirse.
*Evidencia:* `core/norma/escenarios.spec.ts`, `core/norma/lista-chequeo.spec.ts`.

**19. Explique la fórmula del puntaje con un ejemplo.**

Dentro de una libertad, cada indicador vale 1 (cumple), 0,5 (parcial) o 0 (no cumple), multiplicado por su peso; cada árbol aporta puntos obtenidos sobre puntos máximos con el peso de su criterio. Por ejemplo, si en Salud el árbol de cojeras da 7 de 10 (0,7) y el de lesiones 10 de 10 (1,0), con igual peso, la libertad queda en 0,85 × 5 = 4,25. Luego el total pondera las cuatro libertades 20/50/15/15. Si Salud es 4,25 y las demás 5,0, el total es 0,2·5 + 0,5·4,25 + 0,15·5 + 0,15·5 = 4,6: nivel Excelente.

**20. ¿Por qué Salud pesa 50 %?**

Lo define la metodología del ICA: agrupa la libertad de dolor, lesión y enfermedad, que concentra los indicadores de mayor impacto en el animal. La aplicación no inventa pesos: los toma de la norma y los documenta en un solo lugar.

**21. ¿Qué pasa si el evaluador cambia una respuesta del árbol a mitad de camino?**

El árbol se recorre de nuevo desde el principio con las respuestas actuales (`recorrerArbol`). Las respuestas que quedaron fuera del nuevo camino se descartan al guardar (`rutaLimpia`) y el puntaje se recalcula al instante. Así nunca quedan puntos de un camino que ya no aplica.

**22. ¿Qué pasa con las evaluaciones hechas antes de introducir los árboles?**

`usaArboles()` detecta las evaluaciones que se respondieron por indicadores y las sigue calificando así. Cambiar de método no altera resultados ya emitidos, lo que es importante para la trazabilidad de un informe oficial.

**23. Una evaluación finalizada, ¿se puede alterar?**

No. Las reglas impiden cambiar respuestas, predio, evaluador o inventario de una evaluación finalizada; solo permiten regenerar las recomendaciones. También verifican que el nivel guardado corresponda al puntaje. Cada evaluación guarda la versión de la lista de chequeo con la que se diligenció (`ICA-2023.1`).

**24. Si el cálculo se hace en el navegador, ¿un evaluador malintencionado podría enviar un puntaje falso?**

Es la limitación más importante y la reconocemos. Las reglas verifican que el nivel sea coherente con el puntaje y que la evaluación no cambie después, pero no recalculan el puntaje desde las respuestas. La mitigación actual es que solo un evaluador autorizado puede finalizar y queda registrado en la bitácora. La solución definitiva es mover `calificar()` a una Cloud Function, que ya es posible porque el código está en `compartido/` y el proyecto ya tiene funciones.


4. Inteligencia artificial
--------------------------

**25. ¿Dónde está la inteligencia artificial y por qué es necesaria?**

En dos lugares. **Recomendaciones:** Gemini traduce los hallazgos técnicos a acciones concretas en lenguaje sencillo para el propietario, que es justo donde el informe técnico falla. **Asistente Clara:** responde preguntas libres sobre el uso de la aplicación y la norma. En ambos casos la IA no decide el puntaje: el cálculo es determinista y auditable; la IA solo comunica.

**26. ¿Cómo controlan las alucinaciones de la IA?**

Con cuatro barreras:
1. **Instrucciones** que limitan el tema y prohíben inventar normas o cifras.
2. **Salida estructurada** con esquema JSON.
3. **Validación** (`validarSalidaIA`) que descarta respuestas mal formadas.
4. **Respaldo por reglas** si algo falla.

El asistente se limita a una base de conocimiento propia y muestra el aviso "Las respuestas orientan; no reemplazan al médico veterinario ni la norma del ICA". El informe indica si las recomendaciones vinieron de la IA o de las reglas.

**27. ¿Qué datos le envían a Gemini? ¿No es un riesgo de privacidad?**

Solo especie, tipo de productor, municipio y los hallazgos (`datosParaIA`). Nunca nombres, documentos, teléfonos ni correos. La clave del modelo la administra Firebase AI Logic y no viaja en la aplicación.

**28. ¿Qué pasa si la IA no está disponible o se vuelve costosa?**

La evaluación nunca se bloquea: si Gemini no responde en 60 segundos, falla o devuelve algo inválido, se usan las recomendaciones por reglas. Para los costos hay límites: 30 preguntas libres por sesión en el asistente, `maxInstances` en las funciones y la recomendación de una alerta de presupuesto.

**29. ¿Qué es la inyección de instrucciones (prompt injection) y cómo los afecta?**

Es cuando un texto del usuario intenta cambiar las instrucciones del modelo, por ejemplo "ignora tus reglas y…". En el asistente el modelo no tiene herramientas, ni acceso a la base, ni datos privados en su contexto, así que lo peor que puede hacer es responder algo fuera de tema, y esa respuesta se muestra como texto sin interpretar. En las recomendaciones, la salida debe cumplir el esquema y pasa la validación.

**30. ¿Por qué Gemini y no otro modelo?**

Firebase AI Logic integra Gemini en el mismo proyecto: sin clave propia que proteger, con la misma autenticación y, en el futuro, con App Check. La arquitectura no depende del modelo: el nombre está en una sola variable (`modeloIA`) y la validación y el respaldo funcionan igual con cualquiera.

**31. ¿Hay riesgo de sesgo en las recomendaciones?**

El modelo no decide quién cumple o no: eso lo calcula la norma de forma determinista. El sesgo posible está en el tono o la prioridad de las recomendaciones; por eso las instrucciones fijan un registro respetuoso para productores colombianos y el esquema exige que cada recomendación se ate a un hallazgo concreto. Una evaluación con usuarios reales mediría su utilidad.


5. Ingeniería de software y calidad
-----------------------------------

**32. ¿Cómo saben que la aplicación funciona? Muéstreme las pruebas.**

| Suite | Pruebas | Qué cubre |
|---|---|---|
| Reglas de seguridad (emulador de Firestore) | **16** | Acceso por rol, propietario, dos pasos, evaluaciones finalizadas |
| Unitarias (Jasmine) | **45** | Árboles hoja por hoja, norma, sesión, asistente, redirecciones |
| Extremo a extremo (Playwright, escritorio y celular, con accesibilidad axe) | **69** | Flujos completos y regresiones de seguridad |

Todo corre automáticamente en GitHub Actions en cada cambio.

**33. ¿Qué es la integración continua en su proyecto y qué bloquea?**

Cada cambio ejecuta cuatro trabajos:
1. **Seguridad:** secretos, APIs peligrosas, cabeceras, reglas y dependencias.
2. **Reglas.**
3. **Interfaz:** pruebas unitarias y compilación de producción y de demostración.
4. **Extremo a extremo.**

Si uno falla, el cambio no se publica. La publicación automática solo corre en `main` y después de los cuatro.

**34. ¿Por qué pruebas de accesibilidad automáticas?**

Una herramienta de evaluación en campo la usan personas en celular, a pleno sol y a veces con limitaciones visuales. Cada prueba de extremo a extremo verifica WCAG 2.1 AA con axe, que los objetivos táctiles midan al menos 44 px y que no haya desplazamiento horizontal. Una regresión de accesibilidad rompe la CI igual que un error funcional.

**35. ¿Cómo manejan los errores para que el usuario no vea una pantalla en blanco ni detalles técnicos?**

Los errores de Firebase se traducen a mensajes en español (`http-error.ts`). Un manejador global muestra un aviso claro sin pila técnica. Cada pantalla tiene estados de carga (siluetas), error con botón de reintento y aviso sin conexión. Hay una prueba que verifica que los mensajes no contengan detalles internos (S6).

**36. ¿Cómo actualizan la aplicación sin que los usuarios descarguen nada?**

Cada compilación genera `version.json`. La página abierta lo consulta cada 5 minutos y al volver a la pestaña; si cambió, se recarga sola, esperando a que la persona termine de escribir. Si alguien abre una pantalla cuyos archivos ya no existen tras una publicación, la aplicación recarga esa página con la versión nueva, con protección contra recargas en ciclo.

**37. ¿Qué deuda técnica reconocen?**

- La verificación en dos pasos y la publicación automática dependen de activar el plan Blaze y configurar secretos.
- El puntaje se calcula en el cliente (pregunta 24).
- Falta App Check.
- La CSP permite estilos en línea.
- No hay modo sin conexión completo.

Todo está documentado con su solución en `docs/SEGURIDAD.md` y en el informe técnico.


6. Experiencia de usuario
-------------------------

**38. ¿Por qué listas desplegables en los árboles en vez de casillas?**

El diagrama del ICA es secuencial: cada respuesta decide la siguiente pregunta. Una lista desplegable por paso muestra solo la pregunta que corresponde, con los puntos de cada opción visibles para el evaluador, y evita respuestas incoherentes con el camino. El puntaje acumulado se ve en cada paso.

**39. ¿Por qué un asistente con mascota? ¿No es un adorno?**

El usuario final incluye propietarios con poca experiencia digital. Un asistente con preguntas sugeridas según el rol responde las dudas más comunes sin salir de la pantalla ni llamar a soporte. La mascota da cercanía, pero respeta `prefers-reduced-motion` y no tapa la acción principal. Las preguntas establecidas funcionan sin IA, así que el asistente no depende de un servicio externo.

**40. ¿Cómo se adapta a celular y tableta?**

Diseño adaptable con variables de espacio y tipografía fluida, menú desplegable en pantallas pequeñas, hojas que suben desde abajo para los formularios, objetivos táctiles grandes, modo oscuro y guardado automático. Las pruebas de extremo a extremo corren en escritorio de 1440 px y en un celular de 390 px.


7. Preguntas difíciles y cómo responderlas
------------------------------------------

**41. "Esto lo hizo una IA. ¿Qué aportaron ustedes?"**

Respuesta honesta y fuerte: las herramientas de IA aceleraron la escritura del código, pero las decisiones fueron nuestras y se pueden defender una por una:
- La arquitectura sin servidor y la migración a Firebase.
- La traducción de los diagramas del ICA a datos verificables.
- El modelo de roles y permisos.
- Cómo validar la salida de la IA y qué hacer cuando falla.
- Los controles de seguridad.

Puedo explicar y modificar cualquier archivo. Lo importante es que todo está verificado con pruebas automáticas que no dependen de quién escribió el código.

**42. "¿Por qué debería confiar el ICA en un puntaje calculado por su aplicación?"**

Porque el cálculo es determinista, está escrito en un solo lugar y se prueba contra cada camino de los diagramas oficiales. Además, la evaluación finalizada no se puede alterar, guarda la versión de la lista con que se hizo y queda en la bitácora quién la finalizó. El informe técnico muestra el detalle de cada árbol (pasos y puntos), así que un auditor puede rehacer la cuenta a mano.

**43. "Si Google cae, ¿se cae su aplicación?"**

Sí: dependemos de la disponibilidad de Firebase, que tiene acuerdos de nivel de servicio altos. Es una dependencia aceptada a cambio de no operar infraestructura. Los datos se pueden exportar de Firestore (procedimiento de respaldo en `docs/DESPLIEGUE.md`) y la lógica de negocio está en TypeScript independiente de Firebase (`compartido/`), lo que facilitaría migrar.

**44. "¿Qué harían diferente si empezaran de nuevo?"**

Elegiríamos Firebase desde el principio para evitar dos migraciones, y calcularíamos el puntaje en una Cloud Function desde el inicio. También activaríamos la publicación automática y App Check desde la primera semana, para que cada mejora llegara a producción sin pasos manuales.

**45. "Muéstreme en vivo que un consultor no puede editar un predio."**

Ingrese como consultor: no ve el botón "Nuevo predio" ni "Editar" (la interfaz los oculta). Y aunque los forzara, las reglas lo bloquean, porque el rol Consultor no tiene `fincas.gestionar`; está cubierto por las pruebas de reglas. Explique siempre las dos capas: la interfaz oculta, el servidor decide.


Consejos para la presentación
-----------------------------

1. **Abra con el problema** (evaluación en papel, sumas manuales, informe que el propietario no entiende) y **cierre con el resultado** (evaluación guiada, cálculo verificado, recomendaciones comprensibles).
2. **Demuestre en vivo un recorrido completo:** ingreso, predio, evaluación con árbol (cambie una respuesta y muestre cómo se recalcula), finalizar, recomendaciones de IA, informe PDF y vista del propietario.
3. **Tenga abiertos** `firestore.rules`, `compartido/calificacion.ts`, `compartido/escenarios.ts` y la última ejecución verde de GitHub Actions.
4. **Ante una limitación**, reconózcala, explique el riesgo real y la solución: está todo documentado.
5. **Distinga siempre** "lo que la interfaz oculta" de "lo que el servidor impide": es la idea central de la seguridad del proyecto.
