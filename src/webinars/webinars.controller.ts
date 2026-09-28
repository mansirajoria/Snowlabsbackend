import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
  Req,
  Headers,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { WebinarsService } from './webinars.service';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { UpdateWebinarDto } from './dto/update-webinar.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryWebinarDTO } from './dto/query-webinar.dto';
import ResponseHandler from '@utils/response.handler';
import { EnrollWebinarDto } from './dto/enroll-webinar.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { CreateWebinarCategoryDTO } from './dto/create-webinar-category.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { ResponseDTO } from '@utils/response.dto';
import { Request } from '@security/client/request';
import { SlugDto } from '@courses/interfaces/course.interface';
import { isUUID } from 'class-validator';
import { getTrainerEnrollmentMailBody } from '@utils/helpers/mailbody.helper';
import { MailService } from '@mail/mail.service';
import { Cache } from 'cache-manager';

@Controller('webinars')
@ApiTags('Webinars-Controller')
@UseInterceptors(TransformInterceptor)
export class WebinarsController extends ResponseHandler {
  constructor(
    private readonly webinarsService: WebinarsService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }
  @ApiBearerAuth()
  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.WEBINARS)
  @CheckAccess(AccessType.WRITE)
  async create(
    @Req() req: Request,
    @Body() createWebinarDto: CreateWebinarDto,
  ): Promise<ResponseDTO> {
    try {
      const webinar = await this.webinarsService.create(createWebinarDto);
      const mailBody = getTrainerEnrollmentMailBody();
      this.mailService.sendViaSendGrid({
        subject: 'Trainer Instruction',
        text: mailBody,
        to: webinar.trainer.auth.email,
      });
      return this.sendSuccessResponse(webinar, 'Created successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('/category')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.WEBINARS)
  @CheckAccess(AccessType.WRITE)
  async createCategory(@Body() createCatDto: CreateWebinarCategoryDTO) {
    try {
      const category = await this.webinarsService.createCategory(createCatDto);
      return this.sendSuccessResponse(category, 'Created successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiQuery({ name: 'web', type: Boolean, required: false })
  @Get('/category')
  async getCategory(@Query('web') web: boolean) {
    try {
      const cacheKey =
        web !== undefined
          ? `webinars_category_web_${web}`
          : 'webinars_category';
      const cachedWebinars = await this.cacheManager.get(cacheKey);
      if (cachedWebinars) {
        return this.sendSuccessResponse(cachedWebinars, 'fetched from cache');
      }
      const categories = await this.webinarsService.getCategory(web);
      await this.cacheManager.set(cacheKey, categories);
      return this.sendSuccessResponse(categories, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'speaker', type: String, required: false })
  @ApiQuery({ name: 'date', type: String, required: false })
  @ApiQuery({ name: 'recordingAvailable', type: Boolean, required: false })
  @ApiQuery({ name: 'filterId', type: String, required: false })
  @ApiQuery({ name: 'web', type: Boolean, required: false })
  @Get('')
  async findAll(@Query() query: QueryWebinarDTO) {
    try {
      const cacheKey =
        Object.keys(query).length > 0
          ? `webinars_${Object.entries(query)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'webinars_all';
      const cachedWebinars = await this.cacheManager.get(cacheKey);
      if (cachedWebinars) {
        return this.sendSuccessResponse(cachedWebinars, 'fetched from cache');
      }
      const webinars = await this.webinarsService.findAll(query);
      await this.cacheManager.set(cacheKey, webinars);
      return this.sendSuccessResponse(webinars, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('/upcomings')
  async upcomingWebinars(): Promise<ResponseDTO> {
    try {
      const response = await this.webinarsService.upcomingWebinars();
      return this.sendSuccessResponse(response, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const cacheKey = `webinars_${id}`;

      // Check cache before querying the database
      const cachedWebinar = await this.cacheManager.get(cacheKey);
      if (cachedWebinar) {
        return this.sendSuccessResponse(
          JSON.parse(cachedWebinar as string),
          'Fetched from cache',
        );
      }
      const searchField: SlugDto = isUUID(id) ? { id } : { name: id };
      const webinar = await this.webinarsService.findOne(searchField);
      if (!webinar) {
        return this.sendFailedResponse(null, 'Webinar not found');
      }

      await this.cacheManager.set(cacheKey, JSON.stringify(webinar));
      return this.sendSuccessResponse(webinar, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.WEBINARS)
  @CheckAccess(AccessType.WRITE)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateWebinarDto: UpdateWebinarDto,
  ) {
    try {
      const webinar = await this.webinarsService.update(id, updateWebinarDto);
      return this.sendSuccessResponse(webinar, 'Updated successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.WEBINARS)
  @CheckAccess(AccessType.WRITE)
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const webinar = await this.webinarsService.remove(id);
      return this.sendSuccessResponse(webinar, 'Deleted successfully');
    } catch (err) {
      console.log(err.message);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/enroll')
  async webinarEnrollment(
    @Body() enrollmentDTO: EnrollWebinarDto,
    @Headers('timezone') timezone: string,
  ) {
    try {
      const newEnroll = await this.webinarsService.enroll(
        enrollmentDTO,
        timezone,
      );
      return this.sendSuccessResponse(newEnroll, 'Enrolled successfully');
    } catch (err) {
      console.log(err, err.message);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('/enrollments/:id')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.WEBINARS)
  @CheckAccess(AccessType.READ)
  async getWebinarEnrollments(
    @Param('id') webinarId: string,
    @Query('search') search: string,
  ) {
    try {
      const enrollments = await this.webinarsService.getEnrollments(
        webinarId,
        search,
      );
      return this.sendSuccessResponse(enrollments, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
