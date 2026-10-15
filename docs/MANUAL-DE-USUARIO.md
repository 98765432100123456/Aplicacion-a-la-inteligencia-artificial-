Manual de usuario
=================

Este manual describe las funciones disponibles en la versión actual de ICA Bienestar Animal: ingreso, recuperación de contraseña, gestión de usuarios, gestión de roles y administración de la cuenta propia.


Roles del sistema
-----------------

Lo que cada persona puede ver y hacer depende del rol asignado. El menú muestra únicamente las secciones permitidas para ese rol.

| Rol | Funciones principales |
|---|---|
| Administrador | Gestiona usuarios, roles, catálogos y la parametrización de especies. Conserva siempre todos los permisos |
| Evaluador | Registra fincas y diligencia las evaluaciones en campo |
| Consultor externo | Consulta resultados, historial y reportes sin modificarlos |

El administrador puede crear roles adicionales y ajustar los permisos de los roles existentes, con la excepción del rol Administrador.


Ingreso
-------

En la pantalla **Ingresar** se escriben el correo electrónico registrado y la contraseña, y se selecciona **Ingresar**. El botón **Mostrar** permite verificar la contraseña escrita antes de enviarla.

Cuando los datos no son correctos, el sistema muestra el mensaje *Correo o contraseña incorrectos.* Después de cinco intentos fallidos consecutivos, la cuenta se bloquea durante 15 minutos; durante ese tiempo es posible recuperar el acceso mediante la recuperación de contraseña.

La sesión se cierra al seleccionar **Cerrar sesión** en el menú, al cerrar el navegador o cuando transcurren ocho horas desde el ingreso. También se cierra de inmediato si el administrador inactiva la cuenta o cambia su rol.


Recuperación de contraseña
--------------------------

Desde la pantalla de ingreso se selecciona **¿Olvidó su contraseña?**, se escribe el correo registrado y se selecciona **Enviar enlace**. Si el correo corresponde a una cuenta activa, el sistema envía un mensaje con un enlace para crear una nueva contraseña. Por seguridad, la respuesta en pantalla es la misma exista o no el correo.

El enlace es válido durante 30 minutos y solo puede usarse una vez. Al abrirlo, se escribe la nueva contraseña dos veces y se selecciona **Guardar contraseña**. La contraseña debe tener entre 10 y 72 caracteres e incluir al menos una letra y un número. Si el enlace venció o ya fue usado, la pantalla lo indica y ofrece solicitar uno nuevo.


Inicio
------

La pantalla de inicio saluda a la persona e indica el rol con el que ingresó. Para quienes gestionan usuarios, muestra además el número de usuarios activos, de usuarios inactivos y de roles configurados; cada cifra conduce a la lista correspondiente.


Gestión de usuarios
-------------------

La sección **Usuarios** presenta la lista de personas con acceso a la plataforma, con su rol, su estado y la fecha de su último ingreso. Está disponible para los roles con permiso para consultar o gestionar usuarios.

**Búsqueda y filtros**

El campo **Buscar** localiza usuarios por nombre, apellido, correo o número de documento. Los filtros **Rol** y **Estado** limitan la lista a un rol específico o a los usuarios activos o inactivos. Los filtros aplicados se conservan en la dirección de la página, de modo que pueden compartirse o recuperarse al recargar.

**Creación de un usuario**

Se selecciona **Nuevo usuario** y se completan los nombres, los apellidos, el correo electrónico y el rol; el documento y el teléfono son opcionales. Al seleccionar **Crear usuario**, el sistema envía a la persona un correo con un enlace válido durante 72 horas para que defina su propia contraseña. El administrador no conoce ni transmite la contraseña en ningún momento. No es posible registrar dos usuarios con el mismo correo.

**Edición de un usuario**

La opción **Editar** de cada fila permite modificar los datos y el rol. Cuando el rol de una persona cambia, su sesión abierta se cierra para que ingrese con los nuevos permisos. Desde la misma ventana, **Enviar enlace de acceso** remite a la persona un enlace para crear una nueva contraseña, útil cuando no recibió la invitación o la olvidó.

Si se intenta cerrar la ventana con datos escritos y sin guardar, el sistema solicita confirmación con las opciones **Seguir editando** y **Descartar cambios**.

**Activación e inactivación**

La opción **Inactivar** impide que la persona ingrese y cierra sus sesiones abiertas; antes de aplicarla, el sistema solicita confirmación. La opción **Activar** restablece el acceso. Ningún administrador puede inactivar su propia cuenta ni cambiar su propio rol, y siempre debe existir al menos un administrador activo.

**Estados**

| Estado | Significado |
|---|---|
| Activo | La persona puede ingresar |
| Inactivo | El acceso está suspendido por un administrador |
| Bloqueado | La cuenta superó el número de intentos fallidos y está bloqueada durante 15 minutos |


Gestión de roles y permisos
---------------------------

La sección **Roles y permisos** muestra cada rol con su número de permisos, el número de usuarios que lo tienen y la fecha de su última actualización. Al seleccionar un rol se abre su detalle.

**Creación de un rol**

Se selecciona **Nuevo rol** y se indican el nombre, un código interno en mayúsculas, que no puede modificarse después, y una descripción opcional. Los permisos se agrupan por módulo; la casilla de cada módulo marca o desmarca todos sus permisos a la vez. El rol se guarda con **Crear rol**.

**Edición de un rol**

En el detalle de un rol pueden modificarse el nombre, la descripción y los permisos. Los cambios aplican de inmediato a todos los usuarios que tienen el rol. Si se intenta salir de la pantalla con cambios sin guardar, el navegador solicita confirmación.

**Restricciones**

Los roles base (Administrador, Evaluador y Consultor externo) no pueden inactivarse. El rol Administrador conserva siempre todos los permisos, para que nunca falte quien gestione la seguridad. Un rol solo puede inactivarse cuando ningún usuario activo lo tiene asignado.


Cuenta
------

La sección **Cuenta** muestra el nombre, el correo y el rol de la persona. Para corregir esos datos debe solicitarse el cambio a un administrador.

Desde esta sección se cambia la contraseña: se escribe la contraseña actual, la nueva y su confirmación, y se selecciona **Cambiar contraseña**. Al hacerlo, se cierran las sesiones abiertas en otros dispositivos.


Uso en teléfono móvil y accesibilidad
-------------------------------------

En pantallas pequeñas, el menú se abre con el botón ubicado en la esquina superior izquierda y se cierra al elegir una sección, al tocar fuera de él o con la tecla `Escape`. La lista de usuarios se presenta como bloques con las acciones al pie de cada uno.

La aplicación adopta automáticamente el modo claro u oscuro configurado en el dispositivo y responde a la preferencia de contraste aumentado. Todas las funciones pueden usarse con el teclado y con lectores de pantalla, y la interfaz se reorganiza cuando se aumenta el tamaño de letra del navegador.
