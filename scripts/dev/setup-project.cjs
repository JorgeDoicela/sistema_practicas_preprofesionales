/**
 * Setup Script: Industrializa el arranque del proyecto con resiliencia extrema.
 * Carga entornos, resuelve conexiones Docker vs Host y maneja fallos tolerantes.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const apiDir = path.join(root, 'api-emitesis');
const isVercel = process.env.VERCEL === '1' || !!process.env.CI;

// Cargar variables .env al arranque para resolución inteligente
try {
  const dotenv = require('dotenv');
  const rootEnv = path.join(root, '.env');
  const apiEnv = path.join(apiDir, '.env');
  
  if (fs.existsSync(apiEnv)) {
    dotenv.config({ path: apiEnv });
  } else if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }
} catch (e) {
  // Ignorar silenciosamente si no está instalado aún
}

// Adaptación automática para correr npx prisma fuera de Docker (Host local)
const isDocker = fs.existsSync('/.dockerenv');
if (!isDocker) {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@db:5432')) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@db:5432', '@127.0.0.1:5432');
  }
  if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('@db:5432')) {
    process.env.DIRECT_URL = process.env.DIRECT_URL.replace('@db:5432', '@127.0.0.1:5432');
  }
}

// Estado de la ejecución para resumen final
const status = {
  env: 'Detectando...',
  prismaGenerate: 'Pendiente',
  dbSync: 'Pendiente',
  dbSeed: 'Pendiente',
  errors: []
};

/**
 * Ejecuta un comando con reintentos y manejo de errores resiliente.
 */
function run(cmd, cwd = root, retries = 3, critical = true) {
  for (let i = 1; i <= retries; i++) {
    console.log(`\n> [${i}/${retries}] Ejecutando: ${cmd}`);
    try {
      execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
      return true; 
    } catch (e) {
      if (i === retries) {
        const errorMsg = `Falló tras ${retries} intentos: ${cmd}`;
        console.error(`\x1b[31m[ERROR]\x1b[0m ${errorMsg}`);
        status.errors.push(errorMsg);
        
        if (critical && !isVercel) {
          process.exit(1);
        }
        return false;
      }
      
      console.warn(`\x1b[33m[REINTENTO]\x1b[0m Fallo detectado. Esperando 5s...`);
      if (process.platform === 'win32') {
        try { execSync('timeout /t 5 /nobreak', { stdio: 'ignore' }); } catch(e) { /* fallback */ }
      } else {
        try { execSync('sleep 5', { stdio: 'ignore' }); } catch(e) { /* fallback */ }
      }
    }
  }
}

console.log('\n\x1b[35m%s\x1b[0m', '===================================================');
console.log('\x1b[35m%s\x1b[0m', '   EMITESIS CORE - GUARDIÁN DE CONFIGURACIÓN     ');
console.log('\x1b[35m%s\x1b[0m', '===================================================\n');

// 1. Diagnóstico de Entorno
status.env = isVercel ? 'Vercel / CI' : 'Local (Development)';
console.log(`[INFO] Entorno detectado: \x1b[36m${status.env}\x1b[0m`);
if (!isDocker && !isVercel && process.env.DATABASE_URL) {
  console.log(`[INFO] DATABASE_URL redirigida dinámicamente a Host: \x1b[32m${process.env.DATABASE_URL}\x1b[0m`);
}

// 2. Limpieza Preventiva
try {
  const prismaDir = path.join(root, 'node_modules', '.prisma');
  if (fs.existsSync(prismaDir)) {
    fs.rmSync(prismaDir, { recursive: true, force: true });
    console.log('[OK] Caché de Prisma limpiada.');
  }
} catch (e) {
  console.log('[!] No se pudo limpiar node_modules/.prisma (puede estar en uso).');
}

// 3. Generación de Cliente (CRÍTICO)
console.log('\n[1/3] Generando Prisma Client...');
if (run('npx prisma generate', apiDir, 2, true)) {
  status.prismaGenerate = 'EXITO';
} else {
  status.prismaGenerate = 'FALLIDO';
}

