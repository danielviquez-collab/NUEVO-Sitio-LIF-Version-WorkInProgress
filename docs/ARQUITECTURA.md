# LIF.CR

**Desarrollo: Daniel Víquez Azofeifa para LAICA 2026.**

Documento tecnico vigente, actualizado el 13 de octubre de 2026 (Costa Rica).
Toda actualizacion del sitio debe actualizar esta guia en la misma entrega.
Las notas historicas complementarias no sustituyen las reglas actuales de aqui.

## 1. Alcance y publicaciones

Sitio de marca con sabores, informacion nutricional, recetas, confesiones,
contacto y dos juegos con ranking comun. Version para revision del cliente;
no equivale a un lanzamiento de alto trafico ni incluye un CMS administrativo.

| Entorno | Confesiones | Pruebas | Datos |
| --- | --- | --- | --- |
| Local, puerto 3000 | Completo | Ejemplos y ayudas de desarrollo | Supabase, secreto del llavero |
| Netlify, lifnewsitev1 | Renzo, comunidad e historias en construccion; hero y formulario activos | Sin experimentos; tres intentos diarios por juego | Supabase desde funciones privadas |
| Sites, lifnewsitev1 | Completo | Sin experimentos; tres intentos diarios por juego | API del mismo dominio, proxy HTTPS hacia Netlify |

Netlify: https://lifnewsitev1.netlify.app

Sites: https://lifnewsitev1.danielviquez19.chatgpt.site

**Estado vigente, 13 de octubre de 2026:** Netlify publicado y verificado,
deploy `6ace9cc96a9f396ff666663c`, con Renzo/comunidad/historias en construccion
igual que antes. Sites publicado y verificado en la cuenta propietaria,
version 19, con Confesiones completo y sin areas en construccion. Su worker usa
la API de Netlify para consultar la misma base Supabase. Resultado, archivos,
commit de fuente y limites en `PUBLICACION.md`. Los ZIP entregados son capturas
inmutables del momento de su preparacion; no se sobrescribieron al publicar.
No actualizar un proyecto de otra cuenta ni crear un sitio sustituto. Un preview
publicado no cambia automaticamente el enlace principal de Netlify.

Las 20 referencias del ranking se conservan para el journey del cliente; no son
partidas en la base. Son distintas de las pantallas de prueba excluidas del deploy.

**Productos, revision del 12/13 de octubre:** `/sabores` utiliza los 13 reversos
originales suministrados, todos renders. Publicado en ambas plataformas el
13 de octubre. Frentes, PDF, datos y tiempos de transicion conservados.

**Paquete solicitado el 13 de octubre:** `LIF-LAICA-NUEVOSITIOWEB-V2.zip` para
Netlify habilita todas las secciones publicas, incluido Renzo y todas las historias.
Se preparo con `LIF_BLOCK_CONFESSIONS_CONTENT=false` y conserva la conexion
existente a Supabase/Sheets mediante sus tres funciones. Ese ZIP completo no
se instalo en Netlify: se publico una variante separada con el bloqueo acordado.
La ficha nutricional local utiliza franjas negras y tipografia de etiqueta;
los valores, PDF y tiempos de transicion permanecen intactos. Los tres nuevos
renders fueron recibidos otra vez e incorporados: los 13 reversos son renders,
sin fotografias provisionales. El acta del paquete registra este estado real.

**Publicacion autorizada el 13 de octubre:** Daniel confirma la cuenta
`danielviquez19@gmail.com` y el proyecto existente `lifnewsitev1`. Netlify debe
mantener el bloqueo de Confesiones tal cual estaba desplegado. Se preparo y publico
`LIF-LAICA-NETLIFY-V2-20261013` con `--blocked-confessions`, sin modificar el
ZIP V2 completo entregado ni el sitio local. Daniel tambien autoriza actualizar
Sites completo, sin ocultar Renzo ni historias. Ambas publicaciones confirmadas:
Netlify `6ace9cc96a9f396ff666663c`; Sites version 19,
deploy `appgdep_6ace9e7ebb288191b0cfa6b1bff888c4`. Nueve paginas por plataforma,
ranking inicial actualizado, 13 renders/PDF/estilos y cinco tamaños de pantalla
verificados sin envios reales. Safari/iPhone fisico y pruebas de carga pendientes.
Cada plataforma pasa ademas 35 escenarios de giro/reverso/ficha negra, sin
alterar los tiempos de transicion. Evidencia en `work/release-qa-2026-10-13/`.

