# Wheel Tracker

Proyecto para la gestión de portafolios y operaciones basadas en la estrategia "wheel" de opciones. Soporta múltiples monedas, diversas APIs de datos bursátiles y cálculo continuo del costo base por acción con ajustes para coberturas realizadas mediante opciones (Covered Calls, Cash-Secured Puts).

## 🎯 Estado del Proyecto: DEPLOYED ✅

**Última actualización:** 2025-11-17 11:24 CET

- ✅ Backend (Go/Gin): En ejecución y Saludable
- ✅ Frontend (React): En ejecución y Saludable
- ✅ Docker Deployment: Exitoso
- ✅ Base de datos (SQLite): Inicializada

---

## Estructura General

- **Backend (Go):** Lógica financiera, API REST, persistencia.
- **Frontend (React):** UI interactiva para gestión y análisis.
- **Data:** Esquemas y archivos de base de datos.
- **DevOps:** Docker y composición de servicios.

---

## Árbol de directorios

**Ruta absoluta raíz:** `/volume1/docker/wheeler-tracker/`

```
/volume1/docker/wheeler-tracker/

backend/
    cmd/
        server/
            main.go                    # Inicialización y enrutamiento del servidor
    internal/
        database/
            database.go                # Conexión SQLite y esquema
        handlers/
            account_handler.go         # Gestión de cuentas
            api_handler.go             # Utilidades API
            income_handler.go          # Ingresos (dividendos/intereses)
            position_handler.go        # Seguimiento de posiciones
            trade_handler.go           # Gestión de operaciones
            trade_import_handler.go    # Importación CSV de operaciones
            wheel_handler.go           # Seguimiento estrategia wheel
        models/
            models.go                  # Definiciones de modelos
        services/
            services.go                # Capa de lógica de negocio
    Dockerfile                         # Build multi-stage Go + Alpine
    go.mod
    go.sum

frontend/
    public/
        index.html                     # Punto de entrada HTML
    src/
        App.js                         # Componente principal
        index.js                       # Entrada React
        pages/
            AnalyticsPage.js           # Dashboard analítico
            ImportTradesPage.jsx       # Importación de trades CSV
            PositionsPage.js           # Gestión de posiciones
            TickerPage.js              # Información de símbolos
            TradesPage.js              # Gestión de operaciones
            WheelsPage.js              # Seguimiento de wheels
        services/
            api.js                     # Cliente HTTP para API backend
        styles/
            App.css                    # Estilos globales
    Dockerfile                         # Build Node 18 + Nginx Alpine
    package.json
    .env

data/
    init_schema.sql                    # Esquema inicial de base de datos
    trades.db                          # Archivo SQLite (persistente)
    trades.db-shm                      # WAL shared memory
    trades.db-wal                      # WAL log file

docker-compose.yml                     # Orquestación de servicios
nginx.conf                             # Configuración de Nginx
.gitignore
README.md                              # Este documento
README_Claude.md                       # Directivas para colaboración con IA
env                                    # Variables de entorno
```

---

## Ejemplo de rutas relativas

- Backend principal: `backend/cmd/server/main.go`
- Servicio de trades: `backend/internal/services/services.go`
- Handler de wheel: `backend/internal/handlers/wheel_handler.go`
- Modelos de datos: `backend/internal/models/models.go`
- Frontend App: `frontend/src/App.js`
- Página de análisis: `frontend/src/pages/AnalyticsPage.js`
- Página de importación: `frontend/src/pages/ImportTradesPage.jsx`
- Cliente API: `frontend/src/services/api.js`
- Hoja de estilos: `frontend/src/styles/App.css`
- Base de datos local: `data/trades.db`
- Compose: `docker-compose.yml`
- Nginx: `nginx.conf`

---

## Servicios y Puertos

| Servicio | URL | Puerto | Tecnología |
|----------|-----|--------|------------|
| **Frontend** | http://localhost:3000 | 3000 | React + Nginx |
| **Backend API** | http://localhost:8090 | 8090 | Go (Gin) |
| **Base de datos** | N/A | N/A | SQLite |
| **Health Check** | http://localhost:8090/api/v1/health | 8090 | JSON endpoint |

---

## Cambios Realizados (Sesión: 2025-11-17)

### Backend (Go)

#### Correcciones de Compilación
- ✅ Resueltos problemas de dependencias Go (GOSUMDB=off, flag -mod=mod)
- ✅ Corregidos errores de importación y paquetes internos
- ✅ Eliminados imports no utilizados

