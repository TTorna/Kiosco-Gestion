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

# Build la app para producción
RUN npm run build

# Al iniciar: regenerar cliente, aplicar schema, seed (ignora errores si ya existe), y arrancar
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node prisma/seed.js || true && npm start"]