**Repositorios GitHub solicitados el 13 de octubre:** preparar dos copias limpias
para `danielviquez-collab`: actualizar/renombrar `New-Site-LIF` con la variante
Netlify en construccion y crear `NUEVO-Sitio-LIF-Version-Completa` con todas
las secciones publicas. Incluir fuente, guia tecnica y distribucion compilada,
no secretos ni datos personales. Cuenta propietaria confirmada por autorizacion
directa: `danielviquez-collab`, correo `daniel.viquez@garnierbbdo.com`.
Repositorio original renombrado a `NUEVO-Sitio-LIF-Version-WorkInProgress`, conserva
ID `1393879941` y visibilidad publica. Repositorio completo creado privado,
ID `1418074031`. Ambas subidas verificadas en `main`: WorkInProgress,
commit de entrega `90ebdf204a55d2375d5148a5b1d78b96699d5661`, 640 archivos;
Completa, `a5186e87c73248d3ea9187cfecde06df63f69bc1`, 672 archivos.
Se comprobaron todos los objetos remotos contra la copia local, los 13 renders
y las politicas distintas de Confesiones; el cierre documental se agrega despues
de esos commits de entrega. El repositorio original conserva tambien su commit
inicial. Ver `GITHUB-REPOSITORIOS.md`. No hay cambios de alojamiento por esta
solicitud; conservar los deploys indicados arriba.

## 2. Tecnologias y archivos

React 19, TypeScript, Vinext y Vite producen componentes y rutas HTML/RSC.
CSS propio y Tailwind/PostCSS sostienen la identidad. Lucide aporta iconos;
Poppins y Champ son fuentes locales, con espaciado de letras cero. Embla mueve
el carrusel; Three.js/CSS3DRenderer implementa la interaccion nutricional.
PostgreSQL/Supabase almacena juegos y contactos. Netlify Functions usa Node.js;
Sites usa un Worker. Apps Script/Sheets/Drive reciben confesiones y reportes.

| Ubicacion | Responsabilidad |
| --- | --- |
| `app/` | Rutas, metadatos y CSS de experiencias |
| `components/` | Menu/footer, catalogo, recetas, medios y formularios |
| `components/gaming/` | Cortina, logo, selector, tableros, controles, ranking y podio |
| `lib/` | Contenido, ubicaciones, validaciones y cronologias |
| `lib/gaming/` | Motores deterministas, almacenamiento, API y validacion de SCORE |
| `lib/gaming/versions/` | Motores historicos congelados, no eliminarlos |
| `public/` | Logos, productos, fuentes, PDF, audio y video |
| `netlify/functions/` | Entradas privadas de las tres funciones finales |
| `worker/` | Adaptador de Sites, API limitada y ranking inicial |
| `integrations/` | Apps Script y distribucion Netlify |
| `scripts/` | Compilacion, verificacion y armado de entregas |
| `app/pruebas/` | Experimentos solo locales |

## 3. Paginas y edicion de contenido

| Ruta | Contenido / fuente |
| --- | --- |
| `/` | Entrada original y carrusel; `home-entrance.tsx`, `home-content.tsx` |
| `/sabores` | 13 productos; `flavor-catalog.tsx`, `lib/lif-content.ts` |
| `/recetario` | Cuatro recetas y PDF; `recipes-browser.tsx` |
| `/confesiones` | Hero, formulario, Renzo y comunidad; `confessions-content.tsx` |
| `/confesiones/todas` | Comunidad o construccion segun entorno |
| `/confesiones/[slug]` | Cuatro historias de `lib/confession-stories.ts` |
| `/gracias-confesion` | Confirmacion del formulario |
| `/juega` | Memoria, Snake, ranking y podio; `components/games.tsx` |
| 404 | Ruta inexistente, sin redireccion engañosa a Home |

Menu, redes y footer: `components/site-chrome.tsx`. Contactenos abre un dialogo,
con cierre, foco y teclado accesibles. El menu movil aprobado usa filas de ancho
completo, separadores y flechas; conserva fuente y Snake. El logo que viaja del
footer al menu pertenece solo a un ejemplo local, no al menu publicado.

