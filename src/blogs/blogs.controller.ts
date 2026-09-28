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
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { BlogsService } from '@blogs/blogs.service';
import { CreateBlogDto } from '@blogs/dto/create-blog.dto';
import { UpdateBlogDto } from '@blogs/dto/update-blog.dto';
import ResponseHandler from '@utils/response.handler';
import { ResponseDTO } from '@utils/response.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateBlogCategoryDTO } from './dto/create-blog-category.dto';
import { BlogQueryDTO } from './dto/query-blog.dto';
import { AccessType, BlogType, PermissionType, RoleType } from '@utils/enum';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { SlugDto } from '@courses/interfaces/course.interface';
import { isUUID } from 'class-validator';
import { QueryBlogCategoryDTO } from './dto/query-blog-category.dto';
import { UpdateBlogCategoryDTO } from './dto/update-blog-category.dto';
import { Cache } from 'cache-manager';
@ApiTags('Blogs-Controller')
@Controller('blogs')
@UseInterceptors(TransformInterceptor)
export class BlogsController extends ResponseHandler {
  constructor(
    private readonly blogsService: BlogsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  // Blog Category CRUD APIs

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  @ApiBearerAuth()
  @Post('/blog-category')
  async createCategory(@Body() categoryDto: CreateBlogCategoryDTO) {
    try {
      const category = await this.blogsService.createCategory(categoryDto);
      return this.sendSuccessResponse(category, 'Created successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @ApiQuery({ name: 'web', type: Boolean, required: false })
  @ApiQuery({ name: 'blogType', type: String, required: false })
  @ApiQuery({ name: 'name', type: String, required: false })
  @Get('/blog-category')
  async getCategory(@Query() payload: QueryBlogCategoryDTO) {
    try {
      const cacheKey =
        Object.keys(payload).length > 0
          ? `blogs_${Object.entries(payload)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'blogs_category_all';
      const cachedblogs = await this.cacheManager.get(cacheKey);
      if (cachedblogs) {
        return this.sendSuccessResponse(
          cachedblogs,
          'blogs fetched from cache',
        );
      }
      const categories = await this.blogsService.getCategory(payload);
      await this.cacheManager.set(cacheKey, categories);
      return this.sendSuccessResponse(categories, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  @Patch('/blog-category/:id')
  async updateBlogCategory(
    @Body() payload: UpdateBlogCategoryDTO,
    @Param('id') id: string,
  ) {
    try {
      const category = await this.blogsService.updateBlogCategory(payload, id);
      return this.sendSuccessResponse(category, 'Updated Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  @Delete('/blog-category/:id')
  async deleteCategory(@Param('id') id: string) {
    try {
      const category = await this.blogsService.removeBlogCategory(id);
      return this.sendSuccessResponse(category, 'Deleted successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  // Blog  CRUD APIs

  @ApiBearerAuth()
  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async create(@Body() createBlogDto: CreateBlogDto): Promise<ResponseDTO> {
    try {
      const blogs = await this.blogsService.create(createBlogDto);
      return this.sendSuccessResponse(blogs, 'Blogs created successfully');
    } catch (error) {
      return this.sendFailedResponse({ error }, error.message);
    }
  }

  @ApiQuery({ name: 'searchName', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'blogType', type: String, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'publishedDate', type: String, required: false })
  @ApiQuery({ name: 'filterId', type: String, required: false })
  @Get()
  async findAll(@Query() queryDTO: BlogQueryDTO) {
    try {
      const cacheKey =
        Object.keys(queryDTO).length > 0
          ? `blogs_${Object.entries(queryDTO)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'blogs_all';
      const cachedblogs = await this.cacheManager.get(cacheKey);
      if (cachedblogs) {
        return this.sendSuccessResponse(
          cachedblogs,
          'blogs fetched from cache',
        );
      }
      const blogs = await this.blogsService.findAll(queryDTO);
      await this.cacheManager.set(cacheKey, blogs);
      return this.sendSuccessResponse(blogs, 'Blogs fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Get('/types')
  getTypes() {
    try {
      return this.sendSuccessResponse(BlogType, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const searchField: SlugDto = {};
      let blog;
      if (isUUID(id)) {
        searchField.id = id;
        blog = await this.blogsService.findOne(searchField);
      } else {
        searchField.name = id;
        blog = await this.blogsService.findOne(searchField);
      }
      if (!blog) return this.sendFailedResponse({}, 'No blogs found');
      return this.sendSuccessResponse(blog, 'Blog fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, 'Server Error');
    }
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    try {
      const blog = await this.blogsService.update(id, updateBlogDto);
      return this.sendSuccessResponse(blog, 'Blog updated');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.blogsService.remove(id);
      return this.sendSuccessResponse({}, 'Blog deleted');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
