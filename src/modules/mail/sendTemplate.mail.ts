import nodemailer from 'nodemailer';
import LoggerColor from 'node-color-log';

export const sendEMail = (options: { data: any }) => {
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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      pass: `${process.env.NODE_MAILER_ROOT_PASS}`,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
    },
  });

  transporter.sendMail(options.data, (error, info) => {
    if (error) {
      LoggerColor.bold()
        .bgColor('red')
        .error('Error Send Email: ' + error.message);
      return;
    }
    LoggerColor.bold()
      .bgColor('blue')
      .info('Email enviado con éxito ' + info.response);
  });
};
