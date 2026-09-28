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
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { CoursesService } from '@courses/courses.service';
import { CreateCourseDto } from '@courses/dto/create-course.dto';
import { UpdateCourseDto } from '@courses/dto/update-course.dto';
import {
  CoursesQuery,
  CourseCategorySearchAdmin,
} from '@courses/dto/query-course.dto';
import { CreateCourseCategoryDto } from '@courses/dto/create-course-category.dto';
import { Request } from '@security/client/request';
import { ResponseDTO } from '@utils/response.dto';
import { CourseCategoryQuery } from './dto/query-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-category.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { RolesGuard } from '@security/guards/roles.guard';
import { AuthGuard } from '@security/guards/auth.guard';
import { SlugDto } from './interfaces/course.interface';
import { isUUID } from 'class-validator';
import { FilterCategoryCourse } from './dto/filter-category-course.dto';
import { requestValidator } from '@utils/helper.service';
import { GetCertificateDTO } from './dto/get-certificate.dto';
import { Cache } from 'cache-manager';

@ApiTags('Courses')
@Controller('courses')
@UseInterceptors(TransformInterceptor)
export class CoursesController extends ResponseHandler {
  constructor(
    private readonly coursesService: CoursesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  /*
   * Website
   */

  @Get('category/upcoming-batch')
  async findAllCategoryWithUpcomingBatch(@Query() query: any) {
    try {
      const cacheKey =
        Object.keys(query).length > 0
          ? `courses_${Object.entries(query)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'courses_category_upcomingBatch';
      const cachedCourses = await this.cacheManager.get(cacheKey);
      if (cachedCourses) {
        return this.sendSuccessResponse(
          cachedCourses,
          'Courses fetched from cache',
        );
      }
      const resp = await this.coursesService.findAllCategoryWithUpcomingBatch();
      await this.cacheManager.set(cacheKey, resp, 3600000);
      return this.sendSuccessResponse(resp, 'Category with Upcoming batch');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiQuery({ name: 'name', type: String, required: false })
  @ApiQuery({ name: 'certificateId', type: String, required: false })
  @Get('/check-certificate')
  async getCertificateValid(@Query() payload: GetCertificateDTO) {
    try {
      const result = await this.coursesService.validateCertificate(payload);
      return this.sendSuccessResponse(result, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @Get('/list')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  async courseLists(): Promise<ResponseDTO> {
    try {
      const resp = await this.coursesService.courseLists();
      return this.sendSuccessResponse(resp, 'Course fetch successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Get('category/web/:id')
  async findOneCategory(@Param('id') id: string) {
    try {
      const searchField: SlugDto = {};

      // since id coming in param can be a slug string
      if (isUUID(id)) searchField.id = id;
      else searchField.name = id;

      const resp = await this.coursesService.findCategoryWebsite2(searchField);

      return this.sendSuccessResponse(resp, 'Course Category Found');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('category/filter/:id')
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'mod', required: false, type: String })
  async findFilteredCourses(
    @Param('id') id: string,
    @Query() query: FilterCategoryCourse,
  ) {
    try {
      const resp = await this.coursesService.findFilteredCourses(id, query);
      return this.sendSuccessResponse(resp, 'Course fetched successfully');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('corporate')
  async findCorporateCategories() {
    try {
      const resp = await this.coursesService.findCorporateCategories();
      if (!resp) return this.sendSuccessResponse([], 'Category Found');
      return this.sendSuccessResponse(resp, 'Category Found');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('corporate/mobile')
  async findCorporateCategoriesMobile() {
    try {
      const resp = await this.coursesService.findCorporateCategoriesMobile();
      if (!resp) return this.sendSuccessResponse([], 'Category Found');
      return this.sendSuccessResponse(resp, 'Category Found');
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('corporate/:id')
  async findOneCorporateCategory(@Param('id') id: string) {
    try {
      const resp = await this.coursesService.findOneCorporateCategory(id);
      if (!resp)
        return this.sendSuccessResponse([], 'Course under Category Found');
      return this.sendSuccessResponse(resp, 'Course under Category Found');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * Course-Category CRUD
   */
  @ApiBearerAuth()
  @Post('category')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async createCourseCategory(
    @Req() request: Request,
    @Body() req: CreateCourseCategoryDto,
  ) {
    try {
      requestValidator(request);
      const resp = await this.coursesService.createCourseCategory(req);
      return this.sendSuccessResponse(resp, 'Course Category created');
    } catch (error) {
      return this.sendFailedResponse(error, error.message, error.status);
    }
  }

  @Get('category')
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'web', required: false, type: Boolean })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async findAllCourseCategory(@Query() query: CourseCategoryQuery) {
    try {
      const cacheKey =
        Object.keys(query).length > 0
          ? `courses_${Object.entries(query)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'courses_category_all';
      const cachedCourses = await this.cacheManager.get(cacheKey);
      if (cachedCourses) {
        return this.sendSuccessResponse(
          cachedCourses,
          'Courses fetched from cache',
        );
      }
      const courseCategories = await this.coursesService.findAllCourseCategory(
        query,
      );
      await this.cacheManager.set(cacheKey, courseCategories, 3600000);
      return this.sendSuccessResponse(
        courseCategories,
        'Course categories fetched',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('categoryName')
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'web', required: false, type: Boolean })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async findCourseCategoryName(@Query() query: CourseCategoryQuery) {
    try {
      const courseCategories = await this.coursesService.findCourseCategoryName(
        query,
      );
      return this.sendSuccessResponse(
        courseCategories,
        'Course categories fetched',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('category/:id')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.READ)
  async findCourseCategory(@Param('id') id: string, @Query() query: any) {
    try {
      const searchField: SlugDto = {};

      if (isUUID) searchField.id = id;
      else searchField.name = id;

      const courseCategory = await this.coursesService.findCourseCategory(
        searchField,
        query,
      );

      if (!courseCategory) {
        return this.sendSuccessResponse({}, 'No Course category Found');
      }
      return this.sendSuccessResponse(
        courseCategory,
        'Course category fetched',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('admin/category/:id')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'name', required: false, type: String })
  async findCourseCategoryAdmin(
    @Param('id') id: string,
    @Query() query: CourseCategorySearchAdmin,
  ) {
    try {
      const resp = await this.coursesService.findCourseCategoryAdmin(id, query);
      return this.sendSuccessResponse(resp, 'Course category fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Patch('category/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async updateCourseCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateCourseCategoryDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.coursesService.updateCourseCategory(id, payload);
      return this.sendSuccessResponse(resp, 'Course Category updated');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @ApiBearerAuth()
  @Delete('category/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async removeCourseCategory(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const course = await this.coursesService.removeCourseCategory(id);
      return this.sendSuccessResponse({}, course);
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  /*
   * Course CRUD
   */

  @Post('')
  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  @UseGuards(AuthGuard)
  async create(@Body() createCourseDto: CreateCourseDto): Promise<ResponseDTO> {
    try {
      const course = await this.coursesService.create(createCourseDto);
      return this.sendSuccessResponse(course, 'Course Created');
    } catch (error) {
      console.log(error.message);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  @ApiQuery({ name: 'courseName', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  async findAll(@Query() query: CoursesQuery): Promise<ResponseDTO> {
    try {
      const cacheKey =
        Object.keys(query).length > 0
          ? `courses_${Object.entries(query)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'courses_all';
      const cachedCourses = await this.cacheManager.get(cacheKey);
      if (cachedCourses) {
        return this.sendSuccessResponse(
          cachedCourses,
          'Courses fetched from cache',
        );
      }

      const courses = await this.coursesService.findAll(query);
      await this.cacheManager.set(cacheKey, courses, 3600000);
      return this.sendSuccessResponse(courses, 'Courses fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Get('/demand')
  @ApiQuery({ name: 'cid', required: false, type: String })
  async inDemandCourse(@Query() payload: any) {
    try {
      const cacheKey =
        Object.keys(payload).length > 0
          ? `courses_${Object.entries(payload)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'courses_demand';
      const cachedCourses = await this.cacheManager.get(cacheKey);
      if (cachedCourses) {
        return this.sendSuccessResponse(
          cachedCourses,
          'Courses fetched from cache',
        );
      }
      const courses = await this.coursesService.inDemandCourse(payload);
      await this.cacheManager.set(cacheKey, courses, 3600000);
      return this.sendSuccessResponse(courses, 'In Demand Courses fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Get('/slug:name')
  async findOneBySlug(
    @Param('name', ParseUUIDPipe) name: string,
  ): Promise<ResponseDTO> {
    try {
      let searchField: SlugDto;
      searchField.name = name;
      const course = await this.coursesService.findOne(searchField);
      return this.sendSuccessResponse(course, 'Course Fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.coursesService.update(id, updateCourseDto);
      return this.sendSuccessResponse(resp, 'Course updated');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDTO> {
    try {
      const course = await this.coursesService.remove(id);
      return this.sendSuccessResponse(course, 'Course deleted');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @Get('/generate-certificate/:courseId')
  @UseGuards(AuthGuard)
  async certificate(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Req() request: Request,
  ) {
    try {
      const course = await this.coursesService.certificate(
        courseId,
        request.user,
      );
      return this.sendSuccessResponse(course, 'Certificate Generated');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Get('/newCategoryName')
  async findCourseCategoryNames() {
    try {
      const courseCategories =
        await this.coursesService.findCourseCategoryNames();
      return this.sendSuccessResponse(
        courseCategories,
        'Course categories fetched',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDTO> {
    try {
      const searchField: SlugDto = {};

      if (isUUID(id)) searchField.id = id;
      else searchField['name'] = id;

      const course = await this.coursesService.findOne(searchField);

      return this.sendSuccessResponse(course, 'Course Fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }
}
