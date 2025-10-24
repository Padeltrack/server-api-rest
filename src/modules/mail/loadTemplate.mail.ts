import * as fs from 'fs';
import * as path from 'path';
import handlebars from 'handlebars';

import mjml2html from 'mjml';

export const loadTemplate = async (
  templateName: string,
  variables: Record<string, string>,
  language: string = 'es',
) => {
  const templatesPath = path.join(__dirname, './templates/main');
  const templatePath = path.join(templatesPath, language, `${templateName}.mjml`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`El archivo ${templateName}.mjml no existe para el idioma ${language}.`);
  }

  let mjmlContent = await fs.promises.readFile(templatePath, 'utf8');

  // Reemplazar la ruta del footer con la versión por idioma
  const footerPath = `./src/modules/mail/templates/layout/footer/${language}/footer.mjml`;
  mjmlContent = mjmlContent.replace(
    /<mj-include path="\.\/src\/modules\/mail\/templates\/layout\/footer\.mjml" \/>/g,
    `<mj-include path="${footerPath}" />`,
  );

  const template = handlebars.compile(mjmlContent);
  const compiledMjml = template(variables);

  const { html, errors } = mjml2html(compiledMjml);

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
  language?: string;
}) => {
  return await loadTemplate(options.template, options.variables, options.language || 'es');
};
