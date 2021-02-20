import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import User from '../models/User';
import fs from 'fs';
import aws from 'aws-sdk';

interface Request {
  user_id: string;
  avatarFileName: string;
  avatarLocation: string;
}

interface Response {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  created_at: Date;
  updated_at: Date;
}

class UpdateUserAvatarService {
  public async execute({
    user_id,
    avatarFileName,
    avatarLocation,
  }: Request): Promise<Response> {
    const usersRepository = getRepository(User);

    const user = await usersRepository.findOne(user_id);

    if (!user) {
      throw new AppError('Only authenticated users can change avatar');
    }

    if (
      (!process.env.STORAGE_TYPE || process.env.STORAGE_TYPE === 'local') &&
      user.avatar
    ) {
      const userAvatarFileExists = await fs.promises.stat(user.avatar_url);

      if (userAvatarFileExists) {
        await fs.promises.unlink(user.avatar_url);
      }
    } else if (process.env.STORAGE_TYPE === 's3' && user.avatar) {
      const s3 = new aws.S3();

      s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME || '',
        Key: user.avatar,
      });
    }

    user.avatar = avatarFileName;
    user.avatar_url = avatarLocation;

    await usersRepository.save(user);

    return user;
  }
}

export default UpdateUserAvatarService;
