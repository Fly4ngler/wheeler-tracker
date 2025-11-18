# 📖 Guía de Uso - Importación CSV de Trades

## 🎯 Descripción General

La nueva funcionalidad de importación CSV permite cargar múltiples trades de una vez, validarlos, editarlos interactivamente y confirmar la importación a la base de datos.

---

## 🚀 Paso a Paso

### 1. Acceder al Panel de Importación

1. Abrir la aplicación: `http://localhost:3000`
2. Ir a: **Administración → Importar Trades desde CSV**

![Imagen: Pestaña de Importación]

---

### 2. Preparar el Archivo CSV

**Formato requerido:**
```
account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date,[close_date],[close_method],[close_price],[fees]
```

**Ejemplo de archivo válido (trades.csv):**
```csv
account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date,close_date,close_method,close_price,fees
3,MSTX,CC,4,11,0.35,2025-11-17,2025-12-19,,,,0
3,BMY,CC,1,48,3.01,2025-11-14,2026-03-26,,,,0
3,BITO,CSP,1,15,0.11,2025-11-14,2025-11-14,2025-11-15,,0.0,0
3,SOFI,CSP,2,25,0.22,2025-11-13,2025-11-21,,,,0
```

**Notas importantes:**
- ✅ Usar `account_id` numérico (ej: 3, no "Principal")
- ✅ Fechas en formato YYYY-MM-DD
- ✅ Campos opcionales pueden estar vacíos
- ✅ Trade_type: CSP, CC, PUT, CALL (mayúsculas)
- ✅ Símbolos en mayúsculas (AAPL, MSFT, etc.)

---

### 3. Cargar el Archivo

1. Hacer clic en **"Seleccionar archivo"**
2. Elegir tu archivo CSV
3. Hacer clic en **"Validar CSV"**

```
┌─────────────────────────────────────┐
│  📁 Seleccionar archivo             │
│  [  Archivo...  ]  [Validar CSV]   │
└─────────────────────────────────────┘
```

---

### 4. Revisar Validación

El sistema validará tu CSV y mostrará:

#### 📊 Resumen de Validación

```
┌──────────────────────────────────────────────┐
│  ✓ Validación completada                     │
│                                              │
│  Total: 15       Seleccionados: 0           │
│  Completos: 7                                │
└──────────────────────────────────────────────┘
```

- **Total:** Número de trades en el CSV
- **Seleccionados:** Trades que marcarás para importar
- **Completos:** Trades con todos los datos requeridos

#### ⚠️ Errores de Parseo

Si hay errores, los verás aquí:
```
⚠️ Errores de parseo:
- Línea 5: Falta account_id
- Línea 8: Fecha inválida (12-30-2025)
```

---

### 5. Tabla Editable - Completar Datos Faltantes

La tabla muestra todos los trades validados. **Edita los campos faltantes:**

```
┌────┬────────┬──────┬──────┬───────┬──────────┬────────────┬────────────┬──────┐
│ ✓  │ Símbolo│ Tipo │ Ctos │ Prima │ Cierre   │ F. Cierre  │ P. Cierre  │ P/L  │
├────┼────────┼──────┼──────┼───────┼──────────┼────────────┼────────────┼──────┤
│ □  │ MSTX   │ CC   │  4   │ 0.35  │ [▼ --]   │ [picker]   │ [0.00  ]   │  -   │
│    │        │      │      │       │ BTC      │ [OPEN  ]   │            │      │
│    │        │      │      │       │ Expired  │            │            │      │
│    │        │      │      │       │ Assigned │            │            │      │
├────┼────────┼──────┼──────┼───────┼──────────┼────────────┼────────────┼──────┤
│ □  │ BMY    │ CC   │  1   │ 3.01  │ [▼ --]   │ [picker]   │ [0.00  ]   │  -   │
└────┴────────┴──────┴──────┴───────┴──────────┴────────────┴────────────┴──────┘
```

#### 📝 Campos Editables:

**1. Método de Cierre (Dropdown)**
```
[Seleccionar]  ← Predeterminado vacío
├─ BTC         ← Buy To Close (compraste para cerrar)
├─ Expired     ← El contrato expiró sin valor
└─ Assigned    ← Te asignaron las acciones
```

**2. Fecha de Cierre (Date Picker)**
- Selecciona una fecha con el calendario
- O haz clic en **[OPEN]** si el trade aún está abierto

**3. Precio de Cierre (Input Numérico)**
- Ingresa el precio por acción
- Decimales permitidos (ej: 0.50, 1.25)

#### 🎯 Estados de Trades:

- **Verde (Completo):** Tiene todos los datos necesarios
- **Rojo (Incompleto):** Falta completar campos

---

### 6. Seleccionar Trades para Importar

1. Marca los **checkboxes** de los trades que quieres importar
2. El contador se actualiza automáticamente

```
┌──────────────────────────────────────────────┐
│  Seleccionados: 5 de 15                     │
│  Completos: 12 de 15                        │
└──────────────────────────────────────────────┘
```

