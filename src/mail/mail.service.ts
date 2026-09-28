import { MailerService } from '@nestjs-modules/mailer';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDto, LoginCredsDto, CommonMailDTO } from '@auth/dto/common.dto';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@utils/exceptions/HttpException';
import * as SibApiV3Sdk from 'sib-api-v3-typescript';
import { AxiosRequestConfig } from 'axios';
@Injectable()
export class MailService {
  private readonly apiInstance = new SibApiV3Sdk.AccountApi();
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async commonMail(commonMailDto: CommonMailDTO) {
    await this.sendViaSendGrid({
      to: commonMailDto.to,
      subject: commonMailDto.subject,
      text: commonMailDto.text,
    });
  }

  async sendLoginCred(mailDto: MailDto, payload: LoginCredsDto): Promise<void> {
    await this.sendViaSendGrid({
      to: mailDto.to,
      subject: mailDto.subject,
      text: `
<p>Dear,</p>

<p>Please find below the access details for the SnowLabs Technology website:</p>

<table style="border-collapse: collapse; width: 60%; margin-bottom: 20px;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Website URL:</td>
    <td style="padding: 8px; border: 1px solid #ddd;"><a href="https://www.snowlabstechnology.com/">https://www.snowlabstechnology.com/</a></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email ID:</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${payload.email}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Password:</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${payload.password}</td>
  </tr>
</table>

<p>Kindly keep the above credentials confidential and use them strictly for authorized purposes only.</p>

<p>If you face any issues accessing the website or require further assistance, please feel free to reach out to us at <a href="tel:+919717594443">+91-9717594443</a>.</p>

<p>We look forward to your confirmation once access is successfully verified.</p>

<p>Warm regards,<br/>
Team SnowLabs Technology</p>
`
    });
  }

  async sendViaSendGrid(paylaod: CommonMailDTO) {
    const URL = `https://api.brevo.com/v3/smtp/email`;
    const data = {
      sender: {
        name: 'SnowLabs Technology',
        email: this.configService.get('mail.mail', { infer: true }),
      },
      to: [
        {
          email: paylaod.to,
          name: paylaod.to || 'John Doe',
        },
      ],
      subject: paylaod.subject,
      htmlContent: paylaod.text,
    };
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.configService.get('mail.key', { infer: true }),
      },
    };
    const response = await this.httpService.axiosRef
      .post(URL, data, config)
      .then(() => URL)
      .catch((e) => {
        const errorMessage = e.response?.data?.message ?? e.message;
        const statusCode = e.response?.data?.code
          ? HttpStatus.OK
          : HttpStatus.EXPECTATION_FAILED;
        throw new HttpException(statusCode, errorMessage);
      });
    return response;
  }
}
