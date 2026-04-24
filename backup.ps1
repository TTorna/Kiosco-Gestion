# Configuración
$CONTAINER_NAME = "kiosko-app-db-1"
$DB_USER = "admin"
# CAMBIA ESTA RUTA por tu carpeta de Google Drive o OneDrive
$BACKUP_PATH = "C:\Users\$env:USERNAME\Desktop\kiosko app\backups"
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm"
$FILENAME = "backup_glmodas_$DATE.sql"

# Crear carpeta si no existe
if (!(Test-Path $BACKUP_PATH)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_PATH
}

# Ejecutar el dump desde Docker
Write-Host "Iniciando backup de la base de datos..." -ForegroundColor Cyan
docker exec $CONTAINER_NAME pg_dump -U $DB_USER kioskodb > "$BACKUP_PATH\$FILENAME"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completado con éxito: $FILENAME" -ForegroundColor Green
    
    # Opcional: Borrar backups de más de 30 días para no llenar la nube
    Get-ChildItem –Path $BACKUP_PATH –Recurse | Where-Object {($_.LastWriteTime -lt (Get-Date).AddDays(-30))} | Remove-Item
} else {
    Write-Host "ERROR: No se pudo realizar el backup. Asegúrate que Docker esté corriendo." -ForegroundColor Red
}
