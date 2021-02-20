import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import crypto from 'crypto';

export default {
  storage: multerS3({
    s3: new aws.S3(),
    bucket: process.env.S3_BUCKET_NAME || '',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: (request, file, callback) => {
      const fileHash = crypto.randomBytes(10).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};
