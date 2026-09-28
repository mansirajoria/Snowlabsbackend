import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import ResponseHandler from '@utils/response.handler';
import HttpException from '@utils/exceptions/HttpException';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';

@UseInterceptors(TransformInterceptor)
@ApiTags('Upload-Controller')
@Controller('upload')
export class UploadsController extends ResponseHandler {
  constructor(private UploadService: UploadsService) {
    super();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File,@Body() body ) {
    try {
      if (!file) throw new HttpException(HttpStatus.BAD_REQUEST, 'Bad request');
      const fileURL = await this.UploadService.upload(
        file.originalname,
        file.buffer,
        body.module
      );
      return this.sendSuccessResponse({ fileURL }, 'Uploaded successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }
}
