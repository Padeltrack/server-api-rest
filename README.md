# 🎾 Padel Track API

API REST para la gestión integral de una plataforma de entrenamiento de pádel. Conecta coaches profesionales con estudiantes, gestiona contenido educativo, exámenes, planes de suscripción y seguimiento de progreso.

## 📋 Descripción

Padel Track es una plataforma backend completa que permite:

- **Gestión de usuarios multi-rol**: Administradores, coaches y estudiantes con autenticación JWT
- **Sistema educativo**: Videos instructivos, exámenes, respuestas y seguimiento de progreso
- **Gestión de suscripciones**: Planes de pago, órdenes y gestión de pagos bancarios
- **Contenido multimedia**: Integración con Vimeo para almacenamiento y gestión de videos
- **Sistema de matches**: Seguimiento de partidos y estadísticas
- **Comunicación**: Sistema de notificaciones por email con templates personalizados
- **Publicidad**: Gestión de anuncios y campañas

## 🚀 Stack Tecnológico

### Core
- **Node.js** - Runtime de JavaScript
- **TypeScript** - Tipado estático y mejor DX
- **Express.js** - Framework web minimalista

### Base de Datos
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB con esquemas y validaciones

### Autenticación & Seguridad
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **Speakeasy** - Generación de códigos 2FA/OTP
- **QRCode** - Generación de códigos QR

### Storage & Media
- **Firebase Admin SDK** - Almacenamiento de archivos e imágenes
- **Vimeo API** - Gestión y hosting de videos educativos
- **Multer** - Manejo de uploads multipart/form-data
- **Sharp** - Procesamiento y optimización de imágenes

### Email & Templates
- **Nodemailer** - Envío de correos electrónicos
- **MJML** - Templates de email responsivos
- **Handlebars** - Motor de templates

### Validación & Documentación
- **Zod** - Validación de esquemas y tipos
- **Swagger UI Express** - Documentación interactiva de la API

### Utilidades
- **Node-cron** - Tareas programadas (cron jobs)
- **Pino** - Sistema de logging de alto rendimiento
- **CORS** - Manejo de Cross-Origin Resource Sharing

### Development Tools
- **Nodemon** - Hot-reload en desarrollo
- **ts-node** - Ejecución directa de TypeScript
- **Prettier** - Formateo de código
- **ESLint** - Linting y calidad de código

## 📁 Estructura del Proyecto

```
server-padelTrack/
├── src/
│   ├── app.ts                      # Punto de entrada de la aplicación
│   ├── config/                     # Configuraciones (MongoDB, Firebase, Vimeo, Env)
│   ├── core/
│   │   └── crons/                  # Tareas programadas (cron jobs)
│   ├── middleware/                 # Middlewares (auth, roles, logger, multer)
│   ├── modules/                    # Módulos de la aplicación
│   │   ├── ads/                    # Gestión de anuncios
│   │   ├── auth/                   # Autenticación y estrategias por rol
│   │   ├── bank/                   # Gestión de información bancaria
│   │   ├── exam/                   # Exámenes y respuestas
│   │   ├── firebase/               # Servicios de Firebase
│   │   ├── mail/                   # Sistema de emails con templates
│   │   ├── match/                  # Gestión de partidos
│   │   ├── onboarding/             # Proceso de onboarding
│   │   ├── order/                  # Órdenes y pagos
│   │   ├── plan/                   # Planes de suscripción
│   │   ├── studentCoaches/         # Relación estudiante-coach
│   │   ├── user/                   # Gestión de usuarios
│   │   ├── video/                  # Videos educativos
│   │   ├── vimeo/                  # Integración con Vimeo
│   │   └── weeklyVideo/            # Videos semanales
│   ├── routes/                     # Definición de rutas de la API
│   ├── scripts/                    # Scripts de utilidad y migración
│   ├── shared/                     # Utilidades compartidas
│   ├── swagger/                    # Documentación Swagger
│   └── types/                      # Definiciones de tipos TypeScript
├── public/                         # Recursos estáticos (imágenes, logos)
├── uploads/                        # Archivos subidos temporalmente
├── .env_development                # Variables de entorno - Desarrollo
├── .env_production                 # Variables de entorno - Producción
├── ENV_SETUP.md                    # Documentación de configuración de ambientes
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración de TypeScript
└── nodemon.json                    # Configuración de Nodemon
```

## 🔧 Requisitos Previos

- **Node.js** >= 16.x
- **npm** o **yarn**
- **MongoDB** (local o Atlas)
- **Firebase Project** con Storage habilitado
- **Vimeo Developer Account** con API credentials
- **Gmail Account** para envío de emails (con App Password)

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd server-padelTrack
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   
   Asegúrate de tener configurados los archivos:
   - `.env_development` - Para desarrollo
   - `.env_production` - Para producción

   Consulta el archivo [ENV_SETUP.md](ENV_SETUP.md) para más detalles sobre las variables requeridas.

4. **Configurar Firebase**
   - Descarga el archivo JSON de credenciales de Firebase Admin SDK
   - Configura las variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`

5. **Configurar Vimeo**
   - Crea una aplicación en Vimeo Developer Portal
   - Obtén tus credenciales: Client ID, Client Secret y Access Token
   - Configura las variables correspondientes en el archivo .env

## 🎮 Scripts Disponibles

### Windows (PowerShell/CMD)

```bash
# Desarrollo con hot-reload
npm run dev

