param (
    [Parameter(Mandatory=$true)]
    [string]$ArchivoBackup
)

$TEST_CONTAINER = "db-verify-tmp"

Write-Host "--- Diagnóstico de Backup: $ArchivoBackup ---" -ForegroundColor Cyan

if (!(Test-Path $ArchivoBackup)) {
    Write-Host "ERROR: El archivo no existe." -ForegroundColor Red
    exit
}

# 1. Crear base de datos temporal
Write-Host "1. Creando entorno de prueba temporal..." -ForegroundColor Gray
docker run --name $TEST_CONTAINER -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=testdb -d postgres:15-alpine > $null

# Esperar a que PostgreSQL inicie (aprox 5 seg)
Start-Sleep -s 5

# 2. Intentar restaurar
Write-Host "2. Restaurando datos para verificación..." -ForegroundColor Gray
cat $ArchivoBackup | docker exec -i $TEST_CONTAINER psql -U test testdb > $null 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Restauración exitosa." -ForegroundColor Green
    
    # 3. Contar registros clave
    Write-Host "`n--- Resumen de Datos Encontrados ---" -ForegroundColor Yellow
    $productos = docker exec $TEST_CONTAINER psql -U test testdb -t -c "SELECT count(*) FROM \"Product\";"
    $ventas = docker exec $TEST_CONTAINER psql -U test testdb -t -c "SELECT count(*) FROM \"Sale\";"
    
    Write-Host "Productos: $($productos.Trim())"
    Write-Host "Ventas:    $($ventas.Trim())"
    Write-Host "------------------------------------" -ForegroundColor Yellow
} else {
    Write-Host "❌ ERROR: El archivo de backup parece estar corrupto o incompleto." -ForegroundColor Red
}

# 4. Limpieza
Write-Host "`n3. Limpiando entorno de prueba..." -ForegroundColor Gray
docker stop $TEST_CONTAINER > $null
docker rm $TEST_CONTAINER > $null

Write-Host "¡Prueba finalizada!" -ForegroundColor Cyan
