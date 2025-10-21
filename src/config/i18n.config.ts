import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import path from 'path';
import fs from 'fs';
import LoggerColor from 'node-color-log';

/**
 * Configuración de i18next para soporte multi-idioma
 * 
 * Idiomas soportados:
 * - es (Español) - Default
 * - en (English)
 * - pt (Português)
 * 
 * El idioma se detecta de:
 * 1. Query parameter: ?lang=es|en|pt
 * 2. Header: Accept-Language
 * 3. Header custom: X-Language
 * 4. Fallback: español (es)
 */

// Cargar traducciones de forma síncrona desde archivos
const loadTranslations = () => {
  const localesPath = path.join(__dirname, '../locales');
  const languages = ['es', 'en', 'pt'];
  const resources: Record<string, any> = {};

  languages.forEach(lang => {
    const filePath = path.join(localesPath, `${lang}.json`);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      resources[lang] = {
        translation: JSON.parse(fileContent)
      };
      LoggerColor.color('cyan').log(`📚 Loaded ${lang}.json`);
    } catch (error) {
      LoggerColor.error(`❌ Error loading ${lang}.json:`, error);
    }
  });

  return resources;
};

// Cargar traducciones
const resources = loadTranslations();

// Inicializar i18next
i18next
  .use(middleware.LanguageDetector)
  .init({
    // Recursos cargados directamente (sin backend asíncrono)
    resources,
    
    // Idiomas soportados
    supportedLngs: ['es', 'en', 'pt'],
    
    // Idioma por defecto
    fallbackLng: 'es',
    lng: 'es',
    
    // Detección del idioma
    detection: {
      order: ['querystring', 'header'],
      lookupQuerystring: 'lang',
      lookupHeader: 'accept-language',
      caches: false,
    },
    
    // Interpolación
    interpolation: {
      escapeValue: false,
      prefix: '{{',
      suffix: '}}',
    },
    
    // Separadores
    keySeparator: '.',
    nsSeparator: false,
    
    // Retornar la key si no encuentra traducción
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
    
    // Logging
    debug: false,
    
    // Comportamiento cuando falta una traducción
    saveMissing: false,
    missingKeyHandler: (lngs, _ns, key) => {
      console.warn(`⚠️  Missing translation: ${key} for language(s): ${lngs.join(', ')}`);
    },
  });

LoggerColor.color('green').log('✅ i18next initialized successfully');
LoggerColor.color('cyan').log(`📚 Available languages: ${i18next.languages.join(', ')}`);

export default i18next;

