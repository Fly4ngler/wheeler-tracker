# README_Claude - Directivas de Colaboración con IA

Protocolo obligatorio para todas las futuras colaboraciones en desarrollo de código en este proyecto.

---

## 📋 Principios Fundamentales

1. **Nunca modificar sin contexto actual** - Siempre solicitar código existente primero
2. **Analizar dependencias** - Entender relaciones antes de cambiar
3. **Propuesta completa** - Código siempre funcional, nunca parcial
4. **Formato mandatorio** - Usar `sudo cat > /path << 'EOF'` exclusivamente
5. **Verificación requerida** - Validar después de cada cambio

---

## 🔄 Protocolo de Modificación (OBLIGATORIO)

### Paso 1: Solicitar Código Actual

**SIEMPRE comenzar aquí:**

```bash
cat /ruta/al/archivo.go
```

**Por qué:** Garantiza que tenemos el estado exacto actual, evita sobrescrituras accidentales.

---

### Paso 2: Analizar Dependencias

Después de recibir el código, evaluar:

**Checklist de Análisis:**
- [ ] ¿Qué paquetes importa?
- [ ] ¿Qué funciones externas llama?
- [ ] ¿Qué estructuras de datos usa?
- [ ] ¿Cómo maneja errores?
- [ ] ¿Qué archivos lo llaman?
- [ ] ¿Qué dependencias tiene?

---

### Paso 3: Solicitar Contexto Relacionado

Pedir archivos que dependen de este:

```bash
# Si es un handler, ver main.go
cat /ruta/cmd/server/main.go

# Si es un modelo, ver handlers
cat /ruta/internal/handlers/archivo_handler.go

# Si es un servicio, ver qué lo llama
grep -r "MiServicio" /ruta/
```

---

### Paso 4: Proponer Solución COMPLETA

**FORMATO MANDATORIO:**

```bash
sudo cat > /ruta/al/archivo.go << 'EOF'
[CONTENIDO COMPLETO DEL ARCHIVO]
EOF
```

**Reglas NO negociables:**
- ✅ Archivo COMPLETO (no parcial)
- ✅ Usar SIEMPRE `sudo cat > /path << 'EOF'`
- ✅ EOF en línea separada
- ✅ Código funcional (sin TODOs, placeholders)
- ✅ Manejo de errores incluido
- ✅ Comentarios explicativos

---

### Paso 5: Verificar Cambios

Después de cada modificación:

```bash
# Mostrar primeras líneas
cat /ruta/al/archivo.go | head -30

# Para archivos Go: validar formato
go fmt /ruta/al/archivo.go

# Rebuild si es código compilado
sudo docker-compose build --no-cache backend
```

---

## ✅ Checklist Pre-Modificación

**ANTES de proponer cualquier código, confirmar:**

```
□ Solicité el archivo actual con: cat /ruta/archivo
□ Identifiqué TODOS los imports en el archivo
□ Listré TODAS las llamadas a funciones externas
□ Verifiqué qué archivos dependen de este
□ Analicé patrones de manejo de errores
□ Consideré casos límite y excepciones
□ El código es COMPLETO y funcional
□ Planifiqué pasos de verificación
□ Preparé mensaje de commit descriptivo

Solo después de marcar TODOS, procedo a proponer código.
```

---

## 📁 Categorías de Modificación

### Categoría 1: Nuevo Archivo

```bash
# Paso 1: Consultar si existe
ls -la /ruta/archivo.go

# Paso 2: Si no existe, crear con formato completo
sudo cat > /ruta/archivo.go << 'EOF'
[CONTENIDO COMPLETO]
EOF

# Paso 3: Verificar
cat /ruta/archivo.go | head -10
```

### Categoría 2: Actualizar Archivo Existente

```bash
# Paso 1: Ver código actual
cat /ruta/archivo.go

# Paso 2: Analizar dependencias
grep -r "NombreFuncion" /volumen/

# Paso 3: Solicitar archivos relacionados si hace falta
cat /ruta/otro_archivo.go

# Paso 4: Proponer COMPLETO
sudo cat > /ruta/archivo.go << 'EOF'
[ARCHIVO COMPLETO ACTUALIZADO]
EOF

# Paso 5: Verificar
cat /ruta/archivo.go | head -30
```

### Categoría 3: Configuración o Dockerfiles

```bash
# Paso 1: Ver configuración actual
cat /ruta/Dockerfile

# Paso 2: Entender dependencias
cat /ruta/docker-compose.yml

# Paso 3: Backup (importante!)
sudo cp /ruta/Dockerfile /ruta/Dockerfile.backup

# Paso 4: Actualizar
sudo cat > /ruta/Dockerfile << 'EOF'
[DOCKERFILE COMPLETO]
EOF

# Paso 5: Validar diferencias
diff /ruta/Dockerfile.backup /ruta/Dockerfile
```

