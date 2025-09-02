import sharp from 'sharp';

export const processImageResize = async (options: {
  buffer: Buffer;
  width: number;
  height: number;
}): Promise<Buffer> => {
  const { width, height, buffer } = options;
  return await sharp(buffer).resize(width, height).toBuffer();
};
