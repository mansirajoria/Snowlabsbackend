import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Param,
  Post,
  UseInterceptors,
  Delete,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { FaqService } from './faq.service';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { CreateFaqDTO } from './dtos/create-faq.dto';
import { Cache } from 'cache-manager';

@Controller('faq')
@ApiTags('Faq-Controller')
@UseInterceptors(TransformInterceptor)
export class FaqController extends ResponseHandler {
  constructor(
    private readonly faqService: FaqService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  @Post('')
  @ApiOperation({ summary: 'Create Faq for All type' })
  async createFAQ(@Body() payload: CreateFaqDTO) {
    try {
      await this.faqService.createFaq(payload);
      return this.sendSuccessResponse({}, 'Created faq');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /* NOT REQUIRED

  @Patch(':id')
  @ApiOperation({ summary: 'Update any faq by id' })
  async updateFaq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateFaqDTO,
  ) {
    try {
      await this.faqService.updateFaq(id, payload);
      return this.sendSuccessResponse({}, 'Updated the faq');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  */

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete any faq by id' })
  async softDeleteFaq(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.faqService.softDeleteFaq(id);
      return this.sendSuccessResponse({}, 'Soft Deleted the faq');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('common')
  async findCommonFaqs() {
    try {
      const cacheKey = 'faq_common';
      const cachedFaq = await this.cacheManager.get(cacheKey);
      if (cachedFaq) {
        return this.sendSuccessResponse(
          cachedFaq,
          'Common Faq fetched from cache',
        );
      }
      const resp = await this.faqService.commonFaq();
      await this.cacheManager.set(cacheKey, resp);
      return this.sendSuccessResponse(resp, 'Common Faq fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('trainer')
  async findTrainersFaq() {
    try {
      const cacheKey = 'faq_trainer';
      const cachedFaq = await this.cacheManager.get(cacheKey);
      if (cachedFaq) {
        return this.sendSuccessResponse(
          cachedFaq,
          'Trainer LMS Faq fetched from cache',
        );
      }
      const resp = await this.faqService.trainerFaq();
      await this.cacheManager.set(cacheKey, resp);
      return this.sendSuccessResponse(resp, 'Trainer LMS Faq fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('student')
  async findStudentsFaq() {
    try {
      const cacheKey = 'faq_student';
      const cachedFaq = await this.cacheManager.get(cacheKey);
      if (cachedFaq) {
        return this.sendSuccessResponse(
          cachedFaq,
          'Student LMS Faq fetched from cache',
        );
      }
      const resp = await this.faqService.studentFaq();
      await this.cacheManager.set(cacheKey, resp);
      return this.sendSuccessResponse(resp, 'Student LMS Faq fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
