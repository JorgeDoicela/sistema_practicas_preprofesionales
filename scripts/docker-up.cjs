/* Arranque automático: crea .env si no existe y levanta Docker Compose. */
const { copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

console.log('\x1b[36m%s\x1b[0m', '\n> [INFO] Levantando entorno de desarrollo con Docker...');

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log('\x1b[32m%s\x1b[0m', '  ✔ Se creó archivo .env local a partir de .env.example');
}

const compose = spawnSync('docker', ['compose', 'up', '--build', '-d'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

if (compose.status !== 0) {
  console.error('\x1b[31m%s\x1b[0m', '\n[ERROR] Falló al levantar contenedores con Docker Compose.');
  process.exit(compose.status ?? 1);
}

console.log('\x1b[35m%s\x1b[0m', '\n==================================================');
console.log('\x1b[35m%s\x1b[0m', '   EMITESIS CORE - ACCESOS LOCALES ACTIVOS        ');
console.log('\x1b[35m%s\x1b[0m', '==================================================');
console.log('  \x1b[32m✔\x1b[0m FRONTEND  : \x1b[36mhttp://localhost:3005\x1b[0m');
console.log('  \x1b[32m✔\x1b[0m BACKEND   : \x1b[36mhttp://localhost:5000/api\x1b[0m');
console.log('  \x1b[32m✔\x1b[0m POSTGRES  : \x1b[36mlocalhost:5432\x1b[0m');
console.log('\x1b[35m%s\x1b[0m', '==================================================');
console.log('\x1b[33m%s\x1b[0m', '[!] Semilla de datos: ejecutada en arranque (SKIP_PRISMA_SEED=true para omitir).');
console.log('[i] Si experimenta errores de base de datos desactualizada, ejecute:');
console.log('    \x1b[33mnpm run docker:reset\x1b[0m (Esto purga volúmenes y recrea todo limpio)\n');
