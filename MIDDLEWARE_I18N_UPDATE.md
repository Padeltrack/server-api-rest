# 🛡️ Middlewares Actualizados con i18n

## ✅ Middlewares Actualizados

### 1. **auth.middleware.ts** - Autenticación
Actualizado para usar traducciones en la validación de tokens JWT.

**Cambios:**
```typescript
// ❌ Antes
return res.status(401).json({ message: 'Token missing' });
return res.status(401).json({ message: 'Usuario no encontrado' });
return res.status(401).json({ message: 'Invalid token' });

// ✅ Ahora
return res.status(401).json({ message: req.t('auth.token.missing') });
return res.status(401).json({ message: req.t('users.profile.notFound') });
return res.status(401).json({ message: req.t('auth.token.invalid') });
```

**Keys usadas:**
- `auth.token.missing` - "Token no proporcionado"
- `auth.token.invalid` - "Token inválido"
- `users.profile.notFound` - "Usuario no encontrado"

**Traducciones:**
- 🇪🇸 ES: "Token no proporcionado" / "Token inválido" / "Usuario no encontrado"
- 🇬🇧 EN: "Token not provided" / "Invalid token" / "User not found"
- 🇧🇷 PT: "Token não fornecido" / "Token inválido" / "Usuário não encontrado"

---

### 2. **roles.middleware.ts** - Autorización por Roles
Actualizado para verificación de permisos por roles.

**Cambios:**
```typescript
// ❌ Antes
return res.status(403).json({ message: 'Access denied' });

// ✅ Ahora
return res.status(403).json({ message: req.t('errors.forbidden') });
```

**Keys usadas:**
- `errors.forbidden` - "Acceso prohibido"

**Traducciones:**
- 🇪🇸 ES: "Acceso denegado"
- 🇬🇧 EN: "Access denied"
- 🇧🇷 PT: "Acesso negado"

---

### 3. **orderActive.middleware.ts** - Validación de Órdenes Activas
Actualizado para verificar órdenes activas con mensajes traducidos.

**Funciones Actualizadas:**
- `activeOrder` - Orden activa de estudiante/coach
- `activeOrderCoachCenter` - Orden activa específica de coach

**Cambios:**
```typescript
// ❌ Antes
return res.status(403).json({ message: 'Access denied' });
res.status(401).json({ message: 'Order not active' });

// ✅ Ahora
return res.status(403).json({ message: req.t('errors.forbidden') });
res.status(401).json({ message: req.t('errors.unauthorized') });
```

**Keys usadas:**
- `errors.forbidden` - "Acceso denegado"
- `errors.unauthorized` - "No autorizado"

**Traducciones:**
- 🇪🇸 ES: "Acceso denegado" / "No autorizado"
- 🇬🇧 EN: "Access denied" / "Unauthorized"
- 🇧🇷 PT: "Acesso negado" / "Não autorizado"

---

### 4. **errorHandler.middleware.ts** - Manejo Global de Errores
Actualizado el handler global para errores no capturados.

**Cambios:**
```typescript
// ❌ Antes
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
};

// ✅ Ahora
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: req.t('errors.serverError') });
};
```

**Keys usadas:**
- `errors.serverError` - "Error interno del servidor"

**Traducciones:**
- 🇪🇸 ES: "Error interno del servidor"
- 🇬🇧 EN: "Internal server error"
- 🇧🇷 PT: "Erro interno do servidor"

---

## 🧪 Pruebas de Middlewares

### 1. Probar Autenticación sin Token

```bash
# Sin token
curl http://localhost:3000/api/users

# Español (default)
# Response: { "message": "Token no proporcionado" }

# Inglés
curl http://localhost:3000/api/users?lang=en
# Response: { "message": "Token not provided" }

# Portugués
curl http://localhost:3000/api/users?lang=pt
# Response: { "message": "Token não fornecido" }
```

### 2. Probar Token Inválido

```bash
curl -H "Authorization: Bearer token_invalido" http://localhost:3000/api/users?lang=en
# Response: { "message": "Invalid token" }
```

### 3. Probar Acceso sin Permisos

```bash
# Intentar acceder a ruta de admin siendo student
curl -H "Authorization: Bearer <student_token>" http://localhost:3000/api/admin/users?lang=pt
# Response: { "message": "Acesso negado" }
```

### 4. Probar Orden No Activa

```bash
# Sin orden activa
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/videos?lang=en
# Response: { "message": "Access denied" }
```

## 📊 Resumen de Cambios

| Middleware | Mensajes Actualizados | Estado |
|------------|----------------------|---------|
| ✅ auth.middleware.ts | 3 mensajes | Completo |
| ✅ roles.middleware.ts | 1 mensaje | Completo |
| ✅ orderActive.middleware.ts | 2 mensajes (x2 funciones) | Completo |
| ✅ errorHandler.middleware.ts | 1 mensaje | Completo |

**Total: 4 middlewares = 7+ mensajes traducidos**

## ✨ Beneficios

1. **Experiencia de usuario consistente** - Mensajes de error en el idioma preferido
2. **Seguridad mejorada** - Mensajes de autenticación claros en cualquier idioma
3. **Debugging más fácil** - Errores comprensibles para usuarios internacionales
4. **Profesionalismo** - API completamente multilingüe

## 🔒 Casos de Uso Cubiertos

### Autenticación (auth.middleware.ts)
- ✅ Token faltante
- ✅ Token inválido
- ✅ Usuario no encontrado

### Autorización (roles.middleware.ts)
- ✅ Acceso denegado por rol

### Órdenes Activas (orderActive.middleware.ts)
- ✅ No tiene orden activa
- ✅ No es coach
- ✅ Acceso denegado

### Error Handler Global (errorHandler.middleware.ts)
- ✅ Errores no capturados

## 📝 Notas Importantes

1. **i18n debe estar antes de los middlewares** en app.ts
2. **req.t() está disponible** en todos los middlewares después de i18n
3. **Todos los mensajes mantienen los códigos HTTP correctos** (401, 403, 500)
4. **No hay breaking changes** - La API sigue funcionando igual

## 🧭 Orden de Middlewares en app.ts

```typescript
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

// ← i18n ANTES de las rutas
app.use(middleware.handle(i18next));

app.use(serverImagesStaticAssets());

// ← Rutas con middlewares que usan req.t()
app.use('/api', logger, [
  // Estas rutas usan authenticate, authorize, activeOrder
  userRoutes,
  orderRoutes,
  // etc.
]);

// ← Error handler global al final
app.use(errorHandler);
```

## ✅ Verificación

- ✅ No hay errores de linting
- ✅ TypeScript compila correctamente
- ✅ i18next carga antes de los middlewares
- ✅ req.t() disponible en todos los middlewares
- ✅ Mensajes coherentes con el resto de la API

---

**Estado:** 🟢 **Middlewares Completamente Multilingües**

