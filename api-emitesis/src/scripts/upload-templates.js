const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function uploadInitialTemplates() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN no encontrado en .env');
    return;
  }

  const templatesDir = path.join(process.cwd(), 'uploads', 'templates');
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));

  console.log(`🚀 Iniciando subida de ${files.length} plantillas a Vercel Blob...`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    try {
      console.log(`Subiendo ${file}...`);
      const { url } = await put(file, fileBuffer, {
        access: 'public',
        token: token
      });
      console.log(`✅ Subido: ${file} -> ${url}`);
    } catch (error) {
      console.error(`❌ Error al subir ${file}:`, error.message);
    }
  }

  console.log('✨ Proceso finalizado.');
}

uploadInitialTemplates();
