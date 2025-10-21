import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { BankMongoModel } from './bank.model';
import { BankRegisterSchemaZod, BankUpdateSchemaZod } from './bank.zod';
import { formatZodErrorResponse } from '../../shared/util/zod.util';

export const getBanks = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'getBanks' });
  req.logger.info({ status: 'start' });

  try {
    const banks = await BankMongoModel.find().sort({ createdAt: 1 });

    return res.status(200).json({
      banks,
      message: req.t('common.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('errors.fetching'), error });
  }
};

export const createBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'createBank' });
  req.logger.info({ status: 'start' });

  try {
    const { name, typeAccount, numberAccount, nameAccount, dniAccount } =
      BankRegisterSchemaZod.parse(req.body);

    const getBank = await BankMongoModel.findOne({ numberAccount });
    if (getBank) {
      return res.status(400).json({
        message: req.t('errors.conflict'),
      });
    }

    const bank = await BankMongoModel.create({
      _id: new ObjectId().toHexString(),
      name,
      typeAccount,
      numberAccount,
      nameAccount,
      dniAccount,
    });

    return res.status(200).json({
      bank,
      message: req.t('bank.create.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('bank.create.error'), error });
  }
};

export const updateBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'createBank' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;
    const { name, typeAccount, numberAccount, nameAccount, dniAccount } = BankUpdateSchemaZod.parse(
      req.body,
    );

    if (!_id) {
      return res.status(404).json({
        message: req.t('common.idRequired'),
      });
    }

    const fields: any = {};

    if (name) fields.name = name;
    if (typeAccount) fields.typeAccount = typeAccount;
    if (numberAccount) fields.numberAccount = numberAccount;
    if (nameAccount) fields.nameAccount = nameAccount;
    if (dniAccount) fields.dniAccount = dniAccount;

    const bank = await BankMongoModel.findOneAndUpdate({ _id: req.params.id }, fields, {
      new: true,
    });

    if (!bank) {
      return res.status(404).json({
        message: req.t('common.notFound'),
      });
    }

    return res.status(200).json({
      bank,
      message: req.t('bank.update.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('bank.update.error'), error });
  }
};

export const deleteBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'deleteBank' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({
        message: req.t('common.idRequired'),
      });
    }

    const bank = await BankMongoModel.findOne({ _id: id });
    if (!bank) {
      return res.status(404).json({
        message: req.t('common.notFound'),
      });
    }

    await BankMongoModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: req.t('common.deleted'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('errors.deleting'), error });
  }
};