Los 13 PDF nutricionales estan en `public/nutrition/`, incluidos los tres nuevos
sabores: te verde maracuya, te blanco fresa y te frio manzana. En local, los
reversos originales estan en `public/products/backs/`: 13 renders, incluidos
te verde maracuya, te blanco fresa y te frio manzana, reemplazados el 13 de octubre.
El modelo `Flavor.back` identifica `kind: official`, `medium: render`, imagen y zona
nutricional. Para futuras sustituciones, reemplazar su WebP y comprobar el
encuadre; no cambiar frente, valores, PDF ni cronologia.
Las copias web mantienen el arte suministrado, usan transparencia exterior y
1500 px de alto; los originales y el ZIP de 13 reversos no se modifican.
La preparacion reproducible esta en `scripts/prepare-sachet-backs.py` (Pillow y
NumPy); recibe inventario con rutas/SHA-256 y deja trazabilidad en `work/`.
`--only slug...` permite reemplazar solo los artes nuevos sin volver a procesar
los otros diez. El fondo exterior blanco/gris se retira por conectividad, sin
eliminar blanco o gris interno de tablas o sellos. Se mantiene el lienzo, escala
uniforme, transparencia y centrado empleados por el catalogo.
No se certifica la vigencia legal de empaques 2022/2023 o fotos por incorporarlos.
Las cuatro recetas tienen PDF
en `public/recipes/pdf/`. Cambiar productos, hero, recetas o videos requiere
editar contenido/recursos y recompilar. Un futuro CMS necesita autenticacion,
permisos, almacenamiento de medios, validacion y aprobacion de publicacion.

## 4. Movimiento, audio y responsive

Se conserva la entrada original de Home y la interaccion nutricional con
enfoque, giro, lectura, expansion y cierre, con alternativa de movimiento reducido.
En la revision local, el reverso real se muestra sin superponer una ficha HTML
durante el giro o la pausa; la ficha aparece al comenzar la expansion. Se mantienen
360/320/580/240/620 ms y el cierre/restablecimiento originales. El reverso usa su
propia transparencia: la silueta del frente no recorta sellos o texto del dorso.
Las cinco propuestas de entrada y las versiones cinematograficas quedan locales.
Sus controles de comparacion se llaman **Actual**, **Animación I** y
**Animación II**; corresponden a las rutas `/pruebas/entrada`,
`/pruebas/entrada-completa` y `/pruebas/entrada-cinematica`. El cambio local
del 12 de octubre afecta solo nombres, no coreografias, audio, tiempos ni rutas.

Juegos: cortina original, logo ascendente y brillo sincronizado con audio;
previews legibles en movil/tablet, titulos/textos centrados, azar centrado en movil,
Snake verde y panel mas transparente. El Snake que come texto en el banner
tambien se adapta al movil. En movil aparece primero el podio y luego el Top 20;
en escritorio se mantiene la composicion aprobada.

Abrir Contactenos es silencioso. Los tres envios validados comparten
`public/audio/contact-send.wav`, recortado sin tecleo. No suena al navegar ni al
tocar campos. Memoria y Snake usan `wrong` para errores, no Windows 7. Giro,
bloqueo, comida y pareja usan los archivos aprobados de `public/games/audio/`.
El navegador puede requerir accion del usuario para permitir audio.

Intersticial: tres videos (Gato, Lego, Plantas), aleatorios, una impresion por
pestaña, tras 60-120 segundos de navegacion activa y un cambio real de pagina.
No interrumpe partidas ni dialogos. Omitir luego de ocho segundos reproducidos.
Ocultar la pestaña pausa el tiempo; existe alternativa silenciada por autoplay.
Los tiempos acelerados de QA no se publican.

## 5. Reglas actuales de juegos

`lib/gaming/config.ts`, version `lif-games-20261008-panels-v5`.
El servidor reconstruye la partida, no confia en el SCORE declarado por el cliente.
Ambos juegos: 180 segundos activos, tres intentos diarios por dispositivo y juego,
dia de Costa Rica, piso de puntaje cero y sin tope fijo de SCORE. Las cookies son
independientes entre dominios: no es un limite global por persona/dispositivo.

### Memoria LIF

