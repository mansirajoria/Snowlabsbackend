import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  Req,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { TrainerService } from '@trainer/trainer.service';
import { CreateTrainerDto } from '@trainer/dto/create-trainer.dto';
import { UpdateTrainerInfoDto } from '@trainer/dto/update-trainer-info.dto';
import ResponseHandler from '@utils/response.handler';
import { FindTrainerDto } from '@trainer/dto/trainer-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { AddTrainerSkillDto } from '@trainer/dto/add-trainerSkill.dto';
import { UpdateTrainerSkillDto } from '@trainer/dto/update-trainer-skill.dto';
import { Request } from '@security/client/request';
import { Cache } from 'cache-manager';

@Controller('trainer')
@ApiTags('Trainer-Controller')
@UseInterceptors(TransformInterceptor)
export class TrainerController extends ResponseHandler {
  constructor(
    private readonly trainerService: TrainerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  /*
   * Admin Panel
   */

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiOperation({ summary: 'create new trainer' })
  @ApiBearerAuth()
  async create(
    @Body() createTrainerDto: CreateTrainerDto,
    @Req() req: Request,
  ) {
    try {
      const createtrainer = await this.trainerService.create(
        createTrainerDto,
        req.user,
      );
      return this.sendSuccessResponse(createtrainer, 'Trainer created');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'dropdown', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'trainerId', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({ name: 'skillCategory', required: false, type: String })
  @ApiQuery({ name: 'skill', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'show trainers list' })
  async findAll(@Query() queryParams: FindTrainerDto) {
    try {
      const resp = await this.trainerService.findAll(queryParams);
      return this.sendSuccessResponse(resp, 'Trainers Fetched Successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Common
  @Get(':id')
  // @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN, RoleType.TRAINER)
  // @UseGuards(AuthGuard, RolesGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Show trainer details by trainer authId' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryParams: any,
  ) {
    try {
      const cacheKey = `trainer_${id}`;
      const cachedTrainer = await this.cacheManager.get(cacheKey);
      if (cachedTrainer) {
        return this.sendSuccessResponse(
          JSON.parse(cachedTrainer as string),
          'Trainer fetched from cache',
        );
      }
      const trainer = await this.trainerService.findOne(id, queryParams);
      if (!trainer) return this.sendFailedResponse({}, 'Trainer not found');
      await this.cacheManager.set(cacheKey, JSON.stringify(trainer));

      return this.sendSuccessResponse(trainer, 'Trainer Fetched Successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('skill/:id')
  @ApiOperation({ summary: 'get trainer skill by skill id' })
  async trainerSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: any,
  ) {
    try {
      const resp = await this.trainerService.trainerSkill(id, payload);
      return this.sendSuccessResponse(resp, 'Trainer skill fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Common
  @Post('skill/:id')
  // @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN, RoleType.TRAINER)
  // @UseGuards(AuthGuard, RolesGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'to add new skill to existing trainer by authid' })
  async addSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: AddTrainerSkillDto,
  ) {
    try {
      await this.trainerService.addSkill(id, payload);
      return this.sendSuccessResponse({}, 'Trainer new skill Added');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('skill/delete/:id')
  @ApiOperation({ summary: 'to remove skill to existing trainer by authid' })
  async softDeleteSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: any,
  ) {
    try {
      await this.trainerService.softDeleteTraineSkill(id, payload.skillId);
      return this.sendSuccessResponse(
        payload.skillId,
        'Trainer skill soft deleted',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Common
  @Patch('skill/:id')
  // @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN, RoleType.TRAINER)
  // @UseGuards(AuthGuard, RolesGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'update trainer existing skills by authId' })
  async updateTrainerSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateTrainerSkillDto,
  ) {
    // console.log(payload);
    try {
      const res = await this.trainerService.updateTrainerSkill(id, payload);
      return this.sendSuccessResponse(
        res,
        'Trainer skill updated successfully',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Common
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN, RoleType.TRAINER)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiOperation({ summary: 'update trainer profile info by authId' })
  @ApiBearerAuth()
  async updateTrainerInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateTrainerInfoDto,
  ) {
    try {
      await this.trainerService.updateTrainerInfo(id, payload);
      return this.sendSuccessResponse({}, 'Trainer info updated successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiBearerAuth()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.trainerService.softDelete(id);
      return this.sendSuccessResponse({}, 'Trainer soft-deleted Successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
