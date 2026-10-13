# Repositorios LIF - 13 de octubre de 2026

**Desarrollo: Daniel Víquez Azofeifa para LAICA 2026.**

## Destinos

Propietario confirmado: `danielviquez-collab`, cuenta de
`daniel.viquez@garnierbbdo.com`. No se cambiaron otros repositorios ni cuentas.

- WorkInProgress (Netlify): https://github.com/danielviquez-collab/NUEVO-Sitio-LIF-Version-WorkInProgress
  Es el anterior `New-Site-LIF`, ID `1393879941`, conservado publico.
  Renzo, comunidad e historias mantienen el mismo aviso de construccion.
  Hero y formulario siguen activos; los videos ocultos no se distribuyen.
- Completo: https://github.com/danielviquez-collab/NUEVO-Sitio-LIF-Version-Completa
  Nuevo repositorio privado, ID `1418074031`. Titulo de README:
  **NUEVO Sitio LIF Versión Completa**. Todas las secciones publicas visibles.

Estado de este documento: repositorios creados/renombrados y copias verificadas;
subida en curso. Los commits remotos se registran solo despues de comprobarlos.

## Contenido

Cada copia incluye fuente, recursos, integraciones, una guia detallada en
`docs/ARQUITECTURA.md`, acta de las publicaciones y una distribucion compilada
en `deploy/public/` y `deploy/functions/`. `PUBLICATION-SNAPSHOT.json` registra
las rutas, tamaños y SHA-256 de los archivos entregados.

La distribucion Netlify coincide byte a byte con
`outputs/LIF-LAICA-NETLIFY-V2-20261013`; la completa con
`outputs/LIF-LAICA-NUEVOSITIOWEB-V2`. Los ZIP originales no se sobrescribieron.

No se incluyen contrasenas, tokens, llaveros, cookies, registros de participantes,
SQLite, `.env.local`, caches, dependencias instaladas ni historial Git ajeno.
`.env.example` contiene solo configuracion publica y campos privados vacios.
Se excluyen rutas experimentales y el modo publicado de intentos ilimitados.

## Compilacion y mantenimiento

Las fuentes de GitHub son portables para Netlify, sin necesidad de una sesion
de Sites. Conservan React/Vinext/Vite, logica, colores, fuentes y tiempos;
solo se omite el complemento de construccion especifico de Sites en esas copias.
`npm run build` aplica la politica de su `.env.example` y prepara HTML/RSC
y exactamente tres funciones finales, sin migracion.

`netlify.toml` en la raiz utiliza la captura compilada de `deploy/`, sin
recompilar. `deploy/netlify.toml` permite usar la misma captura con Netlify CLI.
Despues de editar fuente: compilar, verificar y actualizar ambos conjuntos
de archivos de `deploy/` juntos. Nunca mezclar HTML/JS nuevos con funciones
de otra compilacion. Cada cambio actualiza el README y la guia tecnica.

Las variables privadas se configuran por entorno. GitHub no sustituye Supabase
ni sus backups. Esta solicitud no cambia Netlify, Sites, su conexion de datos
ni el historial; solo registra las versiones del sitio en GitHub.

## Verificacion

- Ambas fuentes compilan; TypeScript aprobado en las dos.
- 112 referencias sin faltantes en Netlify; 132 en la completa.
- 20 pruebas focalizadas de bloqueo, ranking y sobres aprobadas en la copia Netlify.
- Cinco tamaños de pantalla por copia, con API simulada y cero envios reales.
- Trece renders y PDF; distribuciones conservadas identicas a sus paquetes.
- Sin archivos de 100 MiB o mas ni credenciales detectadas en las copias.
- Safari/iPhone fisico y carga alta siguen pendientes, como en las publicaciones.

Evidencia local: `work/github-qa-2026-10-13/` y las copias de
`../repositorios-github-2026-10-13/`. Este documento no afirma una subida terminada
hasta que los commits remotos esten confirmados.
