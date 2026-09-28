export interface MailData<T = never> {
  to: string;
  data: T;
}

export interface MailOptions {
  email: string;
  subject: string;
  message: string;
}
