import { Router, Request } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload';
import uploadConfigS3 from '../config/uploadS3';
import path from 'path';

import CreateUserService from '../services/CreateUserService';
import UpdateUserAvatarService from '../services/UpdateUserAvatarService';

import ensureAuthenticated from '../middlewares/ensureAuthenticated';

interface RequestS3 extends Request {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    stream: any;
    filename: string;
    path: string;
    buffer: any;
    location?: string;
    key?: string;
  };
}

const usersRouter = Router();
const upload = multer(
  process.env.STORAGE_TYPE === 's3' ? uploadConfigS3 : uploadConfig,
);

usersRouter.get('/', (request, response) => {
  return response.json({ ok: true });
});

usersRouter.post('/', async (request, response) => {
  const { name, email, password } = request.body;

  const createUser = new CreateUserService();

  const user = await createUser.execute({
    name,
    email,
    password,
  });

  delete user.password;

  return response.json(user);
});

usersRouter.patch(
  '/avatar',
  ensureAuthenticated,
  upload.single('avatar'),
  async (request: RequestS3, response) => {
    let location, filename;

    if (!process.env.STORAGE_TYPE || process.env.STORAGE_TYPE === 'local') {
      location = path.join(uploadConfig.directory, request.file.filename);
      filename = request.file.filename;
    } else if (process.env.STORAGE_TYPE === 's3') {
      location = request.file.location;
      filename = request.file.key;
    }

    const updateUserAvatar = new UpdateUserAvatarService();

    const user = await updateUserAvatar.execute({
      user_id: request.user.id,
      avatarFileName: filename || '',
      avatarLocation: location || '',
    });

    delete user.password;

    return response.json(user);
  },
);

export default usersRouter;
