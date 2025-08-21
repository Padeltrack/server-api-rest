import sgMail, { MailDataRequired } from '@sendgrid/mail';
import LoggerColor from 'node-color-log';

export const sendEMail = (options: { data: MailDataRequired | MailDataRequired[] }) => {
  console.log('key ', process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(`${process.env.SENDGRID_API_KEY}`);
  const name = 'Padel Track';

  if (Array.isArray(options.data)) {
    options.data.forEach(opt => {
      opt.from = {
        email: opt.from as string,
        name,
      };
    });
  } else {
    options.data.from = {
      email: options.data.from as string,
      name,
    };
  }

  sgMail
    .send(options.data)
    .then(() => {
      LoggerColor.bold().bgColor('blue').info('Email enviado con éxito');
    })
    .catch(error => {
      LoggerColor.bold()
        .bgColor('red')
        .error('Error Send Email: ' + error.message);
    });
};
