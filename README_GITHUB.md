# 🎯 Wheeler Tracker - Trading Options Portfolio Manager

Un gestor completo de portafolio de opciones (Wheel Strategy) con importación CSV, seguimiento de posiciones, análisis de rentabilidad y gestión de cuentas integradas.

## 📊 Características Principales

### ✨ Importación CSV Inteligente (NUEVO - v1.3)
- **Carga y validación** de archivos CSV con feedback en tiempo real
- **Tabla editable interactiva** para completar datos faltantes
- **Campos editables:** Método de cierre, Fecha de cierre, Precio de cierre
- **Estados visuales** para trades completos vs incompletos
- **Confirmación en lotes** antes de importar a la BD

### 📈 Gestión de Trades
- Crear, editar y eliminar trades
- Seguimiento completo del ciclo de vida (Open → Close)
- Cálculo automático de P&L
- Soporte para múltiples tipos: CSP, CC, PUT, CALL

### 💼 Gestión de Cuentas
- Múltiples cuentas/portfolios
- Selección de moneda por cuenta
- Registros de depósitos y retiros
- Seguimiento de saldo

### 🔗 Integración de APIs
- **IBKE API** - Datos de mercado
- **Finnhub API** - Información de tickers
- **Currency Freaks API** - Conversión de monedas
- Panel de administración de configuración

### 📊 Analytics
- Dashboard con métricas clave
- Análisis de rentabilidad por estrategia
- Seguimiento de posiciones abiertas
- Historial de operaciones

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Docker y docker-compose
- Git
- Synology NAS o servidor Linux (opcional)

### Pasos

1. **Clonar repositorio:**
```bash
git clone <tu-repo-url>
cd wheeler-tracker
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales API
```

3. **Iniciar servicios:**
```bash
sudo docker-compose build
sudo docker-compose up -d
```

4. **Acceder a la aplicación:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`

---

## 📁 Estructura del Proyecto

```
wheeler-tracker/
├── backend/                          # API Go/Gin
│   ├── cmd/server/main.go           # Punto de entrada
│   ├── internal/
│   │   ├── database/                # Conexión SQLite
│   │   ├── handlers/                # Endpoints HTTP
│   │   │   ├── trade_import_handler.go    ✨ NUEVO
│   │   │   ├── trade_handler.go
│   │   │   ├── account_handler.go
│   │   │   ├── position_handler.go
│   │   │   ├── income_handler.go
│   │   │   ├── api_handler.go
│   │   │   ├── api_config_handler.go
│   │   │   └── wheel_handler.go
│   │   ├── models/                  # Estructuras de datos
│   │   └── services/                # Lógica de negocio
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/                        # React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ManagementPage.jsx
│   │   │   ├── ManagementTabs/
│   │   │   │   ├── CSVImportTab.jsx        ✨ NUEVO - Importación interactiva
│   │   │   │   ├── AccountsTab.jsx
│   │   │   │   └── APIsTab.jsx
│   │   │   ├── AnalyticsPage.js
│   │   │   ├── TradesPage.js
│   │   │   ├── PositionsPage.js
│   │   │   ├── WheelsPage.js
│   │   │   └── TickerPage.js
│   │   ├── services/api.js          # Cliente HTTP
│   │   └── styles/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── data/
│   └── trades.db                    # Base de datos SQLite
├── logs/                            # Archivos de log
├── docker-compose.yml               # Orquestación
├── .env                             # Variables de entorno
├── README.md                        # Esta documentación
└── README_Claude.md                 # Protocolo de colaboración IA

```

---

## 📡 API Endpoints

### Trades - Importación CSV (NUEVO)

#### Validar CSV
```http
POST /api/v1/trades/validate
Content-Type: multipart/form-data

Request:
- file: <archivo.csv>

Response:
{
  "results": [
    {
      "line_num": 2,
      "trade": {
        "account_id": 3,
        "symbol": "MSTX",
        "trade_type": "CC",
        "contracts": 4,
        "strike_price": 11,
        "premium_per_share": 0.35,
        "open_date": "2025-11-17",
        "expiration_date": "2025-12-19",
        "close_date": null,
        "close_method": null,
        "close_price": null
      },
      "missing_fields": ["close_date", "close_method", "close_price"],
      "is_complete": false
    }
  ],
  "total_records": 15,
  "parse_errors": []
}
```

#### Confirmar Importación
```http
POST /api/v1/trades/confirm
Content-Type: application/json

Request:
{
  "trades": [
    {
      "account_id": 3,
      "symbol": "MSTX",
      "trade_type": "CC",
      "contracts": 4,
      "strike_price": 11,
      "premium_per_share": 0.35,
      "open_date": "2025-11-17",
      "expiration_date": "2025-12-19",
      "close_date": "2025-11-19",
      "close_method": "BTC",
      "close_price": 0.50
    }
  ]
}

