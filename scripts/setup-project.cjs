/**
 * Setup Script: Industrializa el arranque del proyecto.
 * Realiza verificaciones de entorno, genera Prisma Client y resetea la BD.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'api-emitesis');

function run(cmd, cwd = root) {
  console.log(`\n> Ejecutando: ${cmd} (en ${path.relative(root, cwd) || '.'})`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (e) {
    console.error(`Error ejecutando comando: ${cmd}`);
    process.exit(1);
  }
}

console.log('===================================================');
const title = '   SISTEMA EMITESIS - CONFIGURACIÓN INDUSTRIAL   ';
console.log(`\x1b[33m${title}\x1b[0m`);
console.log('===================================================');

// 1. Verificar .env (ya no se copian de example porque el usuario quiere comitearlos)
const envs = [
  path.join(root, '.env'),
  path.join(apiDir, '.env'),
  path.join(root, 'web-emitesis', '.env.local')
];

envs.forEach(env => {
  if (!fs.existsSync(env)) {
    console.warn(`\x1b[31m[ADVERTENCIA]\x1b[0m No se encontró el archivo: ${path.relative(root, env)}`);
  } else {
    console.log(`\x1b[32m[OK]\x1b[0m Configuración detectada: ${path.relative(root, env)}`);
  }
});

// 2. Generar Prisma Client
run('npx prisma generate', apiDir);

// 3. Sincronizar Base de Datos
const isVercel = process.env.VERCEL === '1' || !!process.env.CI;

if (isVercel) {
  console.log('\n\x1b[36m[INFO]\x1b[0m Entorno de CI/Vercel detectado. Usando "migrate deploy"...');
  run('npx prisma migrate deploy', apiDir);
  console.log('\x1b[36m[INFO]\x1b[0m Ejecutando seed de base de datos...');
  run('npx prisma db seed', apiDir);
} else {
  console.log('\n\x1b[31m[IMPORTANTE]\x1b[0m Se procederá a resetear y sembrar (seed) la base de datos...');
  run('npx prisma migrate reset --force', apiDir);
}

console.log('\n===================================================');
console.log('\x1b[32m   CONFIGURACIÓN COMPLETADA CON ÉXITO   \x1b[0m');
console.log('   Usa "npm run dev" para iniciar el sistema.');
console.log('===================================================\n');
