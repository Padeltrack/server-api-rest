import { Response } from 'express';
import { ParamsAuthStrategy } from '.';
import { generateAuthToken, generateAuthRefreshToken } from '../auth.helper';

export const studentsAuthStrategic = async (options: { data: ParamsAuthStrategy, res: Response }) => {
  const { data, res } = options;
  const { _id } = data.user;
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