- 16 cartas / ocho parejas, distribuidas por semilla determinista.
- Pareja normal +10, nuevo sabor +60, logo +30.
- Superbonus +250 cada seis parejas; este bonus no se duplica con x2.
- Primer fallo consecutivo gratis; segundo y siguientes -20, con piso cero.
- Fallo = descubrir dos cartas distintas. Una pareja reinicia **Racha de errores**.
- Diez fallos consecutivos terminan la partida independientemente del puntaje.
- Tambien termina por tiempo. Parejas resueltas permanecen visibles; completar
  ocho genera otro tablero. No se mezclan cartas pendientes a media jugada.
- Vista inicial 1.600 ms; vistazo un segundo; x2 diez segundos.

### Snake LIF

- Tablero 30 x 20, tres segmentos iniciales, avance base 190 ms.
- Borde o cuerpo terminan la partida; no atraviesa el borde.
- Normal +50, nuevo +300, logo +150; el logo no alarga el cuerpo.
- Competidor -100 y dos segmentos, minimo tres, salvo proteccion del escudo.
- Llegar a 15 segmentos: +1.000, regreso a tres y 6 % mas velocidad por bonus.
- Turbo siete segundos: velocidad x1,4, doble puntaje y reloj acelerado segun
  constante historica. x2 diez segundos; iman siete; fugaz cuatro; foco de nuevo
  sabor 1,75 segundos. Movil cambia presentacion/controles, no la logica.

La calibracion reduce la ventaja de las acciones mas frecuentes de Memoria,
pero no demuestra dificultad equivalente. Antes de otra calibracion medir SCORE
por minuto activo, distribucion de puntajes y derrotas en sesiones humanas.
No editar reglas historicas congeladas; una modificacion de motor exige version.

## 6. Registros y ranking

Un Top 20 entre ambos juegos, mejor SCORE por nickname normalizado. Periodo:
1 de octubre de 2026 a 31 de diciembre de 2027. Versiones admitidas: v4 calibrada
y v5 actual. El historial de otras versiones se conserva fuera de esta competencia.

Cada partida se registra una vez. `registrations` guarda copia independiente de
nombre, correo, telefono, nickname y consentimiento. Otra partida con nuevo
nickname puede ocupar otro puesto; no modifica partidas anteriores. Reintento
identico confirma sin duplicar; datos distintos para una partida ya registrada
se rechazan. Otro resultado con el mismo nickname conserva historial pero el
ranking toma solo su mejor SCORE.

Cada nickname nuevo sustituye una referencia de los 20 iniciales, aunque tenga
menos puntos. El conjunto se ordena por SCORE; el nuevo registro gana empates
frente a referencias. Con 20 nicknames registrados no quedan referencias.
Estas nunca se insertan como partidas ficticias en Supabase ni Sheets.

`/api/games/ranking` es publico y solo lectura: no crea dispositivos, partidas o
intentos, ni expone contacto. Netlify `lif-ranking-page` completa HTML/RSC antes
de enviarlos. Sites usa su worker y esa API. `Cache-Control: no-store` evita una
pagina vieja; la primera tabla y su hidratacion usan los mismos datos. Si falla
la consulta se muestra carga/error, no resultados viejos como actuales.
El cliente tambien actualiza despues de un registro y periodicamente.

## 7. Tres formularios de datos

| Formulario | Destino | Protecciones |
| --- | --- | --- |
| SCORE | API -> Supabase -> reporte Sheets | Partida validada, copia inmutable, consentimiento, idempotencia |
| Contactenos | `/api/contact` -> Supabase -> reporte Sheets | Validacion, campo trampa, consentimiento, UUID |
| Confesiones | Apps Script -> Sheets y Drive | Alias, consentimiento, limites y revision antes de publicar |

Contacto: nombre 2-100, correo hasta 150, telefono opcional hasta 25 y mensaje
10-3.000 caracteres. Provincia/canton/distrito opcionales se validan con catalogo
de Costa Rica. No se anuncia exito sin confirmacion real.
Confesiones: texto hasta 5.000, alias hasta 32; texto o video requerido.
MP4/MOV/WebM hasta 25 MB. Este formulario no migro a Supabase y no publica
automaticamente lo recibido. Cookies, sonidos, compartir y seleccionar no son
formularios de registro adicionales.

