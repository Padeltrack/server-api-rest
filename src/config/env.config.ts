import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import LoggerColor from 'node-color-log';

/**
 * Configuración de variables de entorno según el ambiente
 * Carga automáticamente el archivo .env correcto basado en NODE_ENV
 */
export const configureEnvironment = (): void => {
  // Obtener el ambiente actual, por defecto 'development'
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Determinar qué archivo .env cargar
  const envFile = nodeEnv === 'production' 
    ? '.env_production' 
    : '.env_development';
  
  const envPath = path.resolve(process.cwd(), envFile);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(envPath)) {
    LoggerColor.error(`❌ Environment file not found: ${envFile}`);
    LoggerColor.warn(`⚠️  Please create ${envFile} file in the root directory`);
    process.exit(1);
  }
  
  // Cargar las variables de entorno
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    LoggerColor.error(`❌ Error loading environment variables from ${envFile}:`, result.error);
    process.exit(1);
  }
  
  // Log del ambiente cargado
  LoggerColor.color('cyan').bold().log(`✅ Environment loaded: ${nodeEnv.toUpperCase()}`);
  
  // Validar variables críticas
  validateRequiredEnvVars();
};

/**
 * Valida que las variables de entorno críticas estén definidas
 */
const validateRequiredEnvVars = (): void => {
  const requiredVars = [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_SECRET_REFRESH',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    LoggerColor.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      LoggerColor.error(`   - ${varName}`);
    });
    process.exit(1);
  }
  
  LoggerColor.color('green').log('✅ All required environment variables are set');
};

/**
 * Obtiene el ambiente actual
 */
export const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};

/**
 * Verifica si estamos en producción
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Verifica si estamos en desarrollo
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

