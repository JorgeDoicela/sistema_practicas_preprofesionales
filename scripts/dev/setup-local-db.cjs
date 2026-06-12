/**
 * Script de Automatización: Configura y migra el proyecto para usar una base de datos PostgreSQL local.
 * Soporta modo interactivo y automático (con el flag -y).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const net = require('net');

const root = path.join(__dirname, '..', '..');
const apiDir = path.join(root, 'api-emitesis');
const rootEnvPath = path.join(root, '.env');
const apiEnvPath = path.join(apiDir, '.env');

const autoAccept = process.argv.includes('-y') || process.argv.includes('--yes') || !process.stdin.isTTY;

function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    const lines = Object.entries(updates).map(([k, v]) => `${k}="${v}"`);
    fs.writeFileSync(filePath, lines.join('\n') + '\n');
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${val}"`);
    } else {
      content += `\n${key}="${val}"\n`;
    }
  }
  fs.writeFileSync(filePath, content.trim() + '\n');
}

function testConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function runCommand(cmd, cwd) {
  console.log(`\n> Ejecutando: ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Falló la ejecución de: ${cmd}`);
    return false;
  }
}

async function main() {
  console.log('\n\x1b[35m%s\x1b[0m', '===================================================');
  console.log('\x1b[35m%s\x1b[0m', '      CONFIGURACIÓN DE POSTGRESQL LOCAL          ');
  console.log('\x1b[35m%s\x1b[0m', '===================================================\n');

  // Valores por defecto
  let host = 'localhost';
  let port = '5432';
  let user = 'postgres';
  let password = 'password';
  let database = 'emitesis_db';

  if (!autoAccept) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (query, defaultValue) => new Promise((resolve) => {
      rl.question(`${query} [${defaultValue}]: `, (ans) => {
        resolve(ans.trim() || defaultValue);
      });
    });

    host = await ask('Host de PostgreSQL', host);
    port = await ask('Puerto de PostgreSQL', port);
    user = await ask('Usuario de PostgreSQL', user);
    password = await ask('Contraseña de PostgreSQL', password);
    database = await ask('Nombre de la Base de Datos', database);

    rl.close();
  } else {
    console.log('[INFO] Ejecutando en modo automático con valores predeterminados.');
  }

  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;

  console.log(`\n[1/4] Verificando conexión al servidor PostgreSQL en ${host}:${port}...`);
  const isServerUp = await testConnection(host, parseInt(port, 10));

  if (!isServerUp) {
    console.error(`\x1b[31m[ERROR CRÍTICO]\x1b[0m No se pudo conectar al servidor PostgreSQL en ${host}:${port}.`);
    console.error('Asegúrese de que el servicio de PostgreSQL esté iniciado y escuchando en ese puerto.');
    process.exit(1);
  }
  console.log('\x1b[32m✔ Conexión exitosa al puerto del servidor.\x1b[0m');

  console.log('\n[2/4] Escribiendo variables de entorno en archivos .env...');
  
  const updates = {
    DATABASE_URL: connectionString,
    DIRECT_URL: connectionString
  };

  // Actualizar el .env del backend (donde NestJS lee en desarrollo)
  updateEnvFile(apiEnvPath, updates);
  console.log(`  ✔ Actualizado: api-emitesis/.env`);

  // Actualizar también el .env de la raíz para consistencia
  updateEnvFile(rootEnvPath, updates);
  console.log(`  ✔ Actualizado: .env (raíz)`);

  // Asegurar que Prisma Client esté generado
  console.log('\n[3/4] Generando Prisma Client...');
  if (!runCommand('npx prisma generate', apiDir)) {
    console.error('\x1b[31m[ERROR]\x1b[0m Falló la generación del Prisma Client.');
    process.exit(1);
  }

  // Ejecutar db push (que crea la base de datos si no existe y sube las tablas)
  console.log('\n[4/4] Sincronizando esquema de base de datos (se creará la BD si no existe)...');
  // Usamos db push para agilizar y evitar crear archivos de migración locales innecesarios
  if (!runCommand('npx prisma db push --accept-data-loss', apiDir)) {
    console.error('\x1b[31m[ERROR]\x1b[0m Falló la sincronización de las tablas de la base de datos.');
    console.error('Revise las credenciales y permisos del usuario de PostgreSQL.');
    process.exit(1);
  }
  console.log('\x1b[32m✔ Base de datos y tablas sincronizadas correctamente.\x1b[0m');

  // Ejecutar seed
  console.log('\n[*] Población de datos iniciales (Seeders)...');
  if (!runCommand('npx prisma db seed', apiDir)) {
    console.warn('\x1b[33m[ADVERTENCIA]\x1b[0m Falló la ejecución del seed de base de datos.');
  } else {
    console.log('\x1b[32m✔ Datos iniciales (seed) cargados exitosamente.\x1b[0m');
  }

  console.log('\n\x1b[32m%s\x1b[0m', '===================================================');
  console.log('\x1b[32m%s\x1b[0m', '   ¡PROCESO COMPLETADO EXITOSAMENTE!              ');
  console.log('\x1b[32m%s\x1b[0m', '===================================================');
  console.log('  Su proyecto ahora está listo para usar PostgreSQL local.');
  console.log('  Puede iniciar los servidores ejecutando: \x1b[36mnpm run dev\x1b[0m\n');
}

main().catch((err) => {
  console.error('Ocurrió un error inesperado durante la configuración:', err);
  process.exit(1);
});
