import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';
import ResponseHandler from '@utils/response.handler';
import { ResponseDTO } from '@utils/response.dto';

import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { SearchFeedBack, SearchSessionDto } from './dto/search-session.dto';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import {
  Roles,
  CheckPermissions,
  CheckAccess,
} from '@security/decorators/roles.decorator';
import { RolesGuard } from '@security/guards/roles.guard';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { CopyResourseDto } from './entities/copy-resource.entity';
import { update } from 'lodash';
import { UpdateSessionDto } from './dto/update-session.dto';

@UseInterceptors(TransformInterceptor)
@ApiBearerAuth()
@ApiTags('Session-Controller')
@Controller('sessions')
export class SessionController extends ResponseHandler {
  constructor(private readonly sessionService: SessionService) {
    super();
  }

  @Get('/')
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'pageLength', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: true, type: String })
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async sessionList(@Query() payload: SearchSessionDto): Promise<ResponseDTO> {
    try {
      const sessionsDetails = await this.sessionService.sessionList(payload);
      return this.sendSuccessResponse(
        sessionsDetails,
        'Session fetch successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async getsSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const sessionsDetails = await this.sessionService.getSession(id);
      return this.sendSuccessResponse(
        sessionsDetails,
        'Session fetch successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('feedbacks/:sessionId')
  @ApiQuery({ name: 'pageLength', type: Number, required: false })
  @ApiQuery({ name: 'pageNo', type: Number, required: false })
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async sessionFeedbackList(
    @Param('sessionId', ParseUUIDPipe) id: string,
    @Query() payload: SearchFeedBack,
  ): Promise<ResponseDTO> {
    try {
      const feedbacks = await this.sessionService.sessionFeedbackList(
        id,
        payload,
      );
      return this.sendSuccessResponse(
        feedbacks,
        'Feedback fetch successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('batch/feedbacks/:batchId')
  @ApiQuery({ name: 'pageLength', type: Number, required: false })
  @ApiQuery({ name: 'pageNo', type: Number, required: false })
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async batchFeedbackList(
    @Param('batchId', ParseUUIDPipe) id: string,
    @Query() payload: SearchFeedBack,
  ): Promise<ResponseDTO> {
    try {
      const feedbacks = await this.sessionService.batchFeedbackList(
        id,
        payload,
      );
      return this.sendSuccessResponse(
        feedbacks,
        'Feedback fetch successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/common-session/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async commanSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const result = await this.sessionService.commanSession(id);
      return this.sendSuccessResponse(result, 'session fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch('/postponed/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async postponedSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      await this.sessionService.postponedSession(id);
      return this.sendSuccessResponse({}, 'Session postponed successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async removeSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      await this.sessionService.removeSession(id);
      return this.sendSuccessResponse({}, 'Session delete  successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<ResponseDTO> {
    try {
      await this.sessionService.updateSession(id, updateSessionDto);
      return this.sendSuccessResponse({}, 'Session update  successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
