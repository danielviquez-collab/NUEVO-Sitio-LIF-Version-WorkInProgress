# Pruebas LIF: Juegos y Contactos

Conexion actualizada el 7 de octubre de 2026, en la version 9 de la implementacion
existente, para aceptar el Top 20 unificado de Memoria LIF y Snake LIF, conservar
el historial y mantener la ubicacion opcional de Contactos solicitada por Daniel.
Se mantiene la misma URL, clave y permisos. Este ajuste del sitio sigue en la
vista local; no se publico una nueva version del sitio en Netlify ni Sites.

Hoja privada: https://docs.google.com/spreadsheets/d/1qVLcNX46tRT_qDnc2oTgzsX1d0n8SIkFvOS3Lv7nCog/edit

## Registros

- `Confesiones` conserva sus encabezados, validaciones y recepcion originales.
- `Juegos` guarda una fila por partida completada y validada, con participante,
  contacto, nickname, juego, SCORE, fechas y autorizacion. Los intentos anonimos
  se incorporan al registrar la participacion; una nueva partida es otro ID.
- `Contactos` guarda los datos del formulario y su autorizacion. Un reenvio del
  mismo ID actualiza su fila, no crea otra. Provincia, Canton y Distrito se agregan
  despues de las ocho columnas originales; el historial anterior se conserva.
- `EstadoJuegos` es una pestana tecnica oculta en la misma hoja privada. Guarda
  dispositivos, participantes, partidas, solicitudes y reconocimientos de envio
  para recuperar el servicio despues de un reinicio de Netlify. Incluye el estado
  de validacion y los datos privados necesarios para reintentar un registro.

La validacion de partidas y el limite de intentos continúan en el servidor, tanto local como Netlify.
Las filas locales se conservan ante una falla de Google y se reintentan cada
30 segundos. Solo se confirma el envio al formulario despues del reconocimiento
de Google. Las filas de Juegos y Contactos no incluyen entradas de teclado,
cookies ni tokens. EstadoJuegos conserva el estado privado del servidor; solo
acepta consultas firmadas y no forma parte de la respuesta publica del ranking.

El ranking consulta `Juegos` con la version `lif-games-20261007-unified-v2`,
conserva el mejor SCORE de cada participante ENTRE Memoria LIF y Snake LIF
y muestra un solo Top 20, con desempate por fecha de logro. Las partidas con
reglas anteriores siguen almacenadas pero no entran en esta competencia.
Las partidas de Atrapá no se convierten en Memoria ni cuentan en sus intentos.
Solo devuelve posicion,
nickname, juego y SCORE; no expone los contactos. Su cache dura 30 segundos y
se invalida despues de un registro nuevo o actualizado.

Por solicitud de Daniel, la landing LOCAL muestra veinte ejemplos de
ambos juegos mientras el ranking unificado real este vacio, sin un rotulo de prueba
en la interfaz para el cliente. No identifica ningun ejemplo como el usuario ni combina esos puntajes con
partidas reales. Se omiten al compilar produccion. Los ejemplos nunca se
escriben en Google Sheet. La experiencia post-partida muestra el ranking real.
Las rutas de propuestas conservan su modo explicito de demostracion.

El receptor firmado mantiene `catch` y `all` para compatibilidad con la version
antigua del sitio todavia publicada. Su consulta `all` no incluye Memoria.
La API actual usa `game=all` para solicitar al receptor `game=unified` con la
version actual y un maximo de veinte. El receptor quedo en version 9 el 7 de
octubre de 2026, en la misma URL y con los mismos permisos. Reconoce la version
guardada con o sin el prefijo de texto literal de Sheets. Consultas firmadas
de solo lectura confirmaron cero participantes con reglas nuevas y cuatro
participantes en el ranking antiguo, sin escribir ni borrar registros.

## Configuracion Privada

- Archivo local ignorado por Git: `.env.local`, permisos 600.
- `LIF_SHEETS_ENDPOINT`: misma URL `/exec` utilizada por Confesiones.
- `LIF_SHEETS_SYNC_KEY`: clave privada autorizada por Daniel, guardada solo en
  el servidor y en las propiedades del proyecto Apps Script. Nunca agregar
  prefijos `NEXT_PUBLIC_` o `VITE_` ni copiarla en codigo publicado.
- `Records.gs`: recepcion firmada, deduplicacion y consulta del ranking.
- `State.gs`: estado dividido en celdas, integridad SHA-256 y revision atomica
  bajo el bloqueo de Apps Script. Nunca reinicia silenciosamente datos corruptos.
- `prepararJuegosYContactos`: agrega/formatea las dos pestanas sin tocar
  Confesiones ni sobreescribir encabezados diferentes.