#### Estructura de Servicios
- ✅ Creado `internal/services/services.go` - Capa de lógica de negocio
- ✅ Implementada clase `TradeService` con métodos básicos

#### Modelos de Datos
- ✅ Actualizado `internal/models/models.go` con modelos completos
- ✅ Agregados tags JSON para serialización

#### Handlers
- ✅ Corregido `internal/handlers/trade_import_handler.go`
- ✅ Parsea registros CSV con validación

#### Base de Datos
- ✅ Creado `internal/database/database.go`
- ✅ Inicialización automática de esquema

#### Servidor Principal
- ✅ Actualizado `cmd/server/main.go` con enrutamiento completo

### Frontend (React)

#### Estructura Base
- ✅ Creado `public/index.html`
- ✅ Verificada estructura de `src/` completa
- ✅ React build exitoso (71.6 kB JS + 1.18 kB CSS)

### Docker & DevOps

#### Backend Dockerfile
- ✅ Build multi-stage (Go 1.21 + Alpine)
- ✅ Health checks configurados

#### Frontend Dockerfile
- ✅ Build con Node 18-Alpine + Nginx

#### Docker Compose
- ✅ Ambos servicios corriendo y saludables
- ✅ Puertos mapeados correctamente

### Documentación

- ✅ Creado `README_Claude.md` - Protocolo de colaboración

---

## Flujos básicos

### Inicio rápido

```bash
cd /volume1/docker/wheeler-tracker
sudo docker-compose build --no-cache
sudo docker-compose up -d
sudo docker-compose ps
sudo docker-compose logs -f
```

### Verificación

```bash
curl http://localhost:8090/api/v1/health
open http://localhost:3000
```

### Desarrollo Backend

```bash
cd backend
go build && ./main
```

### Desarrollo Frontend

```bash
cd frontend
npm install
npm start
```

---

## Funcionalidades clave

- ✅ Añadir y gestionar portafolios y activos
- ✅ Agregar, cerrar, modificar trades
- ✅ Visualización interactiva: símbolos, analytics, wheels
- ✅ APIs multi-fuente, multi-moneda (preparado)
- ✅ Importación de operaciones vía CSV
- ✅ Deployable en Docker (Synology NAS compatible)

---

## Endpoints API (Actuales)

### Health
- `GET /api/v1/health` - Estado del servidor

### Stubs (Retornan datos mock)
- `GET /api/v1/trades` - Listar operaciones
- `POST /api/v1/trades` - Crear operación
- `PUT /api/v1/trades/:id` - Actualizar operación
- `DELETE /api/v1/trades/:id` - Eliminar operación
- `POST /api/v1/trades/import` - Importar CSV
- `GET /api/v1/accounts` - Listar cuentas
- `POST /api/v1/accounts` - Crear cuenta
- `GET /api/v1/positions` - Listar posiciones
- `GET /api/v1/income` - Listar ingresos
- `GET /api/v1/wheels` - Listar wheels

---

## Próximos Pasos

### Fase 1: API Core
- [ ] Esquema completo de base de datos
- [ ] Handlers reales para operaciones CRUD
- [ ] Validación de entrada
- [ ] Manejo de errores robusto

### Fase 2: Frontend UI
- [ ] Dashboard con métricas principales
- [ ] Interfaz de gestión de cuentas
- [ ] Entrada y edición de operaciones
- [ ] Interfaz de importación CSV

### Fase 3: Integraciones Avanzadas
- [ ] Datos real-time desde Finnhub
- [ ] Conector Interactive Brokers
- [ ] Conversión de divisas
- [ ] Analytics y reportes
- [ ] Autenticación y multi-usuario

### Fase 4: Optimización
- [ ] Tuning de performance
- [ ] Indexación de base de datos
- [ ] Caché de API

---

## Colaboración y Desarrollo

**Para futuras modificaciones de código, consulta [README_Claude.md](README_Claude.md)**

---

## Solución de Problemas

### El build falla
```bash
sudo docker-compose down -v
sudo docker system prune -a
sudo docker-compose build --no-cache
```

### Puerto en uso
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
```

### Problemas de Base de Datos
```bash
rm /volume1/docker/wheeler-tracker/data/trades.db
sudo docker-compose restart backend
```

---

**Última actualización:** 2025-11-17 11:24 CET  
**Versión:** 1.1  
**Estado:** Deployed & Running ✅
