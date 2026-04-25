require('dotenv').config()
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'cmo912nnb000028rvmkm20qog',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      id: 'cmo912nnu000128rvvuje801r',
      username: 'user',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log({ admin, user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
