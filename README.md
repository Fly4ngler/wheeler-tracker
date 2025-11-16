## Wheel Tracker

### Descripción

Proyecto para la gestión de portafolios y operaciones basadas en la estrategia "wheel" de opciones. Soporta múltiples monedas, diversas APIs de datos bursátiles y cálculo continuo del costo base por acción con ajustes para coberturas realizadas mediante opciones (Covered Calls, Cash-Secured Puts).

### Estructura General

- **Backend (Go):** Lógica financiera, API REST, persistencia.
- **Frontend (React):** UI interactiva para gestión y análisis.
- **Data:** Esquemas y archivos de base de datos.
- **DevOps:** Docker y composición de servicios.

### Árbol de directorios

#### Ruta absoluta raíz: /volume1/docker/wheel-tracker/

```
/volume1/docker/wheel-tracker/

 backend/
    cmd/
       server/
           main.go
    internal/
       database/
          database.go
       handlers/
          account_handler.go
          api_handler.go
          income_handler.go
          position_handler.go
          trade_handler.go
          trade_import_handler.go
          wheel_handler.go
       models/
           models.go
    Dockerfile
    go.mod
    go.sum

 frontend/
    public/
        index.html
    src/
       App.js
       index.js
       pages/
          AnalyticsPage.js
          ImportTradesPage.jsx
          PositionsPage.js
          TickerPage.js
          TradesPage.js
          WheelsPage.js
       services/
          api.js
       styles/
           App.css
    Dockerfile
    package.json
    .env

 data/
    init_schema.sql
    trades.db
    trades.db-shm
    trades.db-wal

 docker-compose.yml
 .gitignore
 README.md                      # Este documento
 env
```

#### Ejemplo de rutas relativas

- Backend principal: `backend/cmd/server/main.go`
- Handler de wheel: `backend/internal/handlers/wheel_handler.go`
- Frontend App: `frontend/src/App.js`
- Página de análisis: `frontend/src/pages/AnalyticsPage.js`
- Cliente API: `frontend/src/services/api.js`
- Hoja de estilos: `frontend/src/styles/App.css`
- Base de datos local: `data/trades.db`
- Compose: `docker-compose.yml`

### Flujos básicos

1. **Inicio rápido**
   - Clonar repo:
     `git clone git@github.com:Fly4ngler/wheeler-tracker.git`
   - Lanzar todo con Docker Compose:
     `docker-compose up --build`

2. **Desarrollo Backend**
   - `cd backend`
   - `go build && ./backend`

3. **Desarrollo Frontend**
   - `cd frontend`
   - `npm install`
   - `npm start`

### Funcionalidades clave

- Añadir y gestionar portafolios y activos.
- Agregar, cerrar, modificar trades.
- Visualización interactiva: símbolos, analytics, wheels.
- APIs multi-fuente, multi-moneda.
- Ajuste automático de cost-per-share con premiums y coberturas.