**Tip:** Solo puedes importar trades **completos** (que tengan todos los datos).

---

### 7. Confirmar Importación

1. Hacer clic en **"📥 Confirmar Importación (X selected)"**
2. El sistema enviará los trades al backend
3. Recibirás confirmación:

```
✅ 5 trade(s) importado(s) exitosamente
```

La tabla se cerrará y podrás cargar un nuevo CSV.

---

## 📋 Casos de Uso Comunes

### Caso 1: Trade ABIERTO (Sin fecha de cierre)

```csv
3,AAPL,CC,1,150,1.50,2025-11-17,2025-12-19,,,,0
```

**Edición en tabla:**
- Método Cierre: [Dejar vacío o OPEN]
- Fecha Cierre: [Clic en OPEN]
- Precio Cierre: [Dejar vacío]
- ✅ Trade completado

---

### Caso 2: Trade CERRADO por BTC

```csv
3,MSFT,CC,2,380,2.00,2025-11-10,2025-12-17,,,,0
```

**Edición en tabla:**
- Método Cierre: [Seleccionar "BTC"]
- Fecha Cierre: [Seleccionar 2025-11-16]
- Precio Cierre: [Ingresar 0.75]
- ✅ Trade completado

---

### Caso 3: Trade ASIGNADO (Assigned)

```csv
3,TSLA,CSP,1,250,3.50,2025-11-08,2025-11-15,,,,0
```

**Edición en tabla:**
- Método Cierre: [Seleccionar "Assigned"]
- Fecha Cierre: [Seleccionar 2025-11-15]
- Precio Cierre: [Ingresar 250.00] (precio asignado)
- ✅ Trade completado

---

### Caso 4: Trade EXPIRADO (Expired)

```csv
3,GE,CC,2,16,0.25,2025-11-01,2025-11-15,,,,0
```

**Edición en tabla:**
- Método Cierre: [Seleccionar "Expired"]
- Fecha Cierre: [Seleccionar 2025-11-15]
- Precio Cierre: [Ingresar 0.00]
- ✅ Trade completado

---

## ❌ Errores Comunes y Soluciones

### Error 1: "Por favor selecciona un archivo CSV"
**Problema:** No seleccionaste archivo
**Solución:** Haz clic en "Seleccionar archivo" y elige tu CSV

---

### Error 2: "No valid trades found in CSV"
**Problema:** El `account_id` es texto en lugar de número
**Ejemplo incorrecto:**
```csv
account_id,symbol,...
Principal,AAPL,...   ← ❌ INCORRECTO (texto)
```

**Solución:** Reemplaza con el ID numérico:
```csv
account_id,symbol,...
3,AAPL,...           ← ✅ CORRECTO (número)
```

---

### Error 3: "Fecha inválida"
**Problema:** Formato de fecha incorrecto
**Incorrecto:** 11-17-2025, 17/11/2025
**Correcto:** 2025-11-17 (YYYY-MM-DD)

---

### Error 4: Tabla vacía después de validar
**Problema:** Todos los trades tienen errores de parseo
**Solución:**
1. Revisa los "Errores de parseo" mostrados
2. Corrige el CSV localmente
3. Intenta nuevamente

---

## 💾 Exportar CSV Desde Excel

### Si usas Excel:

1. Crear tabla con encabezados:
   ```
   account_id | symbol | trade_type | ... | close_date | close_method | close_price
   ```

2. Guardar como: **CSV (delimitado por comas) (.csv)**

3. Abrir en editor de texto para verificar:
   - Separadores son comas `,`
   - Fechas están en YYYY-MM-DD
   - No hay caracteres especiales

---

## 🔍 Validación Automática

El sistema valida automáticamente:

| Campo | Validación |
|-------|-----------|
| account_id | Debe existir en BD |
| symbol | No puede estar vacío |
| trade_type | Debe ser CSP, CC, PUT o CALL |
| contracts | Debe ser número positivo |
| strike_price | Debe ser número |
| premium_per_share | Debe ser número |
| open_date | Formato YYYY-MM-DD |
| expiration_date | Debe ser ≥ open_date |
| close_date | Debe ser ≥ open_date (si existe) |
| close_method | BTC, Expired, Assigned, o vacío |
| close_price | Debe ser número ≥ 0 |

---

## 📊 Después de Importar

Una vez importados, tus trades aparecerán en:

1. **Página de Trades:** Listado completo
2. **Dashboard de Analytics:** Incluidos en el P&L
3. **Posiciones:** Agrupados por estado (Open/Closed)

---

## 🆘 Soporte

Si encuentras problemas:

1. Verifica el formato CSV
2. Asegúrate que `account_id` es numérico
3. Revisa los "Errores de parseo" mostrados
4. Intenta con un CSV pequeño primero (2-3 trades)

---

**Última actualización:** 17 Noviembre 2025
**Versión:** 1.0
