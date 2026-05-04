const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const key = 'chat_message_retention_days';
  const value = '730';
  const category = 'CHAT';
  const description = 'Periodo de retención de mensajes de chat antes de su anonimización o purga (días).';

  try {
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.systemSetting.create({
        data: { key, value, category, description }
      });
      console.log(`Setting ${key} created successfully.`);
    } else {
      console.log(`Setting ${key} already exists.`);
    }
  } catch (error) {
    console.error('Error adding setting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
