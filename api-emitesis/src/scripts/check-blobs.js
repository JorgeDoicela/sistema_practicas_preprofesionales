const { list } = require('@vercel/blob');
const fs = require('fs');
require('dotenv').config();

async function checkBlobs() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const { blobs } = await list({ token });
    fs.writeFileSync('blob_list.json', JSON.stringify(blobs, null, 2));
    console.log(`Encontrados ${blobs.length} archivos.`);
  } catch (error) {
    fs.writeFileSync('blob_error.txt', error.message);
  }
}
checkBlobs();