Response:
{
  "imported_count": 1,
  "success": true
}
```

### Trades - CRUD Estándar
```
GET    /api/v1/trades              # Listar todos
POST   /api/v1/trades              # Crear
GET    /api/v1/trades/:id          # Obtener por ID
PUT    /api/v1/trades/:id          # Actualizar
DELETE /api/v1/trades/:id          # Eliminar
```

### Cuentas
```
GET    /api/v1/accounts            # Listar
POST   /api/v1/accounts            # Crear
GET    /api/v1/accounts/:id        # Obtener
PUT    /api/v1/accounts/:id        # Actualizar
DELETE /api/v1/accounts/:id        # Eliminar
```

### Posiciones
```
GET    /api/v1/positions           # Activas
GET    /api/v1/positions/closed    # Cerradas
```

### APIs Externas
```
GET    /api/v1/apis                # Listar configuradas
POST   /api/v1/apis                # Guardar
GET    /api/v1/apis/:type          # Obtener por tipo
```

---

## 📊 Formato CSV para Importación

### Encabezado requerido:
```
account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date,[close_date],[close_method],[close_price],[fees]
```

### Ejemplo:
```csv
account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date,close_date,close_method,close_price,fees
3,MSTX,CC,4,11,0.35,2025-11-17,2025-12-19,2025-11-19,BTC,0.50,0
3,BMY,CC,1,48,3.01,2025-11-14,2026-03-26,,,,0
3,BITO,CSP,1,15,0.11,2025-11-14,2025-11-14,2025-11-15,Assigned,0.0,0
```

### Campos:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| account_id | int | ✅ | ID de la cuenta (ej: 3) |
| symbol | string | ✅ | Ticker (ej: MSTX, AAPL) |
| trade_type | string | ✅ | CSP, CC, PUT, CALL |
| contracts | int | ✅ | Número de contratos |
| strike_price | decimal | ✅ | Precio strike |
| premium_per_share | decimal | ✅ | Prima recibida/pagada |
| open_date | date | ✅ | YYYY-MM-DD |
| expiration_date | date | ✅ | YYYY-MM-DD |
| close_date | date | ❌ | Fecha de cierre (opcional) |
| close_method | string | ❌ | BTC, Expired, Assigned, OPEN |
| close_price | decimal | ❌ | Precio de cierre |
| fees | decimal | ❌ | Comisiones |

---

## 🔐 Configuración de APIs Externas

### En el panel de Administración → APIs:

1. **IBKE API**
   - URL: https://api.ibke.com
   - Clave: `tu_api_key_ibke`

2. **Finnhub API**
   - URL: https://finnhub.io/api/v1
   - Clave: `tu_api_key_finnhub`

3. **Currency Freaks API**
   - URL: https://api.currencyfreaks.com
   - Clave: `tu_api_key_currencyfreaks`

---

## 🧪 Testing

### Cargar CSV de ejemplo:
1. Ir a: `http://localhost:3000/management`
2. Pestaña: "Importar Trades desde CSV"
3. Seleccionar archivo CSV
4. Editar campos faltantes en tabla
5. Confirmar importación

---

## 🐛 Troubleshooting

### Error: "No valid trades found in CSV"
**Causa:** `account_id` es texto en lugar de número
**Solución:** Reemplazar valores de texto con números enteros:
```bash
sed -i 's/Principal/3/g' archivo.csv
```

### Error de conexión a Base de Datos
**Solución:** Verificar permisos en `/volume1/docker/wheeler-tracker/data/`:
```bash
sudo chmod 777 /volume1/docker/wheeler-tracker/data/trades.db
```

### Frontend no se actualiza
**Solución:** Reconstruir container:
```bash
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d
```

---

## 📝 Notas de Versión

### v1.3 (17 Noviembre 2025) - CSV Import Enhancement
- ✅ Nueva pestaña de importación CSV interactiva
- ✅ Tabla editable para campos faltantes
- ✅ Validación en dos pasos (validate → confirm)
- ✅ Soporte para trades abiertos y cerrados
- ✅ Indicadores visuales de estado de trades

### v1.2
- Gestión de cuentas
- Integración de APIs externas
- Dashboard de analytics

### v1.1
- CRUD completo de trades
- Seguimiento de posiciones
- Cálculo de P&L

---

## 🤝 Contribuciones

Este proyecto sigue el protocolo de colaboración IA definido en `README_Claude.md`.

**Directivas clave:**
1. Nunca modificar sin contexto actual
2. Solicitar código existente primero
3. Analizar dependencias antes de cambios
4. Proponer código funcional, nunca parcial
5. Usar formato `sudo cat path << 'EOF'` para cambios

---

## 📄 Licencia

Ver archivo LICENSE

---

## 👤 Autor

Desarrollado como sistema de gestión de portafolio de opciones con integración IA.

**Última actualización:** 17 Noviembre 2025
**Versión:** 1.3.0
**Status:** 🟢 Producción
