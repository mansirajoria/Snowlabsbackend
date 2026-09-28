import { registerAs } from '@nestjs/config';
import { MailConfig } from './config.interface';

export default registerAs<MailConfig>('mail', () => ({
  // service: process.env.MAIL_SERVICE,
  // host: process.env.MAIL_HOST,
  // port: process.env.MAIL_PORT,
  // password: process.env.MAIL_PASSWORD,
  mail: process.env.MAIL_MAIL,
  key: process.env.SENDGRID_API_KEY,
}));
