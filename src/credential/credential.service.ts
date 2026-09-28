import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import HttpException from '@utils/exceptions/HttpException';
import { AxiosRequestConfig } from 'axios';
import { CredentialEntity } from './entities/credential.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CredentialService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
  ) {}
  private accessKey = process.env.FREE_CURRENCY_API_KEY;
  async usdToInr(): Promise<number> {
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'USD' },
    });
    const url: string = `https://api.freecurrencyapi.com/v1/latest?apikey=${this.accessKey}&currencies=INR`;

    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const data: number = await this.httpService.axiosRef
      .get(url, requestConfig)
      .then((response) => {
        return response.data?.data?.INR;
      })
      .catch((e) => {
        const errorMessage = e.response?.data;
        throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
      });
    credential.value = parseFloat(data.toFixed(2));
    await this.credentialRepo.save(credential);
    return data;
  }

  async outlookCreds(): Promise<CredentialEntity> {
    const outlookDetails = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    return outlookDetails;
  }
}
