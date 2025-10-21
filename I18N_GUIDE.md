# 🌍 Guía de Internacionalización (i18n)

## 📚 Descripción

Este proyecto soporta **múltiples idiomas** usando **i18next**. Los usuarios pueden interactuar con la API en español, inglés o portugués.

## 🗣️ Idiomas Soportados

- **es** (Español) - Idioma por defecto
- **en** (English) - Inglés
- **pt** (Português) - Portugués

## 📁 Estructura de Archivos

```
src/
├── config/
│   └── i18n.config.ts          # Configuración de i18next
├── locales/                     # Traducciones
│   ├── es.json                  # Español (completo)
│   ├── en.json                  # Inglés
│   └── pt.json                  # Portugués
├── shared/
│   └── util/
│       └── i18n.util.ts         # Utilidades helper
└── types/
    └── express/
        └── index.d.ts           # Tipos TypeScript (req.t)
```

## 🎯 Detección Automática del Idioma

El sistema detecta el idioma automáticamente en este orden de prioridad:

### 1. Query Parameter (Más Alta Prioridad)
```bash
GET /api/users?lang=en
GET /api/users?lang=es
GET /api/users?lang=pt
```

### 2. Header Custom
```bash
curl -H "X-Language: en" http://localhost:3000/api/users
```

### 3. Header Accept-Language
```bash
curl -H "Accept-Language: en-US,en;q=0.9" http://localhost:3000/api/users
```

### 4. Fallback
Si no se especifica ningún idioma, se usa **español (es)** por defecto.

## 💻 Uso en Controllers

### Ejemplo Básico

