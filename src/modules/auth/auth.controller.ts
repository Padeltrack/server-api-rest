import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import { ObjectId } from 'mongodb';
import { SelectRoleModel, UserMongoModel } from '../user/user.model';
import { GoogleLoginSchemaZod, GoogleRegisterSchemaZod, verifyAdminMfaSchemaZod } from './auth.dto';
import { verifyIdFirebaseTokenGoogle } from '../firebase/firebase.service';
import { ZodError } from 'zod';
import { generateAuthToken } from './auth.helper';
import { generateUniqueUserName } from '../user/user.helper';
import { validateOnboardingAnswers } from '../onboarding/onboarding.helper';
import { selectAuthStrategy } from './strategies';
import { HOST_ADMINS } from '../../shared/util/url.util';
import { getTextBeforeAtEmail } from '../../shared/util/string.util';

export const registerUserWithGoogle = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'auth', serviceHandler: 'registerUserWithGoogle' });
  req.logger.info({ status: 'start' });

  try {
    const {
      idToken,
      birthdate,
      gender,
      role = SelectRoleModel.Student,
      onboarding,
    } = GoogleRegisterSchemaZod.parse(req.body);
    const decodedToken = await verifyIdFirebaseTokenGoogle(idToken);
    const { name: displayName, email, picture = null } = decodedToken;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const countUser = await UserMongoModel.countDocuments({ email });

    if (countUser) {
      return res.status(401).json({
        message: 'User already exists',
        isRegister: true,
      });
    }

    if (!onboarding.length) {
      return res.status(404).json({
        message: 'No onboarding found',
      });
    }

    const { valid, errors } = await validateOnboardingAnswers({ onboarding });
    if (!valid) {
      return res.status(400).json({
        message: 'Invalid onboarding answers',
        errors,
      });
    }

    const user = await UserMongoModel.create({
      _id: new ObjectId().toHexString(),
      displayName: displayName || getTextBeforeAtEmail(email),
      userName: await generateUniqueUserName(displayName || getTextBeforeAtEmail(email)),
      email,
      gender,
      photo: picture,
      birthdate,
      role,
      onboarding: {
        answers: onboarding,
        completedAt: new Date(),
      },
    });

    const me = {
      user: user,
      token: generateAuthToken({ _id: user._id }),
      refreshToken: generateAuthToken({ _id: user._id }),
    };

    return res.status(200).json({
      message: 'Register successful',
      me,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: error.message });
  }
};

export const loginWithGoogle = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'auth', serviceHandler: 'loginWithGoogle' });
  req.logger.info({ status: 'start' });

  try {
    const { idToken } = GoogleLoginSchemaZod.parse(req.body);
    const { email } = await verifyIdFirebaseTokenGoogle(idToken);
    const origin = req.headers['origin'] || '';
    let isPanelAdmin = false;

    if (HOST_ADMINS.includes(origin)) {
      isPanelAdmin = true;
    }

    if (!email) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const getUser = await UserMongoModel.findOne({ email });

    if (!getUser) {
      return res.status(404).json({
        message: 'User not found',
        isRegister: false,
      });
    }

    const authStrategy = selectAuthStrategy(getUser.role);
    const responseAuthStrategy = await authStrategy({ data: { user: getUser, isPanelAdmin }, res });

    return responseAuthStrategy;
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: error.message });
  }
};

export const verifyAdminMfa = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'auth', serviceHandler: 'verifyAdminMfa' });
  req.logger.info({ status: 'start' });

  try {
    const { idToken, code } = verifyAdminMfaSchemaZod.parse(req.body);
    const decodedToken = await verifyIdFirebaseTokenGoogle(idToken);
    const { email } = decodedToken;

    if (!email) {
      return res.status(404).json({
        message: 'User not found',
        isRegister: true,
      });
    }

    const getUser = await UserMongoModel.findOne({ email });

    if (!getUser?.mfaSecret) {
      return res.status(401).json({
        message: 'User not admin',
      });
    }

    if (![SelectRoleModel.Admin, SelectRoleModel.SuperAdmin].includes(getUser.role as any)) {
      return res.status(401).json({
        message: 'User not admin',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: getUser.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 4,
    });

    if (!verified) {
      return res.status(401).json({
        message: 'Invalid code',
      });
    }

    getUser.mfaSecret = null;
    const me = {
      user: getUser,
      token: generateAuthToken({ _id: getUser._id }),
      refreshToken: generateAuthToken({ _id: getUser._id }),
    };

    return res.status(200).json({
      message: 'Login successful',
      me,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: error.message });
  }
};
