import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoiService } from './roi.service';
import ResponseHandler from '@utils/response.handler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { ResponseDTO } from '@utils/response.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AuthGuard } from '@security/guards/auth.guard';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { RolesGuard } from '@security/guards/roles.guard';
import { DateFilterDTO } from './dto/date-filter.dto';

@ApiTags('ROI Controller')
// @ApiBearerAuth()
// @Roles(RoleType.ADMIN)
// @UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(TransformInterceptor)
@Controller('roi')
export class RoiController extends ResponseHandler {
  constructor(private readonly roiService: RoiService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'ROI Analytics' })
  @ApiQuery({ name: 'month', required: true, type: String })
  @ApiQuery({ name: 'year', required: true, type: String })
  async analytics(@Query() payload: DateFilterDTO): Promise<ResponseDTO> {
    try {
      const resp = await this.roiService.analytics(payload);
      return this.sendSuccessResponse(resp, 'ROI Analytics');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/overall')
  @ApiOperation({ summary: 'Quaterly Overall Returns ' })
  async overallReturn(): Promise<ResponseDTO> {
    try {
      const resp = 'WIP';
      return this.sendSuccessResponse(resp, 'Quaterly overall return fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('course-analytics')
  @ApiOperation({ summary: 'Course Analytics' })
  @ApiQuery({ name: 'month', required: true, type: String })
  @ApiQuery({ name: 'year', required: true, type: String })
  async courseAnalytics(@Query() payload: DateFilterDTO): Promise<ResponseDTO> {
    try {
      const resp = await this.roiService.courseAnalytics(payload);
      return this.sendSuccessResponse(resp, 'Course analytics fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Get('batch-analytics')
  @ApiOperation({ summary: 'Course Analytics' })
  @ApiQuery({ name: 'month', required: true, type: String })
  @ApiQuery({ name: 'year', required: true, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ROI)
  @CheckAccess(AccessType.WRITE)
  async batchAnalytics(
    @Query() payload: DateFilterDTO,
    // @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.roiService.batchAnalytics(payload);
      return this.sendSuccessResponse(resp, 'Course analytics fetched');
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/download/batch-analytics')
  @ApiOperation({ summary: 'Course Analytics' })
  @ApiQuery({ name: 'startMonth', required: true, type: String })
  @ApiQuery({ name: 'startYear', required: true, type: String })
  @ApiQuery({ name: 'endMonth', required: true, type: String })
  @ApiQuery({ name: 'endYear', required: true, type: String })
  async downloadAnalytics(@Query() payload: any) {
    try {
      const resp = await this.roiService.downloadBatchAnalytics(payload);
      return this.sendSuccessResponse(resp, 'Course analytics download');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('webinar-analytics')
  @ApiOperation({ summary: 'Webinar Analytics' })
  async webinarAnalytics(): Promise<ResponseDTO> {
    try {
      const resp = 'WIP';
      return this.sendSuccessResponse(resp, 'Webinar analytics fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('certification-analytics')
  @ApiOperation({ summary: 'Certification Analytics ' })
  async certificationAnalytics(): Promise<ResponseDTO> {
    try {
      const resp = 'WIP';
      return this.sendSuccessResponse(resp, 'Certification analytics fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
