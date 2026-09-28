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
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import ResponseHandler from '@utils/response.handler';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { FindAnnouncementDto } from './dto/find-announcement.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';

@Controller('announcement')
@UseInterceptors(TransformInterceptor)
@ApiTags('Announcement-Controller')
export class AnnouncementController extends ResponseHandler {
  constructor(private readonly announcementService: AnnouncementService) {
    super();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.WRITE)
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    try {
      const resp = await this.announcementService.create(createAnnouncementDto);
      return this.sendSuccessResponse(resp, 'Created the Announcement');
    } catch (err) {
      console.log(err.message);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get()
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.READ)
  async findAll(@Query() payload: FindAnnouncementDto) {
    try {
      const resp = await this.announcementService.findAll(payload);
      if (!resp) return this.sendSuccessResponse(200, 'No Announcement Found');
      return this.sendSuccessResponse(resp, 'Announcement Retrievd');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const resp = await this.announcementService.findOne(id);
      return (
        this, this.sendSuccessResponse(resp, 'Announcement retrievd with ID')
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  // @Delete(':id')
  // async remove(@Param('id', ParseUUIDPipe) id: string) {
  //   try {
  //     const resp = await this.announcementService.remove(id);
  //     return this.sendSuccessResponse(resp, 'Annoucement Deleted');
  //   } catch (err) {
  //     return this.sendFailedResponse({}, err.messgage);
  //   }
  // }

  // @Patch(':id')
  // async update(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  // ) {
  //   try {
  //     const resp = await this.announcementService.update(
  //       id,
  //       updateAnnouncementDto,
  //     );
  //     return this.sendSuccessResponse(resp, 'Annoucenment updated with the Id');
  //   } catch (err) {
  //     return this.sendFailedResponse({}, err.message);
  //   }
  // }
}