## 8. Supabase, Sheets y limites

Proyecto `lif-juegos-pruebas`, referencia `zjplavhetwyoqrfbjxlw`. Esquema privado
`lif_game` con RLS, sin permisos anonimos de Data API. Tablas: `devices`,
`participants`, `sessions`, `start_requests`, `contact_messages`, `sheet_sync`,
`registrations`, `migration`.

El navegador no recibe la contraseña PostgreSQL. Netlify usa pooler y TLS
verificado. Local obtiene el secreto del llavero. Sites reenvia solo endpoints
y metodos permitidos por HTTPS, con su cookie propia y sin cookies ajenas.
Transacciones, bloqueo breve y escritura de cambios protegen concurrencia.
El motor valida semilla, entradas y version. Los fallos transitorios tienen
reintentos acotados con el mismo ID; si no se confirma, se pausa para reconectar.
No se promete funcionamiento offline ni ausencia absoluta de fallos de red.

Sheets recibe reportes de partidas registradas y contactos cada cinco minutos.
Google fallido deja reporte pendiente, sin perder lo confirmado en Supabase.
**No es un backup completo recuperable**: no copia todas las sesiones, entradas,
tokens y estado interno. Definir backup PostgreSQL y probar restauracion antes
del lanzamiento comercial.

El adaptador actual reconstruye tablas en memoria con limite de seis millones
de caracteres. Es para bajo volumen. Antes de trafico alto: SQL por jugador sin
reconstruir todo el historial, mediciones de carga, concurrencia, cuotas y costos.

## 9. Configuracion segura

| Variable | Uso |
| --- | --- |
| `LIF_GAME_STORAGE=postgres` | Fuente de juegos/contactos |
| `LIF_DATABASE_HOST`, `LIF_DATABASE_USER` | Pooler de proyecto |
| `LIF_DATABASE_PASSWORD` | Secreto Production/Functions en Netlify; nunca publico |
| `LIF_SHEETS_ENDPOINT`, `LIF_SHEETS_SYNC_KEY` | Reportes firmados; clave privada |
| `NEXT_PUBLIC_CONFESSIONS_ENDPOINT` | Endpoint publico Apps Script del formulario |
| `LIF_BLOCK_CONFESSIONS_CONTENT` | `true` al publicar Netlify; `false` en local, Sites y ZIP V2 completo |
| `LIF_CLIENT_PREVIEW=true` | Referencias progresivas del ranking del cliente |
| `LIF_DATABASE_KEYCHAIN_SERVICE/ACCOUNT` | Local: ubicacion del secreto |

Local: llavero servicio `lif-local-supabase`, cuenta `lif-juegos-pruebas`.
Host `aws-1-ca-central-1.pooler.supabase.com`, usuario
`postgres.zjplavhetwyoqrfbjxlw`, puerto 6543, base `postgres`.
No cambiar a Sheets tras recibir partidas nuevas; no hay retorno automatico.
No migrar ni crear tablas durante una partida. La herramienta temporal
`lif-migrate` no forma parte de esta distribucion; no activar
`LIF_INCLUDE_MIGRATION=true` en compilaciones finales.

No subir `.env`, llaveros, tokens, cookies, SQLite, datos personales ni caches.
Los assets publicados son accesibles por URL: construccion no es autenticacion.
Netlify no distribuye videos de Renzo/comunidad ni renderiza historias bloqueadas.

## 10. Desarrollo y entrega

Node.js >=22.13 y npm. En copia limpia: `npm ci`, luego `npm run dev`.
Preview: http://localhost:3000. En esta Mac lo mantiene `cr.lif.local-dev`;
no iniciar otro proceso en el mismo puerto. Configurar secretos en el equipo
de destino: la copia no debe acceder automaticamente a datos reales.

```sh
node --experimental-strip-types --test lib/*.test.mjs lib/gaming/*.test.mjs
node --test scripts/release-policy.test.mjs scripts/clean-media-metadata.test.mjs
npx tsc --noEmit
npm run lint
node scripts/prepare-release.mjs LIF-LAICA-AAAA-MM-DD
```

