import { UserMongoModel } from './user.model';

export const generateUniqueUserName = async (baseName: string) => {
  const cleanBase = baseName.trim().toLowerCase().replace(/\s+/g, '');
  let candidate = cleanBase;
  let counter = 0;

  while (true) {
    const exists = await UserMongoModel.exists({ userName: candidate });
    if (!exists) break;
    counter += 1;
    candidate = `${cleanBase}${counter}`;
  }

  return candidate;
};
