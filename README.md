# RTS-MODS-STUDIO

Aplicación web en español para organizar y preparar proyectos de mods de **Rusted Warfare**. Está construida con Vite + JavaScript y se puede publicar gratis mediante GitHub Pages.

## Funciones incluidas

- Panel de proyecto con resumen de unidades, edificios y facciones.
- Editor CRUD para unidades, edificios y facciones.
- Configuración económica editable por facción.
- Validador local de IDs duplicados, campos obligatorios y referencias a facciones.
- Guardado automático en `localStorage` del navegador.
- Importación y exportación del proyecto en JSON.
- Empaquetado de una estructura ZIP con extensión `.rwmod`.
- Interfaz adaptable a escritorio, tablet y móvil.

## Datos y privacidad

Los proyectos se guardan en el almacenamiento local del navegador. No se envían a un servidor. Usa **Exportar JSON** para crear copias de seguridad y transferir proyectos entre dispositivos.

## Alcance y compatibilidad

Rusted Mod Studio es un editor y organizador independiente. No incluye el motor del juego ni sustituye las pruebas dentro de Rusted Warfare. El empaquetador crea un archivo ZIP con extensión `.rwmod` y una estructura inicial; la aceptación final depende de que los archivos de configuración y recursos cumplan las reglas de la versión del juego que utilices.

Los archivos INI generados son plantillas iniciales. Comprueba y ajusta las propiedades específicas de cada unidad/edificio con la documentación y los ejemplos compatibles con tu versión del juego antes de distribuir el mod.
