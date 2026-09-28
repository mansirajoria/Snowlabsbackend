import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import ResponseHandler from '@utils/response.handler';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notifications.dto';
import { FindAnnouncementDto } from '@announcement/dto/find-announcement.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Request } from '@security/client/request';
import { query } from 'express';
import { FindNotificationsDto } from './dto/find.notifications.dto';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { Roles } from '@security/decorators/roles.decorator';
import { RoleType } from '@utils/enum';
@Controller('notifications')
@UseInterceptors(TransformInterceptor)
@ApiTags('Notifications-Controller')
export class NotificationsController extends ResponseHandler {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/allNotifications')
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  async findAll(@Query() query: FindNotificationsDto, @Req() request: Request) {
    try {
      const resp = await this.notificationsService.findAll(query, request.user);
      if (!resp) return this.sendSuccessResponse(200, 'No Announcement Found');
      return this.sendSuccessResponse(resp, 'Notifications Retrievd');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/createNotification')
  async create(@Body() createNotificationsDto: CreateNotificationDto) {
    try {
      const resp = await this.notificationsService.create(
        createNotificationsDto,
      );
      return this.sendSuccessResponse(resp, 'Created the Notification');
    } catch (err) {
      console.log(err.message);
      return this.sendFailedResponse({}, err.message);
    }
  }
}
