# Script de Migración de Planes a Esquema de Traducciones

Este script migra los datos de la colección `plans` del esquema actual al nuevo esquema que soporta traducciones.

## Cambios en el Esquema

### Antes:
```json
{
  "_id": "plan_standard",
  "name": "Infinity! Anual",
  "description": "Con el 50% de descuento",
  "benefits": ["Beneficio 1", "Beneficio 2"],
  "price": 180,
  "active": true,
  "isCoach": false,
  "daysActive": 365
}
```

### Después:
```json
{
  "_id": "plan_standard",
  "price": 180,
  "active": true,
  "isCoach": false,
  "daysActive": 365,
  "translate": {
    "es": {
      "name": "Infinity! Anual",
      "description": "Con el 50% de descuento",
      "benefits": ["Beneficio 1", "Beneficio 2"]
    },
    "en": {
      "name": "",
      "description": "",
      "benefits": []
    },
    "pt": {
      "name": "",
      "description": "",
      "benefits": []
    }
  }
}
```

## Uso del Script

### 1. Ejecutar Migración
```bash
npm run migrate:plans migrate
```

### 2. Verificar Migración
```bash
npm run migrate:plans verify
```

### 3. Rollback (si es necesario)
```bash
npm run migrate:plans rollback
```

## Características del Script

- ✅ **Backup Automático**: Crea un backup de la colección antes de migrar
- ✅ **Migración Segura**: Los datos actuales se mueven a `translate.es`
- ✅ **Estructura Vacía**: `en` y `pt` se inicializan vacíos
- ✅ **Verificación**: Valida que la migración fue exitosa
- ✅ **Rollback**: Permite restaurar desde el backup si es necesario
- ✅ **Logging**: Muestra el progreso detallado de la migración

## Proceso de Migración

1. **Conexión**: Se conecta a MongoDB usando `MONGO_URI`
2. **Backup**: Crea una copia de seguridad con timestamp
3. **Lectura**: Lee todos los planes existentes
4. **Transformación**: Convierte cada plan al nuevo esquema
5. **Migración**: Elimina la colección actual y crea la nueva
6. **Verificación**: Valida que todos los planes tengan la estructura correcta

## Notas Importantes

- ⚠️ **Hacer backup manual** antes de ejecutar en producción
- ⚠️ **Probar en desarrollo** antes de ejecutar en producción
- ⚠️ **Verificar conexión** a MongoDB antes de ejecutar
- ⚠️ **Los datos actuales** se asumen como español (es)

## Estructura de Archivos

```
src/scripts/
├── migratePlansToTranslation.script.ts  # Script principal
└── README_MIGRATION.md                  # Este archivo
```

## Troubleshooting

### Error de Conexión
- Verificar que `MONGO_URI` esté configurado correctamente
- Verificar que MongoDB esté ejecutándose

### Error de Permisos
- Verificar que la aplicación tenga permisos de escritura en la base de datos

### Error de Rollback
- Verificar que exista un backup disponible
- El backup se crea automáticamente con timestamp

## Soporte

Si encuentras algún problema, revisa los logs del script que muestran información detallada del proceso.

