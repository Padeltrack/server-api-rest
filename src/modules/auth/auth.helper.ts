// import { MailDataRequired } from '@sendgrid/mail';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import LoggerColor from 'node-color-log';
import {
  TOKEN_JWT_EXPIRES_THREE_DAYS_IN_MS,
  TOKEN_JWT_REFRESH_EXPIRES_SEVEN_DAYS_IN_SECONDS,
} from './auth.constant';
import { UserModel, UserMongoModel } from '../user/user.model';

interface TokenInterface {
  _id: string;
}

export const verifyAuthToken = (options: { token: string; isRefresh?: boolean }) => {
  const { token, isRefresh } = options;

  return jwt.verify(
    token,
    `${isRefresh ? process.env.JWT_SECRET_REFRESH : process.env.JWT_SECRET}`,
    { algorithms: ['HS256'] },
    async (err: TokenExpiredError, decoded: TokenInterface) => {
      if (err) {
        LoggerColor.bold().error(`JWT error: ${err.message}`);
        return null;
      }

      const getUser = await UserMongoModel.findOne({ _id: decoded._id });
      if (!getUser) throw new Error('No existe el usuario');

      getUser.mfaSecret = null;
      return getUser;
    },
  ) as unknown as Promise<UserModel>;
};

export const generateAuthToken = (payload: string | object) => {
  return jwt.sign(payload, `${process.env.JWT_SECRET}`, {
    expiresIn: TOKEN_JWT_EXPIRES_THREE_DAYS_IN_MS,
  });
};

export const generateAuthRefreshToken = (payload: string | object) => {
  return jwt.sign(payload, `${process.env.JWT_SECRET_REFRESH}`, {
    expiresIn: TOKEN_JWT_REFRESH_EXPIRES_SEVEN_DAYS_IN_SECONDS,
  });
};

/*export const notificationRegisterUser = async (options: Pick<UserModel, 'name' | 'email'>) => {
  const { name, email } = options;
  const welcomeEmail = await generateEmail({
    template: 'welcome',
    variables: { name: name || email },
  });

  const msg: MailDataRequired = {
    from: config.ROOT_MAIN,
    to: email,
    subject: 'Bienvenido a Meniuz',
    text: '-',
    html: welcomeEmail,
  };

  sendEMail({ data: msg });
};*/
