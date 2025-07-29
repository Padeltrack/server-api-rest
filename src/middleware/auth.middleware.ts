import { Request, Response, NextFunction } from 'express';
import { UserModel, UserMongoModel } from '../modules/user/user.model';
import { verifyAuthToken } from '../modules/auth/auth.helper';

declare module 'express-serve-static-core' {
  interface Request {
    user: UserModel;
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers['authorization'] as string;
  if (!bearer) {
    return res.status(401).json({ message: 'Token missing' });
  }

  const token = bearer.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = await verifyAuthToken({ token });
    const user = await UserMongoModel.findOne({ _id: decoded._id });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
