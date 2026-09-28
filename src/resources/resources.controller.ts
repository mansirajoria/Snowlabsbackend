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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ResourceQuery } from './dto/query-resource.dto';
import { ResponseDTO } from '@utils/response.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { UpdateResourceDto } from './dto/update-resource.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { CopyResourseDto } from '@session/entities/copy-resource.entity';

@ApiTags('Resource-Controller')
@Controller('resources')
@UseInterceptors(TransformInterceptor)
export class ResourcesController extends ResponseHandler {
  constructor(private readonly resourceService: ResourcesService) {
    super();
  }

  @Post('/add')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async addResource(@Body() resource: CreateResourceDto): Promise<ResponseDTO> {
    try {
      const resp = await this.resourceService.createResource(resource);
      return this.sendSuccessResponse(resp, 'resource added successfully !');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'pageLength', required: false, type: Number })
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'sessionId', required: true, type: String })
  @ApiQuery({ name: 'resourceName', required: false, type: String })
  async getResources(@Query() query: ResourceQuery): Promise<ResponseDTO> {
    try {
      const resp = await this.resourceService.getAllResource(query);
      return this.sendSuccessResponse(
        resp,
        'All resources fetched successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async getResource(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.resourceService.getResource(id);
      return this.sendSuccessResponse(
        resp,
        'resource fetched successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateResourceDto,
  ): Promise<ResponseDTO> {
    try {
      const result = await this.resourceService.updateResource(id, payload);
      return this.sendSuccessResponse(
        result,
        'resource update successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async deleteResource(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.resourceService.deleteResource(id);
      return this.sendSuccessResponse({}, 'resource delete successfully !');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
  @ApiBearerAuth()
  @Post('/copy-resource')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async copyResource(
    @Body() copyResorceDto: CopyResourseDto,
  ): Promise<ResponseDTO> {
    try {
      const result = await this.resourceService.copyResource(copyResorceDto);
      return this.sendSuccessResponse({}, 'all resourced copied');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
