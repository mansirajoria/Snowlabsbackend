import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { LevelService } from './level.service';
import { CreateLevelDto } from '@access/dtos/create-level.dto';
import { UpdateLevelDto } from '@access/dtos/update-level.dto';
import ResponseHandler from '@utils/response.handler';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { Roles } from '@security/decorators/roles.decorator';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { RoleType } from '@utils/enum';
import { ResponseDTO } from '@utils/response.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('level')
@ApiTags('Level-Controller')
@Roles(RoleType.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(TransformInterceptor)
export class LevelController extends ResponseHandler {
  constructor(private readonly levelService: LevelService) {
    super();
  }

  /*
   * Create New level with come Access writes
   */

  @Post()
  async create(@Body() createLevelDto: CreateLevelDto): Promise<ResponseDTO> {
    try {
      await this.levelService.create(createLevelDto);
      return this.sendSuccessResponse(
        {},
        'Created new level with Level Permissions',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  async findAll(): Promise<ResponseDTO> {
    try {
      const LP = await this.levelService.findAll();
      return this.sendSuccessResponse(LP, 'Levels fetched successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('level-with-access')
  async findAllWithAccess(): Promise<ResponseDTO> {
    try {
      const LP = await this.levelService.findAllWithAccess();
      return this.sendSuccessResponse(
        LP,
        'Levels with module access fetched successfully',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDTO> {
    try {
      const LP = await this.levelService.findOne(id);
      return this.sendSuccessResponse(
        [LP],
        'Level with module access fetched successfully',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   *  Update level - access rights
   */

  @Patch('')
  async update(@Body() payload: UpdateLevelDto): Promise<ResponseDTO> {
    try {
      await this.levelService.update(payload);
      return this.sendSuccessResponse(
        {},
        'Level with new permission updated successfully',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
