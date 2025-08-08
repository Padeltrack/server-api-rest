import { Response } from 'express';
import { ParamsAuthStrategy } from '.';
import { generateAuthToken, generateAuthRefreshToken } from '../auth.helper';

export const coachesAuthStrategic = async (options: {
  data: ParamsAuthStrategy;
  res: Response;
}) => {
  const { data, res } = options;
  const { user, isPanelAdmin } = data;
  const { _id } = user;

  if (!user?.worked && isPanelAdmin) {
    return res.status(401).json({
      message: 'User not verified worked',
    });
  }

  const me = {
    user,
    token: generateAuthToken({ _id }),
    refreshToken: generateAuthRefreshToken({ _id }),
  };

  return res.status(200).json({
    message: 'Login successful',
    me,
  });
};
