import { z } from 'zod';

export const uploadVideoToFolderVimeoSchemaZod = z.object({
  folderId: z.string({ required_error: 'folderId es requerido' }).min(1, 'folderId es requerido'),
  name: z.string().optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export type UploadVideoToFolderVimeoDTO = z.infer<typeof uploadVideoToFolderVimeoSchemaZod>;
