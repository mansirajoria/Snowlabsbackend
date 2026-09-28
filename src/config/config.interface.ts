export type AppConfig = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  frontendDomain?: string;
  backendDomain: string;
  port: number;
  apiPrefix: string;
  fallbackLanguage: string;
  headerLanguage: string;
};

export type AuthConfig = {
  secret?: string;
  expires?: string;
};

export type PaymentConfig = {
  gst: string;
};

export type MailConfig = {
  // service: string;
  // host: string;
  // port: string;
  // password?: string;
  mail: string;
  key: string;
};

export type TeamConfig = {
  clientId: string;
  scope: Array<string>;
  refreshScope: Array<string>;
  redirectUrl: string;
  secretId: string;
  tenantId: string;
  grantType: string;
  resource: string;
};

export type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};
