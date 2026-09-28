import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';
import { CredentialService } from './credential.service';

ApiTags('Credential-Controller');
@Controller('credential')
@UseInterceptors(TransformInterceptor)
export class CredentialController extends ResponseHandler {
  constructor(private readonly credentialService: CredentialService) {
    super();
  }

  @Get('/usd-to-inr')
  async usdToInrConversion() {
    try {
      const data = await this.credentialService.usdToInr();
      return this.sendSuccessResponse(data, 'fetch successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }
}
