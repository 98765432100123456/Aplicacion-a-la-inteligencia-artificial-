Manual de usuario
=================

Este manual describe las funciones disponibles en la versión actual de ICA Bienestar Animal: ingreso y registro, predios, evaluaciones, resultados e informes, historial, gestión de usuarios, gestión de roles y administración de la cuenta propia.


Roles del sistema
-----------------

Lo que cada persona puede ver y hacer depende del rol asignado. El menú muestra únicamente las secciones permitidas para ese rol.

| Rol | Funciones principales |
|---|---|
| Administrador | Gestiona usuarios, roles, catálogos y la parametrización de especies. Conserva siempre todos los permisos |
| Evaluador | Registra fincas y diligencia las evaluaciones en campo |
| Consultor externo | Consulta predios, resultados, historial y reportes sin modificarlos |
| Propietario del predio | Consulta sus propios predios, los resultados de las evaluaciones finalizadas, las observaciones, las recomendaciones y los informes |

El administrador puede crear roles adicionales y ajustar los permisos de los roles existentes, con la excepción del rol Administrador.


Ingreso
-------

En la pantalla **Ingresar** se escriben el correo electrónico registrado y la contraseña, y se selecciona **Ingresar**. El botón **Mostrar** permite verificar la contraseña escrita antes de enviarla.

Cuando los datos no son correctos, el sistema muestra el mensaje *Correo o contraseña incorrectos.* Después de varios intentos fallidos seguidos, Firebase bloquea temporalmente los intentos desde ese equipo; durante ese tiempo es posible recuperar el acceso mediante la recuperación de contraseña.

**Ingreso con Google, Facebook o Microsoft.** Debajo del formulario aparecen los botones **Google**, **Facebook** y **Microsoft**. Al seleccionar uno se abre una ventana del proveedor para confirmar la identidad; el correo de esa cuenta debe estar verificado. Si la persona no tenía cuenta, se crea con el rol Propietario. El proveedor solo confirma quién es la persona: lo que puede ver y hacer lo define siempre su rol en la plataforma.

La sesión se cierra al seleccionar **Cerrar sesión** en el menú o al cerrar el navegador. Si el administrador inactiva la cuenta, la sesión se cierra de inmediato; si cambia el rol o sus permisos, el menú se actualiza sin necesidad de volver a ingresar.


Registro de propietarios
------------------------

Un propietario puede crear su propia cuenta desde la pantalla de ingreso, con el enlace **Cree su cuenta** de la pregunta *¿Es propietario de una finca?* Se escriben los nombres, los apellidos, el correo electrónico, que debe ser el mismo que el propietario dio al evaluador, y una contraseña. El sistema envía un correo para confirmar la dirección; hasta que el propietario abre ese enlace, no puede ver sus predios. Después de confirmarlo, ingresa con su correo y su contraseña.

Los predios aparecen en la cuenta cuando el evaluador registra ese correo en los datos del predio. Si el propietario ingresa y no ve su finca, la pantalla le indica si falta confirmar el correo o qué correo debe darle al evaluador.


Recuperación de contraseña
--------------------------

Desde la pantalla de ingreso se selecciona **¿Olvidó su contraseña?**, se escribe el correo registrado y se selecciona **Enviar enlace**. Si el correo corresponde a una cuenta, Firebase envía un mensaje con un enlace para crear una nueva contraseña. Por seguridad, la respuesta en pantalla es la misma exista o no el correo.

El enlace solo puede usarse una vez y vence al cabo de un tiempo. Al abrirlo, se escribe la nueva contraseña y se guarda. La contraseña debe tener entre 10 y 72 caracteres e incluir al menos una letra y un número. Si el enlace venció o ya fue usado, se solicita uno nuevo.


Inicio
------

La pantalla de inicio saluda a la persona e indica el rol con el que ingresó. Para quienes gestionan usuarios, muestra además el número de usuarios activos, de usuarios inactivos y de roles configurados; cada cifra conduce a la lista correspondiente.

Debajo se encuentra la guía de bienestar animal, basada en la *Metodología para evaluar el bienestar animal en las especies bovina y bufalina* del ICA (versión 2.0, 2023). La guía presenta:

- **Libertades y su peso.** Las cinco libertades se agrupan en cuatro bloques, con el peso de cada uno en la calificación del predio. Al seleccionar un bloque se muestra qué revisa el evaluador, los cuidados recomendados en la finca y la señal de alerta.
- **Niveles de resultado.** La escala de cuatro niveles (bajo, medio, alto y excelente) con sus rangos de referencia de 0 a 5.
- **Cálculo de la muestra.** A partir del inventario de crías, jóvenes y adultos se obtienen el tipo de productor, la metodología que aplica, la muestra mínima para la inspección visual y su reparto por grupo de edad.
- **Tipos de indicador.** Las fuentes de los indicadores y los métodos con que se verifican.


Predios
-------