El preparador usa copias limpias, no altera local ni publica automaticamente.
Compila las variantes, elimina rutas/medios experimentales y verifica recursos.
Requiere `NEXT_PUBLIC_CONFESSIONS_ENDPOINT` configurado para el formulario.
Usar un nombre nuevo de entrega; no sobrescribir una distribucion finalizada.
La configuracion tecnica de hosting se genera solo en las copias de compilacion;
se excluye del ZIP para no entregar identidad de otra cuenta. No ejecutar
`npm run build` en la fuente limpia sin restaurar primero esa configuracion.
Netlify contiene exactamente `lif-api`, `lif-sync`, `lif-ranking-page`,
redirecciones y sincronizacion cada cinco minutos. Sites contiene cliente y
worker con plantillas de juegos embebidas para no omitir el ranking inicial.

El ZIP contiene fuente, guia, distribucion Netlify y Sites preparado, con
manifiesto SHA-256. Sin dependencias instaladas, Git, temporales ni secretos.
Los nombres tecnicos y licencias de dependencias no son creditos de autoria.
Usar Netlify con Functions; arrastrar solo HTML no instala la API. Proyecto
existente `43a5917c-13c0-45ae-95c8-6982a35d97be`: no crear otro por error.
Sites requiere su cuenta propietaria y flujo de version/publicacion; una carpeta
preparada no confirma publicacion.

Despues de publicar, verificar sin enviar registros reales y completar el acta:

```sh
node scripts/verify-publication.mjs https://lifnewsitev1.netlify.app
node scripts/verify-publication.mjs https://lifnewsitev1.danielviquez19.chatgpt.site --sites
node scripts/finalize-release.mjs LIF-LAICA-AAAA-MM-DD
```

El finalizador requiere `PUBLICACION.md`, revisa archivos privados y funciones,
genera manifiestos SHA-256 y comprueba la integridad del ZIP. La limpieza de
metadatos de medios elimina procedencia de generacion, nunca licencias de
terceros, y conserva exactamente los datos de pixeles de las dos imagenes PNG
del podio. Consultar `scripts/clean-media-metadata.mjs` y sus pruebas.

Para una actualizacion nativa de Sites, abrir su repositorio existente antes
de sincronizar la fuente aprobada. Conservar `.openai/hosting.json` del sitio
correcto; no usar el manifiesto de otra cuenta en la carpeta principal.
El checkout de publicacion usa `build: node scripts/build-sites.mjs`, sin repetir
`postbuild`, y recibe solo el endpoint publico de Confesiones y las banderas de
compilacion. No necesita contrasena Supabase: la API privada esta en Netlify.
Validar con `scripts/verify-sites-build.mjs`, TypeScript y recursos; sincronizar
el commit y archivar esa misma compilacion antes de guardar/publicar una version.
La ultima publicacion y su commit quedan registrados en `PUBLICACION.md`.
La proteccion de Sites puede agregar `__cf_bm`; no es identidad de juego ni una
escritura de participantes. La verificacion permite solo esa cookie de plataforma
y sigue exigiendo que el ranking publico no cree identidad de juego.

## 11. Verificacion y mantenimiento

### Paquete de instalacion Netlify V2

`node --experimental-strip-types scripts/prepare-netlify-package.mjs LIF-LAICA-NUEVOSITIOWEB-V2`
compila una copia aislada de la fuente local y genera el ZIP en `outputs/`.
No usa la variante historica bloqueada de `prepare-release.mjs` ni publica.
Incluye `public/`, `functions/`, `netlify.toml`, instalador Mac, verificador,
manifiesto SHA-256, esta guia y `ESTADO-PAQUETE.md`. Las paginas de pruebas,
medios experimentales y secretos se excluyen, no las secciones del sitio.
El ZIP de instalacion no incluye repositorio fuente ni un Worker de Sites.
Conservar variables privadas en Production/Functions; no poner claves dentro
del paquete. Arrastrar solo public/ a Netlify no instala la API ni la sincronizacion.
`Actualizar Netlify.command` solicita expresamente VISTA o PUBLICAR; el armado
del ZIP por si solo nunca ejecuta ese instalador ni modifica la publicacion.

La variante de publicacion Netlify utiliza `--blocked-confessions`: genera una
entrega separada, mantiene los avisos y excluye los videos de Renzo/comunidad.
No modificar el ZIP completo para aplicar esta politica de publicacion.
Al sincronizar la fuente a Sites, conservar su compilacion especifica:
`build=node scripts/build-sites.mjs`, sin `postbuild` de exportacion estatica.
Ese adaptador mantiene las plantillas privadas del ranking y el proxy API.

