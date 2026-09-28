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
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { QuizService } from './quiz.service';
import {
  BulkUploadQuestion,
  CreateQuizDto,
  QuizQuestion,
} from './dto/create-quiz.dto';
import { ResponseDTO } from '@utils/response.dto';
import { TakeQuizDto } from './dto/user-quiz-answer.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { SearchQuizDto } from './dto/search-quiz.dto';
import { EditQuizDto, EditQuizQuestion } from './dto/edit-quiz.dto';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import { AccessType, PermissionType, RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';

@ApiTags('Quiz-Controller')
@Controller('quiz')
@UseInterceptors(TransformInterceptor)
export class QuizController extends ResponseHandler {
  constructor(private readonly quizService: QuizService) {
    super();
  }

  @Post('/create')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async createSessionQuiz(
    @Body() payloadData: QuizQuestion,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.quizService.createSessionQuiz(payloadData);
      return this.sendSuccessResponse(
        resp,
        'Session quiz created successfully !',
        201,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async getQuizById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const resp = await this.quizService.getQuiz(id);
      return this.sendSuccessResponse(resp, 'Quiz fetched successfully !');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'quizName', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: true, type: String })
  async sessionQuizList(@Query() payload: SearchQuizDto) {
    try {
      const quizzes = await this.quizService.sessionQuizList(payload);
      return this.sendSuccessResponse(
        quizzes,
        'quiz fetch successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
  @Post('question/add/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async addQuestion(
    @Body() payloadData: BulkUploadQuestion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      const result = await this.quizService.addQuestion(id, payloadData);
      return this.sendSuccessResponse(
        result,
        'Question added successfully !',
        201,
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
  async removeQuiz(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.quizService.removeQuiz(id);
      return this.sendSuccessResponse({}, 'Quiz delete successfully !', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
  @Delete('questions/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async removeQuestion(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.quizService.removeQuestion(id);
      return this.sendSuccessResponse(
        {},
        'Question delete successfully !',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async editQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payloadData: EditQuizDto,
  ) {
    try {
      await this.quizService.editQuiz(id, payloadData);
      return this.sendSuccessResponse({}, 'Quiz edit  successfully !', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('/question/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async editQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payloadData: EditQuizQuestion,
  ) {
    try {
      await this.quizService.editQuestion(id, payloadData);
      return this.sendSuccessResponse({}, 'Question edit  successfully !', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }
}
