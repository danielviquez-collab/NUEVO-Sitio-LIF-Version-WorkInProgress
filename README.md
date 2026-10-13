# NUEVO Sitio LIF - WorkInProgress

**Desarrollo: Daniel Víquez Azofeifa para LAICA 2026.**

## Esta version

Fuente y distribucion del 13 de octubre de 2026. Referencia publicada: https://lifnewsitev1.netlify.app

- Renzo, comunidad, ver todas e historias mantienen el aviso de construccion. Hero y formulario siguen activos. Los videos ocultos no se distribuyen.
- Trece reversos render, ficha nutricional negra, frentes/PDF/valores y tiempos aprobados conservados.
- Memoria, Snake, ranking comun Top 20, tres intentos diarios y registros independientes.
- Sin paginas experimentales, intentos ilimitados ni datos personales de participantes.
- No incluye contrasenas, llaveros, cookies, base de datos, tokens ni dependencias instaladas.

## Estructura y documentacion

- `app/`, `components/`, `hooks/`, `lib/`: codigo fuente de la experiencia.
- `public/`: productos, audio, video, fuentes y PDF.
- `netlify/functions/`, `integrations/`: backend y reportes; secretos configurados por entorno.
- `deploy/public/` y `deploy/functions/`: distribucion compilada conservada de la entrega aprobada.
- `docs/ARQUITECTURA.md`: guia detallada de paginas, componentes, datos, reglas, animacion y mantenimiento.
- `docs/PUBLICACION.md`: despliegues y verificaciones confirmados.

## Desarrollo

Node.js >=22.13. Instalar dependencias con `npm ci`; iniciar con `npm run dev`.
La configuracion publica de compilacion esta en `.env.example`. Los valores privados se definen en el entorno local o de alojamiento; nunca se suben al repositorio.
Sin credenciales propias del servidor, los juegos/contacto no pueden guardar datos.
El formulario de Confesiones conserva su endpoint publico de Apps Script; no realizar envios de QA a ese servicio.

## Instalacion en Netlify

`netlify.toml` en la raiz instala la distribucion compilada de `deploy/`, sin recompilar.
Configurar los valores privados existentes en Production/Functions. Git no contiene una copia de Supabase ni sustituye sus backups.
Para una instalacion manual, usar Netlify CLI desde `deploy/`: `netlify deploy --dir=public --functions=functions --no-build`. Solo agregar `--prod` con autorizacion para publicar.
No arrastrar solamente public/: eso omite las funciones de API, ranking inicial y sincronizacion de Sheets.

## Actualizaciones

Cada cambio debe actualizar este README y `docs/ARQUITECTURA.md`, pasar las verificaciones y regenerar la distribucion antes de publicarse.
El codigo no modifica los registros existentes ni ejecuta migraciones por compilar.
`npm run build` produce `dist/client/` y `dist/netlify-functions/` con esta variante
en construccion, tomando la configuracion publica de `.env.example`.
La compilacion de este repositorio es portable y no requiere una sesion de Sites.
La guia tecnica identifica diferencias entre local, Netlify y Sites. Esta copia reproduce solo la variante indicada arriba.
La distribucion `deploy/` es una captura aprobada, no se actualiza por editar archivos fuente.
No publicar pruebas ni modificar fuentes, colores, recursos o tiempos sin aprobacion.

## Limites verificados

Los enlaces publicados pasaron paginas, ranking inicial, recursos, cinco pantallas y 35 escenarios de sobres por plataforma sin envios reales.
Esta copia fuente pasa compilacion, TypeScript, 20 pruebas focalizadas,
112 referencias sin faltantes y cinco pantallas con API simulada.
Los archivos compilados en `deploy/` permanecen identicos a la entrega publicada.
Safari/iPhone fisico y pruebas de carga permanecen pendientes. Sheets es un reporte asincrono, no un backup completo.
Repositorio publico: https://github.com/danielviquez-collab/NUEVO-Sitio-LIF-Version-WorkInProgress
Conserva el ID del anterior New-Site-LIF. Propietario: danielviquez-collab.
Guardar fuente en GitHub no vuelve a publicar Netlify ni cambia Supabase.
