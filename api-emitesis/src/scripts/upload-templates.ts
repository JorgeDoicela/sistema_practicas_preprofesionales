import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function uploadInitialTemplates() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN no encontrado en .env');
    console.log('Por favor, copia el Read/Write Token desde el dashboard de Vercel y pégalo en tu archivo .env');
    return;
  }

  const templatesDir = path.join(process.cwd(), 'uploads', 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Error: El directorio ${templatesDir} no existe.`);
    return;
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));

  if (files.length === 0) {
    console.log('⚠️ No se encontraron archivos .docx en uploads/templates');
    return;
  }

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
    } catch (error: any) {
      console.error(`❌ Error al subir ${file}:`, error.message);
    }
  }

  console.log('✨ Proceso finalizado.');
}

uploadInitialTemplates().catch((err) => {
  console.error('Fatal error in upload script:', err);
  process.exit(1);
});

