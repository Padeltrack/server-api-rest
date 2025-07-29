import { Vimeo } from '@vimeo/vimeo';
import dotenv from 'dotenv';

dotenv.config();

export const vimeoClient = new Vimeo(
  process.env.VIMEO_CLIENT_ID || '',
  process.env.VIMEO_CLIENT_SECRET || '',
  process.env.VIMEO_ACCESS_TOKEN || '',
);
