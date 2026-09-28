import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics-Controller')
@UseInterceptors(TransformInterceptor)
@Controller('analytics')
export class AnalyticsController extends ResponseHandler {
  constructor(private analyticsService: AnalyticsService) {
    super();
  }

  @Get()
  async getReport() {
    try {
      const result = await this.analyticsService.getViewerCount();
      return this.sendSuccessResponse(result, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
