import { Response } from 'express';
import { ParamsAuthStrategy } from '.';
import { generateAuthToken, generateAuthRefreshToken } from '../auth.helper';

export const studentsAuthStrategic = async (options: {
  data: ParamsAuthStrategy;
  res: Response;
}) => {
  const { data, res } = options;
  const { user, isPanelAdmin } = data;
  const { _id } = user;

  if (isPanelAdmin) {
    return res.status(403).json({
      message: 'Prohibido',
    });
  }

  const me = {
    user: data.user,
    token: generateAuthToken({ _id }),
    refreshToken: generateAuthRefreshToken({ _id }),
  };

  return res.status(200).json({
    message: 'Login successful',
    me,
  });
};
