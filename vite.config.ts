import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { localGamesApi } from './lib/gaming/vite-api';
export default defineConfig({
  server: { host: 'localhost', port: 3000, strictPort: true },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [localGamesApi(), vinext()],
});
