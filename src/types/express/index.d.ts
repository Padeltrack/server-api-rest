import { UserModel } from '../../modules/user/user.model';
import { TFunction } from 'i18next';

declare global {
  namespace Express {
    interface Request {
      user: UserModel;
      t: TFunction;
      language: string;
      i18n: {
        language: string;
        languages: string[];
        changeLanguage: (lng: string) => Promise<TFunction>;
      };
    }
  }
}
