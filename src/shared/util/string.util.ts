const mime = require('mime');

export const validIsBase64String = (options: { base64: string }) => {
  const { base64 } = options;

  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches?.length !== 3) return false;
  return matches;
};

export const getBufferBase64 = (options: { base64: string; name: string }) => {
  const { base64, name } = options;
  const isBase64 = validIsBase64String({ base64 });

  if (!isBase64) throw Error('Formato base 64 invalido');

  const decodedImg = {
    type: isBase64[1],
    data: Buffer.from(isBase64[2], 'base64'),
  };

  const imageBuffer = decodedImg.data;
  const extension = mime.getExtension(decodedImg.type);
  const fileName = `${name}.${extension}`;

  return { fileName, buffer: imageBuffer };
};
