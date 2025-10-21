import i18next, { TFunction } from 'i18next';

/**
 * Utilidades para i18n
 */

/**
 * Obtiene la función de traducción para un idioma específico
 * @param language - Código del idioma (es, en, pt)
 * @returns Función de traducción
 */
export const getTranslation = (language: string = 'es'): TFunction => {
  return i18next.getFixedT(language);
};

/**
 * Traduce una key con interpolación
 * @param key - Key de la traducción (ej: "auth.login.success")
 * @param options - Opciones de interpolación
 * @param language - Idioma (opcional, por defecto 'es')
 * @returns Texto traducido
 */
export const translate = (
  key: string,
  options?: Record<string, unknown>,
  language: string = 'es',
): string => {
  const t = getTranslation(language);
  return t(key, options);
};

/**
 * Valida si un idioma está soportado
 * @param language - Código del idioma
 * @returns true si el idioma está soportado
 */
export const isSupportedLanguage = (language: string): boolean => {
  const supportedLanguages = ['es', 'en', 'pt'];
  return supportedLanguages.includes(language);
};

/**
 * Obtiene el idioma de fallback si el solicitado no está soportado
 * @param language - Código del idioma solicitado
 * @returns Código del idioma válido
 */
export const getValidLanguage = (language?: string): string => {
  if (!language) return 'es';
  
  // Extraer código de idioma si viene con región (ej: "es-MX" -> "es")
  const langCode = language.split('-')[0].toLowerCase();
  
  return isSupportedLanguage(langCode) ? langCode : 'es';
};

/**
 * Obtiene el idioma desde múltiples fuentes
 * @param acceptLanguage - Header Accept-Language
 * @param queryLang - Query parameter lang
 * @param customHeader - Header custom X-Language
 * @returns Código del idioma válido
 */
export const detectLanguage = (
  acceptLanguage?: string,
  queryLang?: string,
  customHeader?: string,
): string => {
  // Prioridad: 1. Query param, 2. Custom header, 3. Accept-Language, 4. Fallback
  if (queryLang) {
    return getValidLanguage(queryLang);
  }
  
  if (customHeader) {
    return getValidLanguage(customHeader);
  }
  
  if (acceptLanguage) {
    // Parsear Accept-Language (ej: "en-US,en;q=0.9,es;q=0.8")
    const primaryLang = acceptLanguage.split(',')[0].split(';')[0];
    return getValidLanguage(primaryLang);
  }
  
  return 'es'; // Fallback
};

/**
 * Formatea mensajes de error con contexto
 * @param t - Función de traducción
 * @param errorKey - Key del error
 * @param context - Contexto adicional
 * @returns Mensaje de error formateado
 */
export const formatError = (
  t: TFunction,
  errorKey: string,
  context?: Record<string, unknown>,
): string => {
  const message = t(errorKey, context);
  return message || t('errors.generic');
};

/**
 * Traduce un array de mensajes
 * @param t - Función de traducción
 * @param keys - Array de keys a traducir
 * @returns Array de textos traducidos
 */
export const translateArray = (t: TFunction, keys: string[]): string[] => {
  return keys.map(key => t(key));
};

/**
 * Obtiene todos los idiomas soportados
 * @returns Array de códigos de idioma
 */
export const getSupportedLanguages = (): string[] => {
  return ['es', 'en', 'pt'];
};

/**
 * Obtiene información del idioma
 * @param code - Código del idioma
 * @returns Información del idioma
 */
export const getLanguageInfo = (
  code: string,
): { code: string; name: string; nativeName: string } => {
  const languages: Record<string, { name: string; nativeName: string }> = {
    es: { name: 'Spanish', nativeName: 'Español' },
    en: { name: 'English', nativeName: 'English' },
    pt: { name: 'Portuguese', nativeName: 'Português' },
  };

  return {
    code,
    name: languages[code]?.name || 'Unknown',
    nativeName: languages[code]?.nativeName || 'Unknown',
  };
};

