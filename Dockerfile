FROM node:22-alpine

WORKDIR /app

# Instalar dependencias necesarias para Prisma y bcrypt
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

EXPOSE 3000

# El comando de inicio correrá migraciones, el seed y levantará el entorno de desarrollo
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node prisma/seed.js && npm run dev"]