- `prepararUbicacionContactos`: prepara solo las tres columnas nuevas de Contactos,
  sin cambiar los registros previos ni las otras pestanas.

## Ubicacion Opcional

El formulario permite enviar sin residencia o con una seleccion parcial coherente.
No hay valores por defecto ni consulta automatica de GPS, IP o cookies.
Provincia habilita sus cantones; canton habilita sus distritos. Al cambiar un
nivel se limpian sus dependientes. Canton y distrito permiten buscar por nombre.
En movil los tres controles se apilan; en escritorio comparten una fila.

El catalogo local procede del Aplicativo DTA del Instituto Geografico Nacional /
SNIT, consultado el 7 de octubre de 2026: 7 provincias, 84 cantones y 494 distritos.
`scripts/update-costa-rica-locations.mjs` permite actualizarlo y verifica la
jerarquia oficial antes de guardar. El sitio valida los codigos y envia a Google
los nombres, sin consultas externas mientras el visitante elige su residencia.

Las filas antiguas se migran con ubicacion vacia. Los reconocimientos de sus
envios no cambian, por lo que no se reenvia masivamente el historial. Para un
contacto con ubicacion, la confirmacion requiere que Google reconozca tambien
el guardado de los campos nuevos; un receptor antiguo no puede dar falso exito.

La version 5 y los encabezados se verificaron en Google sin agregar contactos de
prueba nuevos. Las pruebas automatizadas usan almacenamiento y recepcion
aislados; las pruebas de interfaz simulan los envios, errores y reintentos.

La version 6 se verifico con consultas firmadas de solo lectura: Memoria vacia,
Snake con cuatro participantes y compatibilidad del cliente antiguo. No se
agregaron puntajes ficticios ni filas de prueba a Google. La auditoria local
conserva diez partidas historicas de Atrapá y registra su huella de integridad.

Al actualizar el receptor, editar la implementacion existente y crear una nueva
version sin cambiar ejecutar-como, acceso, URL, permisos de Drive ni de la hoja.
La vista local conserva SQLite y sus reintentos cada 30 segundos. El paquete de
Netlify incorpora `lif-api` y `lif-sync`: reconstruye la validacion en memoria,
confirma el estado en Google antes de responder y reintenta las filas pendientes
cada cinco minutos. Las claves se configuran solo en Functions de Netlify, fuera
del directorio publico. DigitalOcean sigue pendiente, segun lo acordado.

El paquete de Netlify no es intercambiable con el export estatico de Sites.

## Verificacion Real

- Partida sintetica validada: `48d87ab1-b0c7-4aa7-b9d6-aedaf766145e`,
  nickname `PRUEBA` con emoji de prueba, SCORE 0. Su inicio esta fuera del periodo
  de la campana para no alterar el ranking.
- Contacto sintetico: `ad154670-5665-4947-a46d-f12d23fa8014`, nombre
  `PRUEBA TECNICA - NO CONTACTAR`, correo reservado `prueba-lif@example.test`.
- Ambas recepciones confirmadas por Google; segundo envio del contacto devuelve
  el mismo ID. Las pruebas permanecen identificadas en las pestanas privadas.
- Pruebas automatizadas cubren tres partidas con SCORE creciente, cambio de
  nickname, empates, privacidad, firmas, interrupciones y reintentos.
- El 4 de octubre se copio una sola vez el historial local a EstadoJuegos con
  autorizacion explicita. La funcion compilada se verifico con invocaciones
  independientes: bootstrap, inicio, reenvio del mismo inicio, abandono,
  recuperacion de identidad/intentos y ranking. Todas respondieron 200.
- La nueva partida tecnica es anonima, abandonada y no entra al ranking. No se
  agregaron formularios ni se modificaron filas publicas durante esa verificacion.

## Ajustes Del Menu

Carga, cortina y contenido comparten el mismo dialogo, con entradas y salidas
suaves. El menu centra la duracion de cada juego encima de JUGAR, elimina los
contadores visibles de sus tarjetas y agranda los botones JUGAR con brillo.
La seleccion al azar tiene cuatro secciones alternadas, dos por juego. Ambos
juegos tienen la misma probabilidad mientras tengan intentos disponibles.
El giro abre las instrucciones del juego elegido; no consume un intento hasta
que el usuario confirma INICIAR JUEGO. Cerrar o regresar cancela el giro pendiente.

El boton de seleccion al azar muestra una mini ruleta animada. El dialogo se
ajusta al alto disponible; las instrucciones pueden desplazarse sin perder el
boton de inicio, y el lienzo de juego conserva sus proporciones dentro del espacio.
Una flecha animada permite bajar cuando queda contenido y se oculta al llegar
al final. La alternativa "o" se muestra desde la apertura de la cortina.
