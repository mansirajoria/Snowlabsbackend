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
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { CreateMockTestCategoryDto } from './dto/create-mockTest-category.dto';
import { CreateMockTestDto, MockTestQuestion } from './dto/create-mockTest.dto';
import { MockTestQuery } from './dto/query-mockTest.dto';
import { TakeMockTestDto } from './dto/take-mockTest.dto';
import { MockTestService } from './mockTest.service';
import { SearchMockTestDto } from './dto/search-test.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { EditMockTest, EditQuestion } from './dto/edit-mockTest.dto';
import { MockTestAnswerDto } from './dto/result-mockTest.dto';
import { isUUID } from 'class-validator';
import { SlugDto } from '@courses/interfaces/course.interface';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { RolesGuard } from '@security/guards/roles.guard';
import { AuthGuard } from '@security/guards/auth.guard';
import { Cache } from 'cache-manager';

@UseInterceptors(TransformInterceptor)
@ApiTags('Mock-Test-Controller')
@Controller('mock-test')
export class MockTestController extends ResponseHandler {
  constructor(
    private readonly mockTestService: MockTestService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  /*
   * MockTest-Category CRUD
   */

  @Post('category')
  async createMockTestCategory(@Body() payloadData: CreateMockTestCategoryDto) {
    try {
      const resp = await this.mockTestService.createMockTestCategory(
        payloadData,
      );
      return this.sendSuccessResponse(
        resp,
        'Mock-Test Category created successfully !',
      );
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('category')
  async findAllMockTestCategory() {
    try {
      const cacheKey = 'mockTest_category';
      const cachedMockTest = await this.cacheManager.get(cacheKey);
      if (cachedMockTest) {
        return this.sendSuccessResponse(
          cachedMockTest,
          'MockTest category fetched from cache',
        );
      }
      const resp = await this.mockTestService.findAllMockTestCategory();
      await this.cacheManager.set(cacheKey, resp);
      return this.sendSuccessResponse(
        resp,
        'MockTest category fetched successfully !',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * MockTest CRUD
   */
  @ApiBearerAuth()
  @Post('/add')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async createMockTest(@Body() payloadData: MockTestQuestion) {
    try {
      const mockTest = await this.mockTestService.createMockTest(payloadData);
      return this.sendSuccessResponse(
        mockTest,
        'Mock test created successfully !',
        201,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Post('question/add/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async addQuestion(
    @Body() payloadData: CreateMockTestDto,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      const mockTestQuestion = await this.mockTestService.addQuestion(
        id,
        payloadData,
      );
      return this.sendSuccessResponse(
        mockTestQuestion,
        'Question added successfully !',
        201,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/')
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'testName', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  async mockTestList(@Query() payload: SearchMockTestDto) {
    try {
      const cacheKey =
        Object.keys(payload).length > 0
          ? `mockTest_${Object.entries(payload)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'mockTest_all';
      const cachedMockTest = await this.cacheManager.get(cacheKey);
      if (cachedMockTest) {
        return this.sendSuccessResponse(
          cachedMockTest,
          'Mock test fetched from cache',
        );
      }
      const mockTests = await this.mockTestService.mockTestList(payload);
      await this.cacheManager.set(cacheKey, mockTests);
      return this.sendSuccessResponse(
        mockTests,
        'Mock test fetch successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/web')
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'testName', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  async mockTestList2(@Query() payload: SearchMockTestDto) {
    try {
      const cacheKey =
        Object.keys(payload).length > 0
          ? `mockTest_${Object.entries(payload)
              .map(([key, value]) => `${key}-${value}`)
              .join('_')}`
          : 'mockTest_web';
      const cachedMockTest = await this.cacheManager.get(cacheKey);
      if (cachedMockTest) {
        return this.sendSuccessResponse(
          cachedMockTest,
          'Mock test fetched from cache',
        );
      }
      const mockTests = await this.mockTestService.mockTestList2(payload);
      await this.cacheManager.set(cacheKey, mockTests);
      return this.sendSuccessResponse(
        mockTests,
        'Mock test fetch successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async removeTest(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.mockTestService.removeMockTest(id);
      return this.sendSuccessResponse(
        {},
        'Mock test delete successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Delete('questions/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async removeQuestion(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.mockTestService.removeQuestion(id);
      return this.sendSuccessResponse(
        {},
        'Question delete successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  async findTest(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const cacheKey = `mockTest_${id}`;

      // Retrieve data from cache
      const cachedMockTest = await this.cacheManager.get(cacheKey);
      if (cachedMockTest) {
        return this.sendSuccessResponse(
          JSON.parse(cachedMockTest as string),
          'Mock test fetched from cache',
        );
      }
      const testDetails = await this.mockTestService.findTest(id);
      await this.cacheManager.set(cacheKey, JSON.stringify(testDetails));
      return this.sendSuccessResponse(
        testDetails,
        'Mock test fetched successfully!',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(null, 'An unexpected error occurred');
    }
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async editTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payloadData: EditMockTest,
  ) {
    try {
      await this.mockTestService.editTest(id, payloadData);
      return this.sendSuccessResponse(
        {},
        'Mock test edit  successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Patch('/question/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BlOGS)
  @CheckAccess(AccessType.WRITE)
  async editQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payloadData: EditQuestion,
  ) {
    try {
      await this.mockTestService.editQuestion(id, payloadData);
      return this.sendSuccessResponse({}, 'Question edit  successfully !', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @ApiBearerAuth()
  @Post('/results/:mockTestId')
  async mockResults(
    @Param('mockTestId', ParseUUIDPipe) id: string,
    @Body() payloadData: MockTestAnswerDto,
  ) {
    try {
      const result = await this.mockTestService.mockResult(id, payloadData);
      return this.sendSuccessResponse(
        result,
        'Result fetch successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
  @Get('/questions/:mockTestId')
  async mockTestQuestions(@Param('mockTestId') id: string) {
    try {
      const searchField: SlugDto = {};

      // since id coming in param can be a slug string
      if (isUUID(id)) searchField['id'] = id;
      else searchField['name'] = id;

      const result = await this.mockTestService.mockTestQuestions(searchField);
      return this.sendSuccessResponse(
        result,
        'Questions fetch successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
