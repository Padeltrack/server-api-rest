# Configuración de Ambientes - Padel Track API

## 📋 Resumen

Este proyecto está configurado para soportar múltiples ambientes (desarrollo y producción) mediante archivos de variables de entorno separados.

## 🔧 Estructura de Archivos de Entorno

El proyecto utiliza dos archivos de configuración:

- **`.env_development`** - Variables de entorno para desarrollo local y nube de desarrollo
- **`.env_production`** - Variables de entorno para producción

## 🚀 Scripts Disponibles

### Para Windows (PowerShell/CMD):

```bash
# Desarrollo (con hot-reload)
npm run dev

# Iniciar en modo desarrollo
npm run start

# Iniciar en modo producción
npm run start:prod
```

### Para Linux/Mac:

```bash
# Desarrollo (con hot-reload)
npm run dev:linux

# Iniciar en modo desarrollo
npm run start:linux

# Iniciar en modo producción
npm run start:prod:linux
```

## 📝 Variables de Entorno Requeridas

Cada archivo de entorno debe contener las siguientes variables:

### Server Configuration
```env
PORT=3000
NODE_ENV=development  # o 'production'
```

### Database Configuration
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### Firebase Configuration
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
BUCKET_URL=gs://your-project-id.firebasestorage.app
BASE_STORE_FIREBASE=https://firebasestorage.googleapis.com/v0/b/your-project-id.firebasestorage.app/o
```

### Vimeo Configuration
```env
VIMEO_CLIENT_ID=your_vimeo_client_id
VIMEO_CLIENT_SECRET=your_vimeo_client_secret
VIMEO_ACCESS_TOKEN=your_vimeo_access_token
```

### JWT Configuration
```env
JWT_SECRET=your_jwt_secret_key_here
JWT_SECRET_REFRESH=your_jwt_refresh_secret_key_here
```

### Email Configuration
```env
NODE_MAILER_ROOT_EMAIL=your_email@gmail.com
NODE_MAILER_ROOT_PASS=your_app_password_here
```

### Admin Configuration
```env
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## 🔒 Seguridad

- Los archivos `.env_development` y `.env_production` están incluidos en `.gitignore`
- **NUNCA** commitees estos archivos al repositorio
- Mantén las credenciales de producción seguras y separadas

## 🛠️ Configuración Inicial

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

3. **Verificar archivos de entorno**
   - Asegúrate de tener los archivos `.env_development` y `.env_production` en la raíz del proyecto
   - El archivo `.env_development` ya está configurado para desarrollo
   - Actualiza el archivo `.env_production` con las credenciales de producción

4. **Ejecutar la aplicación**
   ```bash
   # Para desarrollo
   npm run dev

   # Para producción
   npm run start:prod
   ```

## 📊 Sistema de Validación

El sistema automáticamente:
- ✅ Carga el archivo de entorno correcto según `NODE_ENV`
- ✅ Valida que todas las variables críticas estén definidas
- ✅ Muestra mensajes de error claros si falta alguna configuración
- ✅ Previene el inicio de la aplicación si hay errores de configuración

## 🔍 Logs de Inicio

Al iniciar la aplicación, verás:

```
✅ Environment loaded: DEVELOPMENT
📄 Config file: .env_development
✅ All required environment variables are set
🚀 Server running on http://localhost:3000
```

## 📦 Deployment

### Desarrollo en la Nube
Usa las mismas variables que desarrollo local, ajustando solo:
- `MONGO_URI` si usas una base de datos diferente
- `NODE_ENV=development`

### Producción
Asegúrate de:
1. Actualizar todas las variables en `.env_production`
2. Usar credenciales de producción
3. Ejecutar con `npm run start:prod` (o `:prod:linux` en Linux/Mac)

## 🆘 Solución de Problemas

### Error: "Environment file not found"
- Verifica que exista el archivo `.env_development` o `.env_production`
- Verifica que el nombre del archivo sea correcto (con guión bajo)

### Error: "Missing required environment variables"
- Revisa que todas las variables requeridas estén definidas en tu archivo .env
- Compara con la lista de variables requeridas en este documento

### El ambiente no cambia
- Asegúrate de usar el script correcto (`dev`, `start:prod`, etc.)
- Verifica que la variable `NODE_ENV` esté correctamente configurada en el script

## 📞 Soporte

Para más información o problemas, contacta al equipo de desarrollo.

