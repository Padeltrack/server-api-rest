import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { BankMongoModel } from './bank.model';
import { BankRegisterSchemaZod, BankUpdateSchemaZod } from './bank.zod';

export const getBanks = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'getBanks' });
  req.logger.info({ status: 'start' });

  try {
    const banks = await BankMongoModel.find().sort({ createdAt: 1 });

    return res.status(200).json({ banks });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching banks', error });
  }
};

export const createBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'createBank' });
  req.logger.info({ status: 'start' });

  try {
    const { name, typeAccount, numberAccount, nameAccount, dniAccount } = BankRegisterSchemaZod.parse(req.body);

    const bank = await BankMongoModel.create({
        _id: new ObjectId().toHexString(),
        name,
        typeAccount,
        numberAccount,
        nameAccount,
        dniAccount,
    });

    return res.status(200).json({ bank });
  } catch (error) {
    if (error instanceof ZodError) {
        return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
        });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating bank', error });
  }
};

export const updateBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'createBank' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;
    const { name, typeAccount, numberAccount, nameAccount } = BankUpdateSchemaZod.parse(req.body);

    if (!_id) {
        return res.status(404).json({
            message: 'Not found id bank',
        });
    }

    const fields: any = {};

    if (name) fields.name = name;
    if (typeAccount) fields.typeAccount = typeAccount;
    if (numberAccount) fields.numberAccount = numberAccount;
    if (nameAccount) fields.nameAccount = nameAccount;

    const bank = await BankMongoModel.findOneAndUpdate(
      { _id: req.params.id },
      fields,
      { new: true }
    );

    return res.status(200).json({ bank });
  } catch (error) {
    if (error instanceof ZodError) {
        return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
        });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error updating bank', error });
  }
};

export const deleteBank = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'bank', serviceHandler: 'deleteBank' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: 'Not found id bank',
        });
    }
    
    await BankMongoModel.deleteOne({ _id: id });

    return res.status(200).json({
        message: 'Bank deleted successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating bank', error });
  }
};
