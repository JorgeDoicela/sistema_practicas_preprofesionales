const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'coordinador.tic@istpet.edu.ec';
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      console.log('USER_NOT_FOUND:', email);
      return;
    }
    console.log('USER_FOUND_ID:', user.id);

    // Run the exact query from findProfile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        companyId: true,
        isTwoFactorEnabled: true,
        careerId: true,
        career: { select: { id: true, name: true, faculty: true } },
        company: {
          select: {
            id: true,
            name: true,
            ruc: true,
            address: true,
            email: true,
            representative: true,
          },
        },
      },
    });
    console.log('PROFILE_QUERY_SUCCESS:', JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error('DATABASE_QUERY_ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