// 4. Sincronización de Base de Datos
console.log('\n[2/3] Sincronizando Base de Datos...');
if (isVercel) {
  if (!process.env.DATABASE_URL) {
    console.warn('\x1b[33m[AVISO]\x1b[0m DATABASE_URL no definida. Saltando sincronización.');
    status.dbSync = 'SALTADO (Sin URL)';
  } else {
    if (run('npx prisma db push --skip-generate', apiDir, 3, false)) {
      status.dbSync = 'EXITO';
    } else {
      status.dbSync = 'FALLIDO';
    }
  }
} else {
  // En local sincronizamos de forma segura sin forzar el reset.
  // Es tolerable a fallos para no interrumpir el instalador npm install si Docker está inactivo.
  const syncSuccess = run('npx prisma db push', apiDir, 2, false);
  if (syncSuccess) {
    status.dbSync = 'EXITO (Sincronización)';
  } else {
    status.dbSync = 'FALLIDO (Base de datos inactiva)';
    // Remover de status.errors para que no cause salida abortiva
    status.errors = status.errors.filter(err => !err.includes('prisma db push'));
    
    console.log('\n\x1b[33m[AVISO DE INSTALACIÓN]\x1b[0m');
    console.log('  La base de datos local no se encuentra activa en este momento (puerto 5432 cerrado).');
    console.log('  La instalación de paquetes continuará normalmente.');
    console.log('  Si deseas usar una base de datos PostgreSQL local instalada en tu sistema (o en Docker),');
    console.log('  puedes iniciar tu servicio PostgreSQL y ejecutar \x1b[36mnpm run setup:local-db\x1b[0m');
    console.log('  para configurarla, crear la base de datos, las tablas y la semilla automáticamente.\n');
  }
}

// 5. Sembrado de Datos
if (status.dbSync.includes('EXITO')) {
  console.log('\n[3/3] Ejecutando Seed (Datos Iniciales)...');
  if (run('npx prisma db seed', apiDir, 2, false)) {
    status.dbSeed = 'EXITO';
  } else {
    status.dbSeed = 'FALLIDO';
  }
} else {
  status.dbSeed = 'SALTADO';
}

// Resumen Final
console.log('\n\x1b[35m%s\x1b[0m', '===================================================');
console.log('\x1b[35m%s\x1b[0m', '           RESUMEN DE CONFIGURACIÓN              ');
console.log('\x1b[35m%s\x1b[0m', '===================================================');
console.log(` Entorno:      ${status.env}`);
console.log(` Prisma Client: ${status.prismaGenerate === 'EXITO' ? '\x1b[32m✔' : '\x1b[31m✘'} ${status.prismaGenerate}\x1b[0m`);
console.log(` DB Sync:      ${status.dbSync.includes('EXITO') ? '\x1b[32m✔' : (status.dbSync.includes('FALLIDO') ? '\x1b[33m!' : '\x1b[31m✘')} ${status.dbSync}\x1b[0m`);
console.log(` DB Seed:      ${status.dbSeed === 'EXITO' ? '\x1b[32m✔' : (status.dbSeed === 'SALTADO' ? '\x1b[33m-' : '\x1b[31m✘')} ${status.dbSeed}\x1b[0m`);

if (status.errors.length > 0) {
  console.log('\n\x1b[31m[!] Errores detectados durante el proceso:\x1b[0m');
  status.errors.forEach(err => console.log(`  - ${err}`));
  
  if (isVercel) {
    console.log('\n\x1b[33m[AVISO CI]\x1b[0m El build continuará para permitir diagnóstico, pero la App puede fallar en runtime.');
    process.exit(0); 
  } else {
    console.log('\n\x1b[31m[ERROR CRÍTICO]\x1b[0m Revisa los logs superiores antes de iniciar el dev server.');
    process.exit(1);
  }
} else {
  console.log('\n\x1b[32m[PERFECTO] Guardián de configuración completado.\x1b[0m\n');
}