La sección **Predios** lista las fincas registradas, con su municipio, el total de animales y el resultado de su última evaluación. El campo **Buscar** localiza un predio por su nombre, el de su propietario o el municipio. Para el propietario, la sección se llama **Mis predios** y solo muestra los suyos.

**Registro de un predio**

Con el permiso para gestionar predios se selecciona **Nuevo predio**. El formulario se organiza en cuatro bloques:

- **Predio.** Nombre, departamento y municipio, y de forma opcional la vereda, la dirección o indicaciones para llegar, las coordenadas, el área en hectáreas y el sistema productivo (lechería, carne o doble propósito). El sistema productivo define qué criterios se evalúan: por ejemplo, la castración no aplica en lechería y la mastitis no aplica en carne.
- **Propietario.** Nombre y teléfono de contacto, y de forma opcional el documento y el correo. Con ese correo el propietario consulta el predio en la plataforma.
- **Especies e inventario.** Para cada especie se registran las crías, los jóvenes y los adultos. Mientras se escriben, el formulario muestra el tipo de productor (pequeño, mediano o grande) y la muestra mínima de animales que exige la norma del ICA. Con **Agregar otra especie** se registran varias.
- **Información adicional.** Datos útiles para la visita, como accesos, instalaciones u horarios de ordeño.

El predio se guarda con **Registrar predio**.

**Ficha del predio**

Al seleccionar un predio se abre su ficha, que reúne en un solo lugar:

- **Editar finca**, que abre el mismo formulario con los datos actuales; los cambios se guardan con **Guardar cambios**.
- **Realizar evaluación**, que inicia la evaluación. Si el predio cría varias especies, el sistema pregunta cuál se va a evaluar, porque la norma exige una evaluación por especie. Si ya hay una evaluación en curso, el botón dice **Continuar evaluación**.
- Los datos del predio y del propietario, el inventario por especie con su tipo de productor y su muestra mínima, y las evaluaciones en curso.
- El **Historial**, descrito más adelante.


Evaluación
----------

La evaluación presenta la fecha de la visita, el inventario, el tipo de productor y la muestra mínima, y debajo los 23 criterios de la norma del ICA con sus indicadores, agrupados por libertad. Solo aparecen los criterios que aplican al sistema productivo y al tamaño del predio: los registros documentales y el uso de medicamentos se exigen a medianos y grandes productores. Los indicadores críticos se marcan como **Crítico**.

Cada indicador se responde con **Cumple**, **Cumple en parte**, **No cumple** o **No aplica**; algunos solo admiten cumple o no cumple. Con **Agregar observación** se registra lo observado, por ejemplo cuántos animales presentan una condición. Al final hay un espacio para la observación general de la visita.

Las respuestas se guardan solas unos segundos después de cada cambio; la barra inferior muestra el avance y la hora del último guardado. El botón **Guardar** guarda de inmediato. Es posible salir y continuar después desde la ficha del predio.

Cuando todos los indicadores tienen respuesta se selecciona **Finalizar**. El sistema pide confirmación, porque después ya no es posible cambiar las respuestas, y calcula el resultado. La preparación de las recomendaciones y los informes puede tardar hasta un minuto.


Resultado e informes
--------------------

La pantalla de resultado muestra:

- El **nivel de bienestar** (bajo, medio, alto o excelente) y el puntaje de 0 a 5.
- El **resultado por libertad**, con el peso de cada una en la nota, y un aviso si alguna quedó en nivel bajo.
- Las **recomendaciones para el propietario**, ordenadas por prioridad (*Atender ya*, *Atender pronto* y *Mejorar cuando pueda*). Cada una explica el problema, por qué importa y qué puede hacer. Se indica si fueron generadas con inteligencia artificial o por el sistema sin IA.
- Los **hallazgos**, con los incumplimientos críticos primero, y la opción **Ver todas las respuestas**.

Dos botones descargan los informes en PDF:

| Informe | Para quién | Contenido |
|---|---|---|
| **Informe técnico (PDF)** | Evaluador y entidad | Datos del predio, inventario, tipo de productor, muestra, puntaje por libertad, nivel, hallazgos, respuestas con su método de verificación y observaciones, con la terminología de la norma |
| **Recomendaciones para el propietario (PDF)** | Propietario | Resultado explicado en lenguaje sencillo, problemas, causas, acciones y prioridades, con el aviso de que las recomendaciones no reemplazan el concepto oficial del ICA |

Si las recomendaciones se generaron sin IA, por ejemplo porque el servicio no respondió, el evaluador puede seleccionar **Volver a generar** más adelante; el informe del propietario se actualiza.


Historial
---------

El historial de la ficha del predio lista las evaluaciones finalizadas de la más reciente a la más antigua, en dos vistas que se eligen con el selector **Ver**:

- **Evaluaciones técnicas:** fecha, especie, código de la evaluación, evaluador, número de hallazgos, nivel y puntaje, con la descarga del informe técnico.
- **Recomendaciones:** el resumen de las recomendaciones de cada evaluación, su origen y la descarga del informe para el propietario.

El propietario ve el historial de sus predios, pero no las evaluaciones que siguen en curso.


Gestión de usuarios
-------------------

La sección **Usuarios** presenta la lista de personas con acceso a la plataforma, con su rol, su estado y la fecha de su último ingreso. Está disponible para los roles con permiso para consultar o gestionar usuarios.

**Búsqueda y filtros**

El campo **Buscar** localiza usuarios por nombre, apellido, correo o número de documento. El filtro **Rol** y el selector **Estado** (Todos, Activos, Inactivos) limitan la lista a un rol específico o a los usuarios activos o inactivos. Los filtros aplicados se conservan en la dirección de la página, de modo que pueden compartirse o recuperarse al recargar.

**Creación de un usuario**

Se selecciona **Nuevo usuario** y se completan los nombres, los apellidos, el correo electrónico y el rol; el documento y el teléfono son opcionales. Al seleccionar **Crear usuario**, el sistema crea la cuenta en Firebase y envía a la persona un correo con un enlace para que defina su propia contraseña. El administrador no conoce ni transmite la contraseña en ningún momento. No es posible registrar dos usuarios con el mismo correo.

**Edición de un usuario**

La opción **Editar** de cada fila permite modificar los datos y el rol. El correo no se puede cambiar, porque identifica la cuenta; si está errado, se crea un usuario nuevo y se inactiva el anterior. Cuando el rol de una persona cambia, sus permisos se actualizan de inmediato, aunque tenga la sesión abierta. Desde la misma ventana, **Enviar enlace de acceso** remite a la persona un enlace para crear una nueva contraseña, útil cuando no recibió la invitación o la olvidó.

Si se intenta cerrar la ventana con datos escritos y sin guardar, el sistema solicita confirmación con las opciones **Seguir editando** y **Descartar cambios**.

**Activación e inactivación**

La opción **Inactivar** impide que la persona ingrese y cierra sus sesiones abiertas; antes de aplicarla, el sistema solicita confirmación. La opción **Activar** restablece el acceso. Ningún administrador puede inactivar su propia cuenta ni cambiar su propio rol, y siempre debe existir al menos un administrador activo.

**Estados**

| Estado | Significado |
|---|---|
| Activo | La persona puede ingresar |
| Inactivo | El acceso está suspendido por un administrador |


Gestión de roles y permisos
---------------------------

La sección **Roles y permisos** muestra cada rol con su número de permisos, el número de usuarios que lo tienen y la fecha de su última actualización. Al seleccionar un rol se abre su detalle.

**Creación de un rol**

Se selecciona **Nuevo rol** y se indican el nombre, un código interno en mayúsculas, que no puede modificarse después, y una descripción opcional. Los permisos se agrupan por módulo; cada permiso se activa con un interruptor y el interruptor de cada módulo activa o desactiva todos sus permisos a la vez. El rol se guarda con **Crear rol**.

**Edición de un rol**

En el detalle de un rol pueden modificarse el nombre, la descripción y los permisos. Los cambios aplican de inmediato a todos los usuarios que tienen el rol. Si se intenta salir de la pantalla con cambios sin guardar, el navegador solicita confirmación.

**Restricciones**

Los roles base (Administrador, Evaluador, Consultor externo y Propietario del predio) no pueden inactivarse. El rol Administrador conserva siempre todos los permisos, para que nunca falte quien gestione la seguridad. Un rol solo puede inactivarse cuando ningún usuario activo lo tiene asignado.


Cuenta
------

La sección **Cuenta** muestra el nombre, el correo y el rol de la persona. Para corregir esos datos debe solicitarse el cambio a un administrador.

Desde esta sección se cambia la contraseña: se escribe la contraseña actual, la nueva y su confirmación, y se selecciona **Cambiar contraseña**. Quien ingresa con Google, Facebook o Microsoft cambia su contraseña en ese servicio.


Uso en teléfono móvil y accesibilidad
-------------------------------------

En pantallas pequeñas, el menú se abre con el botón ubicado en la esquina superior derecha y se cierra al elegir una sección, al tocar fuera de él o con la tecla `Escape`; al final del menú se encuentran el nombre de la persona y el botón **Cerrar sesión**. La lista de usuarios se presenta como fichas con las acciones al pie de cada una, y los formularios se abren como hojas que suben desde el borde inferior.

La aplicación adopta el modo claro u oscuro configurado en el dispositivo. El botón con el ícono de luna o de sol, en la barra superior y en la pantalla de ingreso, cambia de modo, y la elección se recuerda en ese navegador. La aplicación también responde a la preferencia de contraste aumentado. Todas las funciones pueden usarse con el teclado y con lectores de pantalla, y la interfaz se reorganiza cuando se aumenta el tamaño de letra del navegador.
