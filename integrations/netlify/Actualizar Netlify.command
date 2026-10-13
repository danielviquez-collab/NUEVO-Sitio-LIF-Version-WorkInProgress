#!/bin/zsh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Se necesita Node.js 22.13 o posterior para actualizar Netlify."
  read -r "?Presiona Enter para cerrar."
  exit 1
fi
node verificar-paquete.mjs
export npm_config_cache="$HOME/Library/Caches/LIF-Netlify/npm"
export npm_config_audit=false
export npm_config_fund=false
echo "Preparando la herramienta de Netlify. La primera vez puede tardar unos minutos."
echo "Vincula este paquete con el proyecto LIF existente. No crees otro sitio."
npx --yes netlify-cli@27.10.2 link
echo "Conserva las variables privadas de Supabase y reportes configuradas en Production/Functions. Consulta LEEME.md. Nunca ingreses secretos dentro de public."
echo "VISTA crea una vista previa. PUBLICAR reemplaza el deploy oficial."
read -r "respuesta?Escribe VISTA o PUBLICAR (cualquier otra respuesta cancela): "
case "$respuesta" in
  VISTA) npx --yes netlify-cli@27.10.2 deploy --dir=public --functions=functions --no-build ;;
  PUBLICAR) npx --yes netlify-cli@27.10.2 deploy --dir=public --functions=functions --no-build --prod ;;
  *) echo "Cancelado. No se publico el sitio." ;;
esac
read -r "?Presiona Enter para cerrar."
