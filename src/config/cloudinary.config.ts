import { registerAs } from '@nestjs/config';
import { CloudinaryConfig } from './config.interface';

export default registerAs<CloudinaryConfig>('cloudinary', () => ({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
}));
