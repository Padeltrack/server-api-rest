import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { AdsModel, AdsMongoModel } from './ads.model';
import { AdsRegisterSchemaZod, AdsUpdateSchemaZod } from './ads.dto';
import { uploadImagePhotoUser } from './ads.helper';
import { removeFileFirebaseStorage } from '../firebase/firebase.service';
import { StorageFirebaseModel } from '../firebase/firebase.model';
import { getExtensionFromUrl } from '../../shared/util/string.util';

export const getAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'getAds' });
  req.logger.info({ status: 'start' });

  try {
    const ads = await AdsMongoModel.find().sort({ createdAt: 1 });

    return res.status(200).json({ 
      ads,
      message: req.t('ads.list.loaded')
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('errors.fetching'), error });
  }
};

export const createAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'createAds' });
  req.logger.info({ status: 'start' });

  try {
    const { link, imageBase64, active } = AdsRegisterSchemaZod.parse(req.body);

    const lastAd = await AdsMongoModel.findOne().sort({ order: -1 });
    const nextOrder = lastAd ? lastAd.order + 1 : 1;
    const idAds = new ObjectId().toHexString();

    const urlImage = await uploadImagePhotoUser({
      imageBase64,
      idAds,
    });

    const ads = await AdsMongoModel.create({
      _id: idAds,
      urlImage,
      link,
      order: nextOrder,
      active: active || false,
    });

    return res.status(200).json({ 
      ads,
      message: req.t('ads.create.success')
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('validation.validationError'),
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('ads.create.error'), error });
  }
};

export const updateAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'updateAds' });
  req.logger.info({ status: 'start' });

  try {
    const idAds = req.params.id;

    if (!idAds) {
      return res.status(400).json({
        message: req.t('common.idRequired'),
      });
    }

    const getAds = await AdsMongoModel.findOne({ _id: idAds });
    if (!getAds) {
      return res.status(404).json({
        message: req.t('common.notFound'),
      });
    }

    const { link, imageBase64, active } = AdsUpdateSchemaZod.parse(req.body);
    const updateFields: Partial<Pick<AdsModel, 'link' | 'urlImage' | 'active'>> = {};

    if (link) updateFields.link = link;
    if (imageBase64) {
      const urlImage = await uploadImagePhotoUser({
        imageBase64,
        idAds,
      });
      updateFields.urlImage = urlImage;
      await removeFileFirebaseStorage({
        path: `${StorageFirebaseModel.ADS_IMAGE}/${idAds}.${getExtensionFromUrl(getAds.urlImage)}`,
      });
    }
    if (typeof active === 'boolean') updateFields.active = active;

    const ads = await AdsMongoModel.findOneAndUpdate(
      {
        _id: idAds,
      },
      {
        $set: updateFields,
      },
      { new: true },
    );

    return res.status(200).json({
      ads,
      message: req.t('ads.update.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('validation.validationError'),
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('ads.update.error'), error });
  }
};

export const deleteAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'deleteAds' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: req.t('common.idRequired'),
      });
    }

    const ads = await AdsMongoModel.findOne({ _id: id });
    if (!ads) {
      return res.status(404).json({
        message: req.t('common.notFound'),
      });
    }

    await removeFileFirebaseStorage({
      path: `${StorageFirebaseModel.ADS_IMAGE}/${id}.${getExtensionFromUrl(ads.urlImage)}`,
    });
    await AdsMongoModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: req.t('ads.delete.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('ads.delete.error'), error });
  }
};