```typescript
import { Request, Response } from 'express';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find();
    
    return res.status(200).json({
      message: req.t('users.list.loaded'),  // Traduce según el idioma del cliente
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

### Con Interpolación de Variables

```typescript
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.create(req.body);
    
    return res.status(201).json({
      message: req.t('auth.register.welcome', { name: user.name }),
      // ES: "Bienvenido a Padel Track, Juan!"
      // EN: "Welcome to Padel Track, Juan!"
      // PT: "Bem-vindo ao Padel Track, Juan!"
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

### Ejemplo con Pluralización

```typescript
export const getOrdersCount = async (req: Request, res: Response) => {
  try {
    const count = await OrderModel.countDocuments({ userId: req.user._id });
    
    return res.status(200).json({
      message: req.t('orders.count', { count }),
      // count: 1 -> "1 pedido" / "1 order" / "1 pedido"
      // count: 5 -> "5 pedidos" / "5 orders" / "5 pedidos"
      count
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

### Validaciones con i18n

```typescript
import { z } from 'zod';

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Validación con mensajes traducidos
  if (!email) {
    return res.status(400).json({
      message: req.t('auth.login.emailRequired')
    });
  }
  
  if (!password) {
    return res.status(400).json({
      message: req.t('auth.login.passwordRequired')
    });
  }
  
  // ... lógica de login
};
```

## 🔧 Utilidades Helper

### `getTranslation(language)`
Obtiene la función de traducción para un idioma específico:

```typescript
import { getTranslation } from '../shared/util/i18n.util';

const t = getTranslation('en');
const message = t('auth.login.success');
```

### `translate(key, options, language)`
Traduce directamente sin request:

```typescript
import { translate } from '../shared/util/i18n.util';

const message = translate('users.create.success', { name: 'Juan' }, 'es');
// "Usuario creado exitosamente"
```

### `detectLanguage(acceptLanguage, queryLang, customHeader)`
Detecta el idioma desde múltiples fuentes:

```typescript
import { detectLanguage } from '../shared/util/i18n.util';

const language = detectLanguage(
  req.headers['accept-language'],
  req.query.lang as string,
  req.headers['x-language'] as string
);
```

### `isSupportedLanguage(language)`
Valida si un idioma está soportado:

```typescript
import { isSupportedLanguage } from '../shared/util/i18n.util';

if (isSupportedLanguage('fr')) {
  // false - francés no está soportado
}
```

### `getLanguageInfo(code)`
Obtiene información del idioma:

```typescript
import { getLanguageInfo } from '../shared/util/i18n.util';

const info = getLanguageInfo('es');
// { code: 'es', name: 'Spanish', nativeName: 'Español' }
```

## 📧 Uso en Emails

Para emails con templates MJML, puedes usar las traducciones:

```typescript
import { getTranslation } from '../shared/util/i18n.util';
import { sendEmail } from '../modules/mail/sendTemplate.mail';

export const sendWelcomeEmail = async (user: UserModel, language: string = 'es') => {
  const t = getTranslation(language);
  
  await sendEmail({
    to: user.email,
    subject: t('emails.welcome.subject'),
    template: 'welcome',
    data: {
      title: t('emails.welcome.title', { name: user.name }),
      message: t('emails.welcome.message')
    }
  });
};
```

## 📝 Estructura de Keys en JSON

Las traducciones están organizadas jerárquicamente:

```json
{
  "module": {
    "action": {
      "result": "Texto traducido"
    }
  }
}
```

### Ejemplos de Keys:

```typescript
// Autenticación
req.t('auth.login.success')
req.t('auth.register.emailExists')
req.t('auth.password.resetSuccess')

// Usuarios
req.t('users.create.success')
req.t('users.profile.updated')
req.t('users.role.admin')

// Órdenes
req.t('orders.payment.completed')
req.t('orders.status.active')
req.t('orders.cancel.success')

// Validaciones
req.t('validation.required')
req.t('validation.email')
req.t('validation.minLength', { length: 8 })

// Errores
req.t('errors.notFound')
req.t('errors.unauthorized')
req.t('errors.serverError')
```

## 🌐 Cambiar Idioma Dinámicamente

### Desde el Frontend

**Con Query Parameter:**
```javascript
// Axios
axios.get('/api/users?lang=en')

// Fetch
fetch('/api/users?lang=en')
```

**Con Header:**
```javascript
// Axios
axios.get('/api/users', {
  headers: { 'X-Language': 'en' }
})

// Fetch
fetch('/api/users', {
  headers: { 'X-Language': 'en' }
})
```

### Desde Postman/Insomnia

**Query Parameter:**
```
GET http://localhost:3000/api/users?lang=en
```

**Header:**
```
X-Language: en
```

**Accept-Language:**
```
Accept-Language: en-US
```

## ➕ Agregar Nuevas Traducciones

### 1. Agregar la Key en los 3 Archivos

**src/locales/es.json:**
```json
{
  "myModule": {
    "myAction": {
      "success": "Operación exitosa"
    }
  }
}
```

**src/locales/en.json:**
```json
{
  "myModule": {
    "myAction": {
      "success": "Operation successful"
    }
  }
}
```

**src/locales/pt.json:**
```json
{
  "myModule": {
    "myAction": {
      "success": "Operação bem-sucedida"
    }
  }
}
```

### 2. Usar en el Controller

```typescript
export const myController = async (req: Request, res: Response) => {
  return res.status(200).json({
    message: req.t('myModule.myAction.success')
  });
};
```

## 🔍 Debugging

### Ver el Idioma Detectado

```typescript
export const debugLanguage = (req: Request, res: Response) => {
  return res.json({
    detectedLanguage: req.language,
    availableLanguages: req.i18n.languages,
    allTranslations: {
      es: req.t('common.success', { lng: 'es' }),
      en: req.t('common.success', { lng: 'en' }),
      pt: req.t('common.success', { lng: 'pt' })
    }
  });
};
```

### Logs en Desarrollo

En modo desarrollo (`NODE_ENV=development`), i18next mostrará logs detallados:
- Keys faltantes
- Idiomas detectados
- Errores de interpolación

## ⚡ Mejores Prácticas

1. **Siempre usar `req.t()`** en lugar de strings hardcodeados
2. **Mantener consistencia** en la estructura de keys entre idiomas
3. **Usar interpolación** para valores dinámicos: `{{ variable }}`
4. **Keys descriptivas**: `auth.login.success` mejor que `als`
5. **Agrupar por módulo**: Todas las traducciones de auth juntas
6. **Probar en los 3 idiomas** antes de hacer deploy
7. **Documentar keys nuevas** si agregan funcionalidad importante

## 📊 Cobertura de Traducciones

### Módulos Traducidos:
- ✅ **common** - Mensajes comunes
- ✅ **auth** - Autenticación y autorización
- ✅ **users** - Gestión de usuarios
- ✅ **orders** - Órdenes y pagos
- ✅ **plans** - Planes de suscripción
- ✅ **exams** - Exámenes y evaluaciones
- ✅ **videos** - Videos educativos
- ✅ **matches** - Partidos y estadísticas
- ✅ **onboarding** - Proceso de onboarding
- ✅ **bank** - Información bancaria
- ✅ **coaches** - Relación coach-estudiante
- ✅ **ads** - Publicidad
- ✅ **emails** - Templates de email
- ✅ **validation** - Mensajes de validación
- ✅ **errors** - Mensajes de error

## 🚀 Próximos Pasos

Para agregar soporte para un nuevo idioma (ej: francés):

1. Crear `src/locales/fr.json` con todas las traducciones
2. Agregar 'fr' al array `supportedLngs` en `src/config/i18n.config.ts`
3. Actualizar `getSupportedLanguages()` en `src/shared/util/i18n.util.ts`
4. Agregar información del idioma en `getLanguageInfo()`

## 📞 Soporte

Si encuentras una traducción faltante o incorrecta:
1. Verifica que la key existe en los 3 archivos JSON
2. Revisa la consola por warnings de i18next
3. Usa `req.t()` correctamente con la estructura jerárquica

---

**¡Ahora tu API habla 3 idiomas!** 🌍🎉

