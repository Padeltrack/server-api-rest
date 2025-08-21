import * as fs from 'fs';
import * as path from 'path';

import mjml2html from 'mjml';

export const loadTemplate = async (templateName: string, variables: Record<string, string>) => {
  const templatesPath = path.join(__dirname, './templates/main');
  const templatePath = path.join(templatesPath, `${templateName}.mjml`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`El archivo ${templateName}.mjml no existe.`);
  }

  let mjmlContent = await fs.promises.readFile(templatePath, 'utf8');

  Object.entries(variables).forEach(([key, value]) => {
    mjmlContent = mjmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  const { html, errors } = mjml2html(mjmlContent);

  if (errors.length) {
    if (errors[0] instanceof Error) {
      throw Error(`Errores en MJML: ${errors[0].message}`);
    }
  }

  return html;
};

export const generateEmail = async (options: {
  template: string;
  variables: Record<string, string>;
}) => {
  return await loadTemplate(options.template, options.variables);
};