1. Recursos, PDF, links, videos y pantallas movil/tablet/escritorio.
2. Menu, cierre/foco, contacto, fuente y Snake, sin espacio lateral ni desbordes.
3. Juegos: previews, azar, cortina, sonidos, tableros y controles.
4. Motores con pruebas aisladas, sin insertar partidas de QA en la base compartida.
5. Ranking publico y HTML/RSC con los mismos datos iniciales.
6. Validacion de formularios con respuestas simuladas; envio real requiere autorizacion.
7. Netlify publicado: Renzo, comunidad, ver todas y slugs en construccion; hero/formulario activos. ZIP V2 completo: todas las secciones visibles.
8. Sites/local: completo. Rutas de prueba 404 en distribuciones.
9. ZIP, manifiesto, ausencia de secretos y exactamente tres funciones finales.
10. Actualizar esta guia y `PUBLICACION.md` con fecha, cambios, pruebas, limites y deploy real.

La publicacion del 11 de octubre paso 339 pruebas y TypeScript. Sus verificaciones visuales cubren
cinco tamaños Netlify y dos Sites, con datos simulados. La revision de codigo
limitada a los archivos de entrega pasa; la revision global aun reporta avisos
y errores preexistentes fuera de este alcance. Detalle en `PUBLICACION.md`.
La automatizacion no sustituye Safari/iPhone fisico ni pruebas de carga. Antes
de lanzamiento: privacidad/bases de participacion, derechos de medios/audio,
consentimiento, backups y monitoreo.

## 12. Cambios de esta entrega

13 de octubre: tres fotos provisionales reemplazadas por renders oficiales,
para un total de 13 renders. Ficha nutricional negra/blanca con jerarquia de etiqueta,
franja negra, separadores y filas secundarias; sin cambio de valores o
cronologia. El ZIP V2 completo no bloquea Confesiones. Para la publicacion del
13 de octubre, Netlify conserva el bloqueo anterior por indicacion expresa de
Daniel; Sites se actualiza con contenido completo. Se preparan distribuciones
separadas, sin sobrescribir el ZIP entregado. Netlify y Sites publicados el
13 de octubre; el ZIP completo sigue siendo la captura entregada, distinta de
la distribucion bloqueada instalada en Netlify. Actas y limites en `PUBLICACION.md`.
Validacion de V2: 343 pruebas, TypeScript y revision acotada aprobados; 132
referencias sin faltantes; 35 escenarios de giro/renders, 30 de cierre y cinco
pantallas del paquete, con API simulada y cero envios reales. Los tres PDF de
nuevos sabores se descargan con bytes identicos en el paquete movil. Integridad
del ZIP y exclusion de secretos comprobadas; Safari/iPhone fisico pendiente.

Historial local del 12 de octubre: 13 reversos reales en Productos (10 renders,
3 fotos temporales), sin cambiar los frentes ni informacion nutricional.
Este ajuste pasa 13 pruebas focalizadas, TypeScript, revision de codigo de los
archivos afectados, 35 escenarios de reversos y 30 de cierre/expansion. Cinco
tamaños de Chrome; Safari/iPhone fisico pendiente, WebKit no instalado. Cero
envios reales. Verificacion de esa etapa en `NUTRITION-INTERACTION.md`. Su estado
pendiente y sus fotos fueron reemplazados por la entrega de 13 renders publicada
el 13 de octubre. El ZIP de aquella entrega tampoco se sobrescribio.

Menu movil opcion 1; podio antes del Top 20; previews legibles; azar centrado;
Snake responsive del banner, verde y panel mas transparente; sonidos aprobados;
sonido unico de envio en tres formularios; reglas restauradas/calibradas,
Memoria con penalizacion y racha; registro independiente y ranking inicial
actualizado; Supabase conservado; creditos Daniel Víquez Azofeifa para LAICA
2026; documentacion vigente, metadatos de autoria y medios limpios, scripts de
entrega y paquete verificable. Propuestas de logo/menu y ayudas de desarrollo
permanecen locales, excluidas de publicaciones.
