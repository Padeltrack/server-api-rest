import { TFunction } from 'i18next';
import { ZodError, ZodIssue } from 'zod';

/**
 * Utilidades para traducir errores de Zod con i18n
 */

/**
 * Interfaz para error de validación formateado
 */
export interface FormattedZodError {
  field: string;
  message: string;
  code: string;
}

/**
 * Traduce un error de Zod completo
 * @param error - Error de Zod
 * @param t - Función de traducción
 * @returns Array de errores formateados y traducidos
 */
export const translateZodError = (error: ZodError, t: TFunction): FormattedZodError[] => {
  return error.errors.map((issue: ZodIssue) => {
    const field = issue.path.join('.');
    let message = issue.message;

    // Si el mensaje es una key de traducción (contiene '.'), traducir
    if (message.includes('.')) {
      message = t(message) || message;
    } else {
      // Traducir mensajes estándar de Zod basados en el code
      message = translateZodIssueByCode(issue, t);
    }

    return {
      field,
      message,
      code: issue.code,
    };
  });
};

/**
 * Traduce un issue de Zod basado en su código
 * @param issue - Issue de Zod
 * @param t - Función de traducción
 * @returns Mensaje traducido
 */
const translateZodIssueByCode = (issue: ZodIssue, t: TFunction): string => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') {
        return t('validation.required');
      }
      return t('validation.invalidFormat');

    case 'too_small':
      if (issue.type === 'string') {
        return t('validation.minLength', { length: issue.minimum });
      }
      return t('validation.min', { min: issue.minimum });

    case 'too_big':
      if (issue.type === 'string') {
        return t('validation.maxLength', { length: issue.maximum });
      }
      return t('validation.max', { max: issue.maximum });

    case 'invalid_string':
      if (issue.validation === 'email') {
        return t('validation.email');
      }
      if (issue.validation === 'url') {
        return t('validation.url');
      }
      return t('validation.invalidFormat');

    case 'custom':
      // Si es un mensaje personalizado que es una key de traducción
      if (issue.message && issue.message.includes('.')) {
        return t(issue.message);
      }
      return issue.message || t('validation.invalidFormat');

    default:
      return issue.message || t('validation.invalidFormat');
  }
};

/**
 * Crea un objeto de respuesta de error estándar para errores de Zod
 * @param error - Error de Zod
 * @param t - Función de traducción
 * @returns Objeto con mensaje y errores formateados
 */
export const formatZodErrorResponse = (error: ZodError, t: TFunction) => {
  return {
    message: t('validation.validationError'),
    errors: translateZodError(error, t),
  };
};

/**
 * Mensajes de error personalizados para Zod en español
 * Estos se traducirán automáticamente por el sistema
 */
export const zodErrorMessages = {
  required: 'validation.required',
  email: 'validation.email',
  url: 'validation.url',
  minLength: (_min: number) => `validation.minLength`,
  maxLength: (_max: number) => `validation.maxLength`,
  min: (_min: number) => `validation.min`,
  max: (_max: number) => `validation.max`,
  positive: 'validation.positive',
  integer: 'validation.integer',
  invalidFormat: 'validation.invalidFormat',
};