---

## 🔍 Template de Análisis de Dependencias

Usar este template para cada archivo:

```
Archivo: /ruta/al/archivo.go

IMPORTS:
- [ ] Paquete X usado para: ...
- [ ] Paquete Y usado para: ...

FUNCIONES EXTERNAS LLAMADAS:
- [ ] Función X del paquete Y
- [ ] Función Z del paquete A

ESTRUCTURAS DE DATOS:
- [ ] Usa struct Account de models
- [ ] Usa interface X de services

ACCESO A RECURSOS:
- [ ] Accede a database.DB
- [ ] Llama a API externa X

DEPENDIENTES (qué lo llama):
- [ ] Handler Y lo llama
- [ ] Servicio Z lo llama
- [ ] Main.go lo importa

CAMBIOS PROPUESTOS:
- [ ] Cambio 1: ...
- [ ] Cambio 2: ...
```

---

## 📝 Estándar de Commits Git

Después de verificación exitosa:

```bash
git add archivo_modificado.go
git commit -m "Tipo: Descripción breve

- Cambio específico 1
- Cambio específico 2
- Cambio específico 3

Testing:
- Verificado: Build exitoso
- Verificado: Endpoints responden
- Verificado: No hay logs de error

Dependencias:
- handlers/archivo.go actualizado
- models.go no afectado
"

git push origin main
```

**Tipos válidos:** Feature | Fix | Refactor | Docs | Chore

---

## 🚨 Reglas Absolutas (Sin Excepciones)

1. **NUNCA** modificar archivos sin ver código actual primero
2. **NUNCA** usar `sed`, `awk`, `echo >>` para editar código
3. **NUNCA** proponer código incompleto o con placeholders
4. **NUNCA** ignorar análisis de dependencias
5. **NUNCA** commitear sin verificación previa
6. **NUNCA** usar `tee` con contenido incompleto
7. **NUNCA** modificar múltiples archivos sin verificar interdependencias

---

## 📋 Ejemplo Completo: Actualizar trade_handler.go

### Paso 1: Solicitar

```bash
cat /volume1/docker/wheeler-tracker/backend/internal/handlers/trade_handler.go
```

### Paso 2: Analizar

```
Identificado:
- Imports: gin, models, database
- Funciones: ListTrades, CreateTrade (stubs)
- Dependencias: Llamado por main.go
- Structs: usa models.Trade, sql.DB
```

### Paso 3: Verificar Dependentes

```bash
grep -r "trade_handler" /volume1/docker/wheeler-tracker/backend/
cat /volume1/docker/wheeler-tracker/backend/cmd/server/main.go | grep -A5 "trade"
```

### Paso 4: Ver Modelos

```bash
cat /volume1/docker/wheeler-tracker/backend/internal/models/models.go | grep -A20 "type Trade"
```

### Paso 5: Proponer

```bash
sudo cat > /volume1/docker/wheeler-tracker/backend/internal/handlers/trade_handler.go << 'EOF'
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

// Implementación completa aquí
EOF
```

### Paso 6: Verificar

```bash
cat /volume1/docker/wheeler-tracker/backend/internal/handlers/trade_handler.go | head -30
sudo docker-compose build --no-cache backend
```

### Paso 7: Commit

```bash
git add backend/internal/handlers/trade_handler.go
git commit -m "Feature: Implement trade CRUD handlers

- ListTrades: retorna trades de DB
- CreateTrade: valida e inserta
- UpdateTrade: actualiza con validación
- DeleteTrade: elimina con cascade

Verified: Build OK, API responding correctly
"
git push origin main
```

---

## 💡 Best Practices

### Para Handlers
```go
// ✅ Buen error handling
if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
}

// ✅ Validación de entrada
if trade.Symbol == "" {
    c.JSON(http.StatusBadRequest, gin.H{"error": "symbol required"})
    return
}
```

### Para Servicios
```go
// ✅ Métodos claros
func (s *TradeService) SaveTrade(trade *models.Trade) error {
    // validación
    // lógica
    // persistencia
    return nil
}
```

### Para Modelos
```go
// ✅ Tags JSON completos
type Trade struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
}
```

---

## 🔐 Seguridad

Checklist antes de proponer código:

- [ ] Sin credenciales hardcodeadas
- [ ] Todas las entradas validadas
- [ ] Prevención de SQL injection (queries parametrizadas)
- [ ] CORS bien configurado
- [ ] Errores no exponen info sensible
- [ ] Rate limiting considerado

---

## 📞 Escalación

Si hay dudas sobre:
- **Ubicación**: Pedir path completo
- **Implementación**: Ver código actual con `cat`
- **Dependencias**: Solicitar archivos relacionados
- **Formato**: Referir a este documento

---

**Versión:** 1.0  
**Última actualización:** 2025-11-17  
**Estado:** Activo para TODAS las modificaciones futuras
