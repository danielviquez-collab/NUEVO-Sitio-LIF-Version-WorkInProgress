const excludedRoots = new Set([
  '.git', '.netlify', '.openai', '.next', '.vinext', '.wrangler', '.sites-runtime',
  'node_modules', 'work', 'outputs', 'dist', 'coverage',
]);

export function sourceAllowed(path) {
  const parts = path.split('/');
  return !parts.some(part => excludedRoots.has(part) || part === '.DS_Store') &&
    !parts.some(part => /^\.env(?:\.|$)/.test(part)) &&
    !/\.(?:sqlite(?:-wal|-shm)?|tsbuildinfo|pem|log|map)$/.test(path) &&
    !['scripts/netlify-database-ops.mjs', 'scripts/verify-netlify-live.mjs'].includes(path) &&
    !path.startsWith('scripts/macos/');
}

export function productionAllowed(path) {
  return sourceAllowed(path) &&
    !/^(?:app\/pruebas|app\/prueba-logo|public\/audio\/intro-proposals)(?:\/|$)/.test(path);
}
