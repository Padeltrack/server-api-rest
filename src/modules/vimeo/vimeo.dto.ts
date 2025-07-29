import { z } from 'zod';

export const uploadVideoToFolderVimeoSchemaZod = z.object({
  folderId: z.string({ required_error: 'folderId es requerido' }).min(1, 'folderId es requerido'),
});

export type UploadVideoToFolderVimeoDTO = z.infer<typeof uploadVideoToFolderVimeoSchemaZod>;
