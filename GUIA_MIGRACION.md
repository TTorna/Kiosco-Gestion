# Guía de Migración del Proyecto

Para pasar este proyecto a otra computadora manteniendo tus datos y configuración, sigue estos pasos:

## 1. Respaldo de Datos (Opcional pero Recomendado)
Si tienes datos cargados en el sistema (ventas, stock, usuarios) y quieres mantenerlos:
1. Asegúrate de que Docker esté corriendo.
2. Abre una terminal de PowerShell en la carpeta del proyecto.
3. Ejecuta el script de respaldo:
   ```powershell
   .\backup.ps1
   ```
4. Esto creará una carpeta `backups` con un archivo `.sql`. Guarda ese archivo.

## 2. Preparación de los Archivos
Puedes usar Git (GitHub) o copiar la carpeta manualmente (ZIP).

> [!IMPORTANT]
> **NO copies** las siguientes carpetas, ya que son muy pesadas y se generan automáticamente:
> - `node_modules`
> - `.next`
> - `backups` (opcional, si el archivo es grande)

### Si usas un archivo comprimido (ZIP):
Comprime todo excepto `node_modules` y `.next`.

## 3. Configuración en la Nueva Computadora
Instala los siguientes programas:
1. **Node.js** (versión 20 o superior).
2. **Docker Desktop**.
3. **Git** (opcional, si usas GitHub).

### Pasos para iniciar:
1. Descarga/Clona el proyecto en la nueva compu.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Crea el archivo `.env`:
   - Copia el archivo `.env.example` y renombralo a `.env`.
   - Asegúrate de que los valores coincidan con tu configuración de Docker.
5. Inicia los servicios de Docker:
   ```bash
   docker-compose up -d
   ```
6. Prepara la base de datos y genera el cliente:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 4. Restaurar Datos (Si hiciste el backup en el paso 1)
1. Asegúrate de que el contenedor de la base de datos esté corriendo.
2. Copia tu archivo `.sql` dentro de la nueva carpeta `backups`.
3. Ejecuta el siguiente comando (ajustando el nombre del archivo):
   ```powershell
   cat backups/TU_ARCHIVO.sql | docker exec -i kioskoapp-db-1 psql -U admin -d kioskodb
   ```

## 5. ¡Listo!
Ya puedes levantar la app como siempre:
```bash
npm run dev
```
