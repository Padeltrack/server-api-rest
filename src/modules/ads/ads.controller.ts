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

    return res.status(200).json({ ads });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching ads', error });
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

    return res.status(200).json({ ads });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error creating ads', error });
  }
};

export const updateAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'updateAds' });
  req.logger.info({ status: 'start' });

  try {
    const idAds = req.params.id;

    if (!idAds) {
      return res.status(400).json({
        message: 'Id is required',
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
        message: 'Ads updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching ads', error });
  }
};

export const deleteAds = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'ads', serviceHandler: 'deleteAds' });
  req.logger.info({ status: 'start' });

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Id is required',
      });
    }

    const ads = await AdsMongoModel.findOne({ _id: id });
    if (!ads) {
      return res.status(404).json({
        message: 'Ads not found',
      });
    }

    await removeFileFirebaseStorage({ path: `${StorageFirebaseModel.ADS_IMAGE}/${id}.${getExtensionFromUrl(ads.urlImage)}` });
    await AdsMongoModel.deleteOne({ _id: id });

    return res.status(200).json({
      message: 'Ads deleted successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error removing ads', error });
  }
};
