# LIF - Distribucion Netlify

Desarrollo: Daniel Víquez Azofeifa para LAICA 2026.

Incluye paginas y tres funciones privadas: `lif-api`, `lif-ranking-page` y
`lif-sync` (cada cinco minutos). Arrastrar solo HTML no instala la API.
El paquete V2 del 13 de octubre conserva todas las secciones: Renzo, historias,
comunidad y formulario de Confesiones completos, sin areas en construccion.
No incluye experimentos ni intentos ilimitados. Supabase conserva el historial;
Sheets recibe reportes, no un backup completo. La guia general es `README.md`.

Paquete preparado no equivale a sitio publicado. `ESTADO-PAQUETE.md` indica
la version exacta y los ajustes/limitaciones incluidos en esta entrega.

## Actualizar el proyecto existente

1. Requiere Node.js >=22.13. Ejecutar `node verificar-paquete.mjs`.
2. Conservar en Netlify Production/Functions: `LIF_GAME_STORAGE=postgres`,
   `LIF_DATABASE_HOST`, `LIF_DATABASE_USER`, `LIF_DATABASE_PASSWORD`,
   `LIF_SHEETS_ENDPOINT` y `LIF_SHEETS_SYNC_KEY`. Contrasena y clave son secretas.
3. No poner valores privados en `public`, codigo, ZIP ni capturas. No hay archivo
   privado de claves incluido ni generado por este paquete.
4. Primero vista previa, luego publicacion. Usar el proyecto existente, no crear otro:

```sh
npx --yes netlify-cli@27.10.2 deploy --site=43a5917c-13c0-45ae-95c8-6982a35d97be --dir=public --functions=functions --no-build
# Tras revisar la vista previa:
npx --yes netlify-cli@27.10.2 deploy --site=43a5917c-13c0-45ae-95c8-6982a35d97be --dir=public --functions=functions --no-build --prod
```

En Mac tambien puede usarse `Actualizar Netlify.command`. Las URLs de previews
no disponen automaticamente del secreto limitado a Production; no ampliar su
alcance solo para QA. Verificar presentacion con datos simulados y confirmar API
real en Production con consultas de lectura. No enviar formularios de QA reales.

No usar esta distribucion como deploy de Sites: necesita su worker. El resultado
de compilacion no prueba publicacion; registrar deploy y verificaciones en
`PUBLICACION.md`. Restaurar un deploy anterior desde Netlify no requiere borrar
Supabase ni cambiar su modo de almacenamiento.
