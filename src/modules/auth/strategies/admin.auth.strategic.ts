import qrCode from 'qrcode';
import speakeasy from 'speakeasy';

import { ParamsAuthStrategy } from '.';
import { UserMongoModel } from '../../user/user.model';
import { Response } from 'express';

export const adminAuthStrategic = async (option: { data: ParamsAuthStrategy; res: Response }) => {
  const { data, res } = option;
  const { isPanelAdmin, user } = data;

  if (isPanelAdmin && !user.mfaSecret) {
    const secret = speakeasy.generateSecret({
      name: `Padel Track | ${user.email} | ${process.env.NODE_ENV}`,
    }) as any;

    if (secret) {
      const twoFaUrlQr = await qrCode.toDataURL(secret.otpauth_url);
      await UserMongoModel.updateOne({ _id: user._id }, { $set: { mfaSecret: secret.base32 } });

      return res.status(200).json({
        message: 'Verified admin',
        mfaRequired: true,
        twoFaUrlQr,
      });
    }
  }

  return res.status(200).json({
    message: 'Verified admin',
    mfaRequired: true,
  });
};
