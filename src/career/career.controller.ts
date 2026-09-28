import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CareerService } from './career.service';
import { CreateCareerDto } from '@career/dto/create-career.dto';
import { UpdateCareerDto } from '@career/dto/update-career.dto';
import { CreateCategoryDto } from '@career/dto/create-category.dto';
import ResponseHandler from '@utils/response.handler';
import {
  CreateApplicantDto,
  ApplicantQueryDTO,
} from './dto/create-applicant.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CareerQueryDto } from './dto/career-query.dto';
import { ResponseDTO } from '@utils/response.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { QueryCategoryDTO } from './dto/query-category.dto';

@ApiTags('Career-Controller')
@UseInterceptors(TransformInterceptor)
@Controller('career')
export class CareerController extends ResponseHandler {
  constructor(private readonly careerService: CareerService) {
    super();
  }

  /*
   * Career Category : Company Roles
   */

  @Post('category')
  @ApiOperation({ summary: 'To create a new Career Category' })
  async createCategory(
    @Body() payload: CreateCategoryDto,
  ): Promise<ResponseDTO> {
    try {
      const category = await this.careerService.createCategory(payload);
      return this.sendSuccessResponse(category, 'Created Career Category');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('category')
  @ApiOperation({ summary: 'To show all the Career Category' })
  async findAllCategory(
    @Query() query: QueryCategoryDTO,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findAllCategory(query);
      return this.sendSuccessResponse(resp, 'Career Categories fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'To show a Career Category by Id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findOneCategory(id);
      return this.sendSuccessResponse(resp, 'Career Category fectched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * Applicant : Job Finder User on Website
   */

  @Post('applicant')
  @ApiOperation({ summary: 'User fill form for a Job profile' })
  async createApplicant(
    @Body() payload: CreateApplicantDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.createApplicant(payload);
      return this.sendSuccessResponse(resp, 'Applicant Info Submitted');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('applicant')
  @ApiOperation({ summary: 'List all the applicants' })
  @ApiQuery({ name: 'pageLength', required: true, type: String })
  @ApiQuery({ name: 'pageNo', required: true, type: String })
  @ApiQuery({ name: 'searchName', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async findAllApplicant(
    @Query() query: ApplicantQueryDTO,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findAllApplicant(query);
      if (!resp) this.sendSuccessResponse([], 'No Applicant Found');
      return this.sendSuccessResponse(resp, 'Applicant Fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('applicant/:id')
  @ApiOperation({ summary: 'to show a applicant info by Id' })
  async findOneApplicant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findOneApplicant(id);
      return this.sendSuccessResponse(resp, 'Applicant Fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('applicant/:id')
  @ApiOperation({ summary: 'Update the applicant status' })
  async updateApplicant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateApplicantDto,
  ) {
    try {
      await this.careerService.updateApplicant(id, payload);
      return this.sendSuccessResponse({}, 'Applicant Status Updated');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * Career : Company Roles
   */

  @Post()
  @ApiOperation({ summary: 'Create a new job profile' })
  async createCareer(
    @Body() createCareerDto: CreateCareerDto,
  ): Promise<ResponseDTO> {
    try {
      const career = await this.careerService.createCareer(createCareerDto);
      return this.sendSuccessResponse(career, 'Created Career');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'show all the jobs available' })
  @ApiQuery({ name: 'searchName', type: String, required: false })
  @ApiQuery({ name: 'pageNo', type: Number, required: false })
  @ApiQuery({ name: 'pageLength', type: Number, required: false })
  async findAllCareer(@Query() query: CareerQueryDto): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findAllCareer(query);
      return this.sendSuccessResponse(resp, 'Careers fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'to get a job information by Id' })
  async findOneCareer(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.findOneCareer(id);
      return this.sendSuccessResponse(resp, 'Career fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'to update a job information by Id' })
  async updateCareer(
    @Param('id') id: string,
    @Body() updateCareerDto: UpdateCareerDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.updateCareer(id, updateCareerDto);
      return this.sendSuccessResponse(resp, 'Career Updated');
    } catch (error) {
      // console.log(error.query);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'to soft delete a job information by Id' })
  async softDeleteCareer(@Param('id') id: string): Promise<ResponseDTO> {
    try {
      const resp = await this.careerService.softDeleteCareer(id);
      return this.sendSuccessResponse(resp, 'Soft deleted career');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
