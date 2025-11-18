# 🚀 Instrucciones de Deployment - Wheeler Tracker v1.3

Guía completa para desplegar y actualizar Wheeler Tracker en producción.

---

## 📋 Tabla de Contenidos

1. [Instalación Inicial](#instalación-inicial)
2. [Actualización a v1.3](#actualización-a-v13)
3. [Comandos Principales](#comandos-principales)
4. [Verificación de Deployment](#verificación-de-deployment)
5. [Mantenimiento](#mantenimiento)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Instalación Inicial

### Requisitos del Sistema

```bash
# Verificar versiones
docker --version      # Docker >= 20.10
docker-compose --version  # docker-compose >= 1.29
git --version         # Git >= 2.25
uname -a              # Linux o macOS
```

### Pasos de Instalación

#### 1. Clonar Repositorio

```bash
cd /volume1/docker  # En Synology NAS
# O tu directorio preferido en Linux/macOS

git clone https://github.com/tu-usuario/wheeler-tracker.git
cd wheeler-tracker
```

#### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables esenciales en .env:**
```bash
# API External Keys (opcional)
IBKE_API_KEY=tu_clave_aqui
FINNHUB_API_KEY=tu_clave_aqui
CURRENCY_FREAKS_API_KEY=tu_clave_aqui

# Base de datos
DB_PATH=/volume1/docker/wheeler-tracker/data/trades.db

# Puertos
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Environment
ENVIRONMENT=production
```

#### 3. Construir y Levantar Servicios

```bash
# Construir imágenes Docker
sudo docker-compose build

# Verificar que las imágenes se crearon
sudo docker images | grep wheeler

# Iniciar servicios
sudo docker-compose up -d

# Verificar estado
sudo docker-compose ps
```

**Salida esperada:**
```
NAME                    STATUS
wheel-tracker-backend   Up 2 minutes
wheel-tracker-frontend  Up 2 minutes
```

#### 4. Verificar Acceso

```bash
# Backend health check
curl http://localhost:8080/api/v1/health

# Esperado: {"status":"ok"}

# Frontend
# Abrir en navegador: http://localhost:3000
```

---

## 🆙 Actualización a v1.3

### Cambios en v1.3

- ✨ Nueva funcionalidad: CSV Import interactivo
- 🔧 Mejoras en validación de trades
- 🐛 Correcciones de bugs

### Procedimiento de Actualización

#### 1. Descargar cambios

```bash
cd /volume1/docker/wheeler-tracker

# Traer cambios del repositorio
git fetch origin
git pull origin main

# Verificar rama actual
git branch -v
```

#### 2. Verificar cambios

```bash
# Ver cambios en archivos
git diff HEAD~1

# Ver commits nuevos
git log --oneline -5
```

#### 3. Actualizar Backend (Go)

```bash
# Reconstruir imagen del backend
sudo docker-compose build --no-cache backend

# Verificar compilación
sudo docker-compose logs backend | tail -20
```

**Salida esperada:**
```
Step 14/14 : CMD ["./main"]
---> Running in ...
Successfully built ...
```

#### 4. Actualizar Frontend (React)

```bash
# Reconstruir imagen del frontend
sudo docker-compose build --no-cache frontend

# Verificar build
sudo docker-compose logs frontend | tail -20
```

#### 5. Reiniciar Servicios

```bash
# Detener servicios actuales
sudo docker-compose down

# Iniciar versión nueva
sudo docker-compose up -d

# Ver logs para verificar startup
sudo docker-compose logs -f backend frontend
```

**Esperar confirmación:**
```
wheel-tracker-backend | 2025/11/17 ... Database initialized successfully
wheel-tracker-backend | 2025/11/17 ... Starting server on :8080
wheel-tracker-frontend | nginx: configuration test is successful
```

#### 6. Verificar Actualización

```bash
# Probar nueva funcionalidad
curl http://localhost:8080/api/v1/health

# Abrir frontend
# http://localhost:3000/management
# Ir a: Importar Trades desde CSV
```

---

## 💻 Comandos Principales

### Ver Estado

```bash
# Ver contenedores activos
sudo docker-compose ps

# Ver logs del backend
sudo docker-compose logs backend -f --tail=50

# Ver logs del frontend
sudo docker-compose logs frontend -f --tail=50

# Ver logs de ambos
sudo docker-compose logs -f
```

### Reiniciar Servicios

```bash
# Reiniciar un servicio específico
sudo docker-compose restart backend
sudo docker-compose restart frontend

# Reiniciar todos
sudo docker-compose restart

# Iniciar
sudo docker-compose start

# Detener
sudo docker-compose stop

# Detener y eliminar contenedores
sudo docker-compose down
```

### Acceder a Contenedores

```bash
# Shell del backend (Go)
sudo docker-compose exec backend sh

# Shell del frontend (Node)
sudo docker-compose exec frontend sh

# Dentro del contenedor:
# ls -la
# ps aux
# exit
```

### Limpiar Datos

```bash
# Eliminar BD (CUIDADO: datos no recuperables)
sudo rm -f /volume1/docker/wheeler-tracker/data/trades.db

# Limpiar logs
sudo truncate -s 0 /volume1/docker/wheeler-tracker/logs/*

# Eliminar imágenes no usadas
sudo docker image prune -a --force
```

---

## ✅ Verificación de Deployment

### Checklist Post-Deployment

```bash
# 1. Verificar servicios corriendo
sudo docker-compose ps
# ✅ Ambos servicios "Up"

# 2. Health check backend
curl -s http://localhost:8080/api/v1/health | jq .
# ✅ {"status":"ok"}

# 3. Base de datos existe
ls -lh /volume1/docker/wheeler-tracker/data/trades.db
# ✅ Archivo existe y tiene tamaño > 0

# 4. Frontend responde
curl -s http://localhost:3000 | head -5
# ✅ HTML válido

# 5. Logs sin errores
sudo docker-compose logs --since 5m | grep -i error
# ✅ No hay errores critales
```

### Tests Funcionales

#### Test 1: Crear Cuenta

```bash
curl -X POST http://localhost:8080/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portfolio",
    "currency": "USD",
    "initial_balance": 10000
  }'

# ✅ Respuesta exitosa con ID
```

#### Test 2: Cargar CSV

```bash
# Crear CSV de prueba
cat > /tmp/test.csv << 'EOF'
account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date
1,AAPL,CC,1,150,1.50,2025-11-17,2025-12-19
EOF

# Validar
curl -X POST http://localhost:8080/api/v1/trades/validate \
  -F "file=@/tmp/test.csv"

# ✅ Respuesta con resultados de validación
```

#### Test 3: Acceso Frontend

```bash
# En navegador:
# http://localhost:3000
# ✅ Página carga correctamente
# ✅ Puedes navegar a Administración
# ✅ Nueva pestaña "Importar CSV" visible
```

---

## 🔄 Mantenimiento

### Backups Regulares

```bash
# Backup de BD
sudo cp /volume1/docker/wheeler-tracker/data/trades.db \
        /volume1/docker/wheeler-tracker/data/trades.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup completo del proyecto
sudo tar -czf /volume1/wheeler-tracker-backup-$(date +%Y%m%d).tar.gz \
        /volume1/docker/wheeler-tracker

# Listar backups
ls -lh /volume1/docker/wheeler-tracker/data/*.backup.*
```

### Limpiar Logs Viejos

```bash
# Archivo de rotación (opcional)
sudo logrotate -vf /etc/logrotate.d/wheeler-tracker

# Manual: limitar tamaño de logs
sudo truncate -s 100M /volume1/docker/wheeler-tracker/logs/*.log
```

### Actualizar Dependencias

```bash
# Frontend
sudo docker-compose exec frontend npm update

# Reconstruir
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d frontend
```

---

## 🐛 Troubleshooting

### Problema: Backend no inicia

**Síntomas:**
```
wheel-tracker-backend | panicked at 'database connection failed'
```

**Soluciones:**
```bash
# 1. Verificar permisos de directorio
sudo chmod -R 755 /volume1/docker/wheeler-tracker/data

# 2. Verificar BD corrupta
sudo sqlite3 /volume1/docker/wheeler-tracker/data/trades.db "PRAGMA integrity_check;"

# 3. Recrear BD
sudo rm /volume1/docker/wheeler-tracker/data/trades.db
sudo docker-compose restart backend

# 4. Ver error exacto
sudo docker-compose logs backend --tail=50
```

### Problema: Frontend no se actualiza

**Síntomas:**
```
- Nueva funcionalidad no aparece
- Interfaz vieja al recargar
```

**Soluciones:**
```bash
# 1. Limpiar caché del navegador
# Ctrl+Shift+Delete (o Cmd+Shift+Delete en Mac)

# 2. Reconstruir frontend
sudo docker-compose build --no-cache frontend

# 3. Reiniciar
sudo docker-compose down
sudo docker-compose up -d

# 4. Verificar logs
sudo docker-compose logs frontend
```

### Problema: CSV import devuelve error 400

**Síntomas:**
```json
{"error": "No valid trades found in CSV"}
```

**Soluciones:**
```bash
# 1. Verificar formato CSV
file /tmp/trades.csv

# 2. Validar contenido
head -5 /tmp/trades.csv

# 3. Convertir a UTF-8 (si es necesario)
sudo iconv -f ISO-8859-1 -t UTF-8 /tmp/trades.csv > /tmp/trades_utf8.csv

# 4. Probar con CSV simple
echo "account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date" > /tmp/simple.csv
echo "1,AAPL,CC,1,150,1.50,2025-11-17,2025-12-19" >> /tmp/simple.csv

# 5. Ver error exacto en logs
sudo docker-compose logs backend | grep -i csv
```

### Problema: Base de datos llena

**Síntomas:**
```
database disk image is malformed
```

**Soluciones:**
```bash
# 1. Ver tamaño actual
du -sh /volume1/docker/wheeler-tracker/data/

# 2. Optimizar BD
sudo sqlite3 /volume1/docker/wheeler-tracker/data/trades.db "VACUUM;"

# 3. Ver tabla más grande
sudo sqlite3 /volume1/docker/wheeler-tracker/data/trades.db \
  "SELECT name, page_count * page_size as size FROM pragma_page_count(), (SELECT page_size FROM pragma_page_size);"

# 4. Restaurar desde backup si es necesario
sudo cp /volume1/docker/wheeler-tracker/data/trades.db.backup.* \
        /volume1/docker/wheeler-tracker/data/trades.db
```

### Problema: Puerto ya está en uso

**Síntomas:**
```
Error response from daemon: bind: address already in use
```

**Soluciones:**
```bash
# 1. Ver qué proceso usa el puerto
sudo lsof -i :3000
sudo lsof -i :8080

# 2. Cambiar puerto en .env
FRONTEND_PORT=3001
BACKEND_PORT=8081

# 3. Reconstruir y reiniciar
sudo docker-compose down
sudo docker-compose up -d

# 4. O detener el proceso conflictivo
sudo kill -9 <PID>
```

---

## 📞 Soporte

Para más ayuda:

1. Revisar logs: `sudo docker-compose logs -f`
2. Consultar README.md del proyecto
3. Verificar formato CSV en GUIA_CSV_IMPORT.md
4. Issues en GitHub: `https://github.com/tu-usuario/wheeler-tracker/issues`

---

**Última actualización:** 17 Noviembre 2025
**Versión:** 1.3.0
**Autor:** Wheeler Tracker Team
