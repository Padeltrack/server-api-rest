import { Request, Response } from 'express';
import { vimeoClient } from '../../config/vimeo.config';
import { uploadVideoToVimeo } from './vimeo.helper';
import { uploadVideoToFolderVimeoSchemaZod } from './vimeo.dto';
import { ZodError } from 'zod';

export const uploadVideoToFolderVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'uploadVideoToFolderVimeo' });
  req.logger.info({ status: 'start' });

  try {
    const { folderId } = uploadVideoToFolderVimeoSchemaZod.parse(req.body);
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadVideoToVimeo({
      filePath,
      fileName: req.file?.originalname || 'Uju de video',
      folderId,
    });

    res.status(200).json({
      message: 'Video uploaded successfully',
      data: result,
    });
  } catch (error) {
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
      path: `/me/projects/${26046367}/videos`,
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
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const response = await vimeoClient.request({
      method: 'GET',
      path: `/me/projects/${id}`,
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

export const getItemsFolderByIdVimeo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'vimeo', serviceHandler: 'getFolderByIdVimeo' });
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
