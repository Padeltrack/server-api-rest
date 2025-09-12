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

export const getTextBeforeAtEmail = (email: string) => {
  if (typeof email !== 'string') return null;
  const [before] = email.split('@');
  return before;
};

export const getExtensionFromUrl = (url?: string | null) => {
  try {
    if (!url) return null;
    const pathname = new URL(url).pathname;
    const filename = decodeURIComponent(pathname.split('/').pop() || '');

    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    if (!match) return null;

    const ext = match[1].toLowerCase();
    return ext === 'jpeg' ? 'jpg' : ext;
  } catch {
    return null;
  }
};
