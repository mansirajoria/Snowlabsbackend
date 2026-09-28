import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';

@ApiTags('Dashboard-Controller')
@Controller('dashboard')
@UseInterceptors(TransformInterceptor)
export class DashboardController extends ResponseHandler {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  @Get()
  async dashboardAnalytics() {
    try {
      const resp = await this.dashboardService.dashboardAnalytics();
      return this.sendSuccessResponse(resp, 'Dashboard Analytics');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('search')
  @ApiQuery({ name: 'key', required: false, type: String })
  async globalSearchWeb(@Query() params: any) {
    try {
      const resp = await this.dashboardService.globalSearchWeb(params);
      return this.sendSuccessResponse(resp, 'Dashboard Analytics');
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }
}
