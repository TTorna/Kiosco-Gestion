const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { username: 'user' },
    update: { password: userPassword },
    create: {
      username: 'user',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log('✅ Usuarios reseteados con éxito')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