# Iniciar servidor en modo desarrollo
npm run start

# Iniciar servidor en modo producción
npm run start:prod

# Formatear código
npm run format

# Verificar formato
npm run format:check

# Ejecutar linter
npm run lint

# Script de carga de datos de ejercicios
npm run execute:uploadVideoData
```

### Linux/Mac

```bash
# Desarrollo con hot-reload
npm run dev:linux

# Iniciar servidor en modo desarrollo
npm run start:linux

# Iniciar servidor en modo producción
npm run start:prod:linux

# Deployment en Railway/Heroku (usa variables del servidor)
npm run start:deploy:linux
```

## 🏗️ Arquitectura

### Patrón de Diseño
El proyecto sigue una arquitectura modular organizada por features:

- **Controllers**: Manejan las peticiones HTTP y respuestas
- **Models**: Definen los esquemas de Mongoose
- **DTOs**: Objetos de transferencia de datos y validaciones
- **Helpers**: Funciones auxiliares y lógica de negocio
- **Services**: Capa de servicios para lógica compleja

### Sistema de Autenticación
- **Estrategias por rol**: Diferentes estrategias de autenticación para admin, coach y student
- **JWT Tokens**: Access token y refresh token
- **Middleware de autorización**: Protección de rutas por roles

### Gestión de Archivos
- **Firebase Storage**: Almacenamiento principal de imágenes y archivos
- **Vimeo**: Hosting y streaming de videos
- **Local uploads**: Procesamiento temporal con Multer y Sharp

### Sistema de Email
- Templates MJML para emails responsivos y profesionales
- Sistema de plantillas modular con layouts y componentes
- Envío automático de notificaciones (bienvenida, confirmaciones, etc.)

## 🔌 Principales Endpoints

```
/api/auth          # Autenticación (login, register, refresh)
/api/users         # Gestión de usuarios
/api/plans         # Planes de suscripción
/api/orders        # Órdenes y pagos
/api/videos        # Videos educativos
/api/vimeo         # Gestión de videos en Vimeo
/api/exams         # Exámenes y evaluaciones
/api/matches       # Partidos y estadísticas
/api/onboarding    # Proceso de onboarding
/api/bank          # Información bancaria
/api/studentcoaches # Relación estudiante-coach
/api/weeklyvideos  # Videos semanales
/api/ads           # Anuncios y publicidad
```

> **Nota**: La documentación completa de la API está disponible en `/api-docs` cuando el servidor está en ejecución (próximamente).

## 🌍 Ambientes

El proyecto soporta múltiples ambientes mediante variables de entorno:

- **Development Local**: Usa `.env_development` para desarrollo local
- **Production Local**: Usa `.env_production` para pruebas de producción local
- **Cloud Deployment (Railway/Heroku)**: Usa variables de entorno configuradas en la plataforma

### Funcionamiento Automático
- Si existe un archivo `.env_development` o `.env_production`, se carga automáticamente
- Si no existe (como en Railway), el sistema usa las variables ya configuradas en el servidor
- El sistema valida que todas las variables críticas estén presentes antes de iniciar

Para más información, consulta [ENV_SETUP.md](ENV_SETUP.md).

## ☁️ Deployment en Railway

Railway configura las variables de entorno directamente en su plataforma, sin necesidad de archivos `.env`:

1. **Conecta tu repositorio** a Railway
2. **Configura las variables de entorno** en el dashboard de Railway:
   - `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_SECRET_REFRESH`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `VIMEO_CLIENT_ID`, `VIMEO_CLIENT_SECRET`, `VIMEO_ACCESS_TOKEN`
   - `NODE_MAILER_ROOT_EMAIL`, `NODE_MAILER_ROOT_PASS`
   - Todas las demás variables requeridas
3. **Configura el comando de inicio** en Railway:
   ```bash
   npm run start:deploy:linux
   ```
4. Railway detectará automáticamente el puerto y desplegará la aplicación

> **Nota**: No necesitas configurar `NODE_ENV` en Railway, el script `start:deploy:linux` funciona sin esta variable.

## 🔐 Seguridad

- ✅ Autenticación JWT con tokens de acceso y refresco
- ✅ Validación de datos con Zod
- ✅ Middleware de autorización por roles
- ✅ Variables de entorno para credenciales sensibles
- ✅ CORS configurado para dominios específicos
- ✅ Validación de emails de administradores
- ✅ 2FA/OTP con Speakeasy

## 🔄 Cron Jobs

El sistema incluye tareas programadas para:
- Verificación de órdenes activas
- Limpieza de archivos temporales
- Procesamiento de pagos pendientes
- Notificaciones automáticas

## 📝 Logging

Sistema de logs implementado con:
- **Pino**: Logs de alto rendimiento en formato JSON
- **Morgan**: Logs de peticiones HTTP
- **Color Log**: Logs visuales en desarrollo

## 🤝 Contribución

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- Usar TypeScript con tipado estricto
- Seguir las reglas de ESLint configuradas
- Formatear código con Prettier antes de commitear
- Escribir nombres descriptivos para variables y funciones
- Documentar funciones complejas con JSDoc

## 📄 Licencia

ISC License - Copyright (c) GandresCoello18

## 👥 Autor

**GandresCoello18**

## 📞 Soporte

Para reportar bugs o solicitar nuevas características, por favor abre un issue en el repositorio.

---

**Nota**: Este es un proyecto en desarrollo activo. Las características y la documentación pueden cambiar.

