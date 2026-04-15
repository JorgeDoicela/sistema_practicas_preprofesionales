/* Arranque automático: crea .env si no existe y levanta Docker Compose. */
const { copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log('[docker-up] Se creó .env desde .env.example');
}

const compose = spawnSync('docker', ['compose', 'up', '--build', '-d'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

if (compose.status !== 0) {
  process.exit(compose.status ?? 1);
}

console.log('');
console.log('[docker-up] Listo. Front: http://localhost:3005  |  API: http://localhost:5000/api  |  DB: localhost:5432');
console.log('[docker-up] Datos demo: seed en cada reinicio del contenedor api (SKIP_PRISMA_SEED=true para omitir).');
console.log('[docker-up] Si la API falla por BD vieja: npm run docker:reset (borra volúmenes y vuelve a crear todo).');
console.log('');
