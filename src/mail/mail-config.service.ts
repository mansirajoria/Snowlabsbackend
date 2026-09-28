import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    return {
      transport: {
        host: this.configService.get('mail.host', { infer: true }),
        port: this.configService.get('mail.port', { infer: true }),
        service: this.configService.get('mail.service', { infer: true }),

        //   ignoreTLS: this.configService.get('mail.ignoreTLS', { infer: true }),
        //   secure: this.configService.get('mail.secure', { infer: true }),
        //   requireTLS: this.configService.get('mail.requireTLS', { infer: true }),
        auth: {
          user: this.configService.get('mail.mail', { infer: true }),
          pass: this.configService.get('mail.password', { infer: true }),
        },
        // },
        // defaults: {
        //   from: `"${this.configService.get('mail.defaultName', {
        //     infer: true,
        //   })}" <${this.configService.get('mail.defaultEmail', { infer: true })}>`,
        // },
        // template: {
        //   dir: path.join(
        //     this.configService.getOrThrow('app.workingDirectory', {
        //       infer: true,
        //     }),
        //     'src',
        //     'mail',
        //     'mail-templates',
        //   ),
        //   adapter: new HandlebarsAdapter(),
        //   options: {
        //     strict: true,
        //   },
      },
      // template: {
      //   dir: __dirname + '/templates',
      //   adapter: new EjsAdapter(),
      //   options: { strict: true },
      // },
    } as MailerOptions;
  }
}
