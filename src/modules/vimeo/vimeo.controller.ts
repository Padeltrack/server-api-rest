import { Request, Response } from 'express';
import { vimeoClient } from '../../config/vimeo.config';
import {
  deleteVimeoVideo,
  extractBufferToFileThumbnail,
  getInfoPublicExtractVimeoVideoById,
  updateVideoToVimeo,
  uploadVideoToVimeo,
} from './vimeo.helper';
import { ObjectId } from 'mongodb';
import { updateVideoToFolderVimeoSchemaZod, uploadVideoToFolderVimeoSchemaZod } from './vimeo.dto';
import { ZodError } from 'zod';
import { VideoMongoModel } from '../video/video.model';
import { freeFolder } from './viemo.constant';
import { cleanUploadedFiles } from '../../middleware/multer.middleware';

export const uploadVideoToFolderVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'uploadVideoToFolderVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const { folderId, name, description, isPrivate } = uploadVideoToFolderVimeoSchemaZod.parse(
      req.body,
    );
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const isFreeFolder = freeFolder === Number(folderId);
    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name:
          name ||
          req.file?.originalname ||
          `Video subido desde la plataforma ${new Date().toISOString()}`,
        description,
      },
      folderId,
      isPrivate: isFreeFolder ? false : isPrivate,
    });

    if (!isFreeFolder) {
      await VideoMongoModel.create({
        _id: new ObjectId().toHexString(),
        idVideoVimeo: result.uri.split('/').pop(),
      });
    }

    await cleanUploadedFiles(req);

    res.status(200).json({
      message: 'Video uploaded successfully',
    });
  } catch (error) {
    await cleanUploadedFiles(req);
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Server error', error: error });
  }
};

export const getVimeoVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getVimeoVideos' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/videos`,
      query: {
        page,
        per_page: perPage,
      },
    });

    res.status(200).json({
      message: 'Videos fetched successfully',
      data: response.body,
    });
  } catch (error: any) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({
      message: 'Error retrieving videos from Vimeo',
      error: error.message || error,
    });
  }
};

export const getFreeVimeoVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getFreeVimeoVideos' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/projects/${freeFolder}/videos`,
      query: {
        page,
        per_page: perPage,
      },
    });

    const dataVideos = response.body.data.map((videoVimeo: any) => {
      return getInfoPublicExtractVimeoVideoById({ videoVimeo });
    });

    response.body.data = dataVideos;

    res.status(200).json({
      message: 'Videos fetched successfully',
      data: response.body,
    });
  } catch (error: any) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({
      message: 'Error retrieving videos from Vimeo',
      error: error.message || error,
    });
  }
};

export const getFoldersVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getFoldersVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/projects`,
      query: {
        page,
        per_page: perPage,
      },
    });

    res.status(200).json({
      message: 'Folders fetched successfully',
      data: response.body,
    });
  } catch (error: any) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({
      message: 'Error retrieving folders from Vimeo',
      error: error.message || error,
    });
  }
};

export const getFolderByIdVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getFolderByIdVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const id = req.params.id as string;
    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/projects/${id}`,
    });
    res.status(200).json({
      message: 'Folders fetched successfully',
      data: response.body,
    });
  } catch (error: any) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({
      message: 'Error retrieving folders from Vimeo',
      error: error.message || error,
    });
  }
};

export const getItemsFolderByIdVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getItemsFolderByIdVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const id = req.params.id as string;
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/projects/${id}/items`,
      query: {
        page,
        per_page: perPage,
      },
    });

    res.status(200).json({
      message: 'Folders fetched successfully',
      data: response.body,
    });
  } catch (error: any) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({
      message: 'Error retrieving folders from Vimeo',
      error: error.message || error,
    });
  }
};

export const updateVideoToFolderVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'updateVideoToFolderVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const idVideoVimeo = req.params.id as string;
    const { name, description } = updateVideoToFolderVimeoSchemaZod.parse(req.body);

    if (!idVideoVimeo) {
      return res.status(400).json({
        message: 'Video id is required',
      });
    }

    const videoFile = (req.files as any)?.upload_video?.[0];
    const videoPath = videoFile?.path;
    const thumbnailBuffer = await extractBufferToFileThumbnail(req);

    await updateVideoToVimeo({
      idVideoVimeo,
      filePath: videoPath,
      thumbnailBuffer,
      name,
      description,
    });
    await cleanUploadedFiles(req);

    res.status(200).json({
      message: 'Video updated successfully',
    });
  } catch (error) {
    await cleanUploadedFiles(req);
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Server error', error: error });
  }
};

export const removeVideoToFolderVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'removeVideoToFolderVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const idVideoVimeo = req.params.id as string;

    if (!idVideoVimeo) {
      return res.status(400).json({
        message: 'Video id is required',
      });
    }

    await deleteVimeoVideo({ idVideoVimeo });
    await VideoMongoModel.deleteOne({ idVideoVimeo });

    res.status(200).json({
      message: 'Video removed successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    res.status(500).json({ message: 'Server error', error: error });
  }
};
