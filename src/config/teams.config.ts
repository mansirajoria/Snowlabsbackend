import { registerAs } from '@nestjs/config';
import { TeamConfig } from './config.interface';

export default registerAs<TeamConfig>('team', () => ({
  clientId: process.env.OUTLOOK_CLIENT_ID,
  scope: ['Calendars.ReadWrite User.ReadWrite offline_access Mail.Send'],
  refreshScope: ['User.Read Mail.Read'],
  redirectUrl: process.env.OUTLOOK_CALLBACK_URI,
  secretId: process.env.OUTLOOK_CLIENT_SECRET,
  tenantId: process.env.OUTLOOK_TENANT_ID,
  grantType: process.env.OUTLOOK_GRANT_TYPE,
  resource: process.env.OUTLOOK_RESOURCE,
}));
