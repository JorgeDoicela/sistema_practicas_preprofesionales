/**
 * Setup Script: Industrializa el arranque del proyecto con resiliencia.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'api-emitesis');

/**
 * Ejecuta un comando con reintentos automáticos (útil para DBs en la nube como Neon)
 */
function run(cmd, cwd = root, retries = 3) {
  for (let i = 1; i <= retries; i++) {
    console.log(`\n> [${i}/${retries}] Ejecutando: ${cmd} (en ${path.relative(root, cwd) || '.'})`);
    try {
      execSync(cmd, { cwd, stdio: 'inherit' });
      return; // Éxito, salir de la función
    } catch (e) {
      if (i === retries) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Falló tras ${retries} intentos: ${cmd}`);
        process.exit(1);
      }
      console.warn(`\x1b[33m[REINTENTO]\x1b[0m El comando falló. Esperando 5 segundos antes de reintentar...`);
      
      // Cross-platform sleep (Linux/Mac/Windows)
      if (process.platform === 'win32') {
        execSync('timeout /t 5 /nobreak', { stdio: 'ignore' });
      } else {
        execSync('sleep 5', { stdio: 'ignore' });
      }
    }
  }
}

console.log('===================================================');
console.log('\x1b[33m   SISTEMA EMITESIS - CONFIGURACIÓN INDUSTRIAL   \x1b[0m');
console.log('===================================================');

// 1. Verificar .env
const envs = [
  path.join(root, '.env'),
  path.join(apiDir, '.env'),
  path.join(root, 'web-emitesis', '.env.local')
];

envs.forEach(env => {
  if (!fs.existsSync(env)) {
    console.warn(`\x1b[31m[ADVERTENCIA]\x1b[0m No se encontró: ${path.relative(root, env)}`);
  } else {
    console.log(`\x1b[32m[OK]\x1b[0m Configuración detectada: ${path.relative(root, env)}`);
  }
});

// 2. Limpieza de Prisma (Evita EPERM en Windows)
try {
  const prismaDir = path.join(root, 'node_modules', '.prisma');
  if (fs.existsSync(prismaDir)) {
    console.log('\n[INFO] Limpiando caché de Prisma...');
    fs.rmSync(prismaDir, { recursive: true, force: true });
  }
} catch (e) {}

// 3. Generar Prisma Client
run('npx prisma generate', apiDir);

// 4. Sincronizar Base de Datos (con reintentos para manejar timeouts de Neon)
const isVercel = process.env.VERCEL === '1' || !!process.env.CI;

if (isVercel) {
  console.log('\n\x1b[36m[INFO]\x1b[0m Entorno de CI/Vercel detectado. Validando variables...');
  
  if (!process.env.DATABASE_URL) {
    console.error('\x1b[31m[ERROR]\x1b[0m DATABASE_URL no encontrada. Saltando migraciones para evitar fallo de build.');
    console.log('[INFO] Asegúrate de configurar DATABASE_URL en el panel de Vercel.');
    process.exit(0); // Salir sin error para permitir que el build de Vercel continúe (si es posible)
  }

  console.log('\x1b[36m[INFO]\x1b[0m Usando "db push" para sincronizar el esquema...');
  run('npx prisma db push', apiDir);
  console.log('\x1b[36m[INFO]\x1b[0m Ejecutando seed...');
  run('npx prisma db seed', apiDir);
} else {
  console.log('\n\x1b[31m[IMPORTANTE]\x1b[0m Se procederá a un REINICIO TOTAL de la base de datos...');
  console.log('[INFO] Usando db push --force-reset para saltar bloqueos de seguridad (advisory locks).');
  
  // 1. Forzar el reset del esquema (esto borra todo y recrea tablas)
  run('npx prisma db push --force-reset', apiDir, 3);
  
  // 2. Ejecutar el sembrado de datos (seed)
  console.log('\x1b[36m[INFO]\x1b[0m Poblando base de datos con datos iniciales (seed)...');
  run('npx prisma db seed', apiDir, 2);
}

console.log('\n===================================================');
console.log('\x1b[32m   CONFIGURACIÓN COMPLETADA CON ÉXITO   \x1b[0m');
console.log('   Usa "npm run dev" para iniciar el sistema.');
console.log('===================================================\n');
