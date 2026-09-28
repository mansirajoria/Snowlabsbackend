import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ModuleService } from './module.service';
import ResponseHandler from '@utils/response.handler';
import { CreateModuleDto } from '@access/dtos/create-module.dto';
import { ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';

@Controller('module')
@ApiTags('Module-Controller')
@UseInterceptors(TransformInterceptor)
export class ModuleController extends ResponseHandler {
  constructor(private readonly moduleService: ModuleService) {
    super();
  }

  @Post()
  async create(@Body() createModuleDto: CreateModuleDto) {
    try {
      const createdModule = await this.moduleService.create(createModuleDto);
      return this.sendSuccessResponse(
        { createdModule },
        'Module created successfully',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  async findAll() {
    try {
      const modules = await this.moduleService.findAll();
      return this.sendSuccessResponse({ modules }, 'Modules List fetched', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const module = await this.moduleService.findOne(id);
      return this.sendSuccessResponse({ module }, 'Module fetched', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
