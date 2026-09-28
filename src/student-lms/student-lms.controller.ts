import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { StudentLmsService } from './student-lms.service';

import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@security/decorators/roles.decorator';
import { RoleType } from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { Request } from '@security/client/request';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import ResponseHandler from '@utils/response.handler';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { CreateStudentQueryDTO } from './dto/create-query.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import {
  LastSessionDto,
  PaginationDto,
  PendingSessionDto,
  SearchBatchDto,
} from './dto/search.dto';
import { AssignmentSubmissionService } from 'assignment-submission/assignment.service';
import { SubmitDto } from 'assignment-submission/dto/submit.dto';
import {
  DueAssignmentDto,
  ListDto,
} from 'assignment-submission/dto/assignment.dto';
import { QuizAnswerDto } from 'quiz-submission/dto/submit-quiz.dto';
import { QuizSubmissionService } from 'quiz-submission/quiz-submission.service';
import { QuizService } from 'quiz/quiz.service';
import axios from 'axios';
import { CreateReferralDto } from 'referral/dto/create-referral.dto';
import { QueryReferralDTO } from 'referral/dto/query-referral.dto';
import { SessionFeedbackDto } from 'session/dto/submiit-feedback.dto';
import { SessionService } from 'session/session.service';
import { NotificationsService } from 'notifications/notifications.service';
import { ResourcesService } from 'resources/resources.service';
import { BatchService } from '@batch/batch.service';
import { FeedbackFormDto } from 'feedbacks/dto/feedback-form.dto';
import { FeedbackFormSubmitDto } from 'feedbacks/dto/feedback-submit.dto';
import {
  CourseFeedbackDto,
  SearchFeedBackDto,
} from 'feedbacks/dto/search-form.dto';
import { FeedbackService } from 'feedbacks/feedback-service';
import { ResultData } from 'aws-sdk/clients/wisdom';
import { ResultDto } from './dto/result.dto';

@UseInterceptors(TransformInterceptor)
@ApiTags('Student LMS Controller')
@Controller('student-lms')
export class StudentLmsController extends ResponseHandler {
  constructor(
    private readonly studentLmsService: StudentLmsService,
    private readonly assignmentSubmissionService: AssignmentSubmissionService,
    private readonly quizSubmissrionService: QuizSubmissionService,
    private readonly quizService: QuizService,
    private readonly sessionSerivce: SessionService,
    private readonly batchService: BatchService,
    private readonly notificationService: NotificationsService,
    private readonly feedbackService: FeedbackService,
    private readonly resourceService: ResourcesService,
  ) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('update-profile')
  async updateProfile(
    @Req() req: Request,
    @Body() updateDto: UpdateProfileDTO,
  ) {
    try {
      const result = await this.studentLmsService.updateProfile(
        req.user,
        updateDto,
      );
      return this.sendSuccessResponse(result, 'Updated Successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('get-profile')
  async findOne(@Req() req: Request) {
    try {
      const result = await this.studentLmsService.getProfile(req.user);
      return this.sendSuccessResponse(result, 'Fetched Successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('change-password')
  async updatePassword(
    @Req() req: Request,
    @Body() changeDto: ChangePasswordDTO,
  ) {
    try {
      const result = await this.studentLmsService.changePassword(
        req.user,
        changeDto,
      );
      return this.sendSuccessResponse(result, 'Password changed successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('enrolled-webinars')
  async getEnrolledWebinars(@Req() req: Request) {
    try {
      const result = await this.studentLmsService.getEnrolledWebinars(req.user);
      return this.sendSuccessResponse(result, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiQuery({ name: 'filterId', type: String, required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('upcoming-webinars')
  async getUpcomingWebinars(
    @Req() req: Request,
    @Query('filterId') filterId: string,
  ) {
    try {
      const webinars = await this.studentLmsService.getUpcomingWebinars(
        req.user,
        filterId,
      );
      return this.sendSuccessResponse(webinars, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('recent-webinars')
  async getRecentWebinars(@Req() req: Request) {
    try {
      const webinars = await this.studentLmsService.getWebinarsRecent(req.user);
      return this.sendSuccessResponse(webinars, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiQuery({ name: 'pageNo', type: Number, required: false })
  @ApiQuery({ name: 'pageLength', type: Number, required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('on-demand-webinars')
  async getOndemandWebinars(
    @Req() req: Request,
    @Query() pagination: PaginationDto,
  ) {
    try {
      const webinars = await this.studentLmsService.getOndemandWebinars(
        req.user,
        pagination,
      );
      return this.sendSuccessResponse(webinars, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('query')
  async getQueries(@Req() user: AuthEntity) {
    try {
      const queries = await this.studentLmsService.getQueries(user);
      return this.sendSuccessResponse(queries, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('query')
  async postQuery(
    @Req() user: AuthEntity,
    @Body() queryDto: CreateStudentQueryDTO,
  ) {
    try {
      const result = await this.studentLmsService.postQuery(user, queryDto);
      //query posted successfully notification
      const data: any = {
        title: 'SnowLabs Support',
        description: `New query has been raised. Query id ${result.queryId}`,
        receiverType: 'Admins',
      };
      await this.notificationService.create(data);
      return this.sendSuccessResponse(result, 'Created Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('enroll-batches')
  @ApiQuery({ name: 'courseId', required: true, type: String })
  async getEnrolledbatches(
    @Query() payload: SearchBatchDto,
    @Req() request: Request,
  ) {
    try {
      payload['authId'] = request.user.id;
      const batchDetails = await this.studentLmsService.getEnrolledbatches(
        payload,
      );
      return this.sendSuccessResponse(
        batchDetails,
        'Batches fetch Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('enroll-courses')
  async getEnrolledCourse(@Req() request: Request) {
    try {
      const courses = await this.studentLmsService.getEnrolledCourses(
        request.user.id,
      );
      return this.sendSuccessResponse(
        courses,
        'coures fetch Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('session-resourses/:id')
  async getSessionResourses(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const resources = await this.studentLmsService.getSessionResourses(id);
      return this.sendSuccessResponse(
        resources,
        'resources fetch Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('submit-assignment')
  async submitAssignment(@Body() payload: SubmitDto) {
    try {
      await this.assignmentSubmissionService.submitAssignment(payload);
      return this.sendSuccessResponse(
        {},
        'assignment submit Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('session-assignmentsAndQuizzes')
  async getQuizAndAssignments(
    @Query() payload: ListDto,
    @Req() request: Request,
  ) {
    try {
      payload['authId'] = request.user.id;
      const assignmentsPromise =
        this.assignmentSubmissionService.getAssignments(payload);
      const quizesPromise = this.quizSubmissrionService.getQuizzes(payload);
      const [assignments, quizes] = await Promise.all([
        assignmentsPromise,
        quizesPromise,
      ]);
      return this.sendSuccessResponse(
        { assignments, quizes },
        'assignment fetch Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('due-assignments')
  async dueAssignments(@Req() request: Request) {
    try {
      const result = await this.assignmentSubmissionService.dueAssignments(
        request.user.id,
      );
      return this.sendSuccessResponse(
        result,
        'due assignments fetch Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('result-quiz')
  async resultQuiz(@Body() payload: QuizAnswerDto, @Req() request: Request) {
    try {
      payload['authId'] = request.user.id;
      const result = await this.quizSubmissrionService.submitQuiz(payload);
      return this.sendSuccessResponse(
        result,
        'assignment submit Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('session-quiz/:id')
  async getQuizQuestion(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const quizQuestions = await this.quizService.getQuizQuestions(id);
      return this.sendSuccessResponse(
        quizQuestions,
        'quiz submit Successfully',
        200,
      );
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('referrals')
  async createReferral(
    @Req() req: Request,
    @Body() createRefDto: CreateReferralDto,
  ) {
    try {
      const result = await this.studentLmsService.createReferral(
        req.user,
        createRefDto,
      );
      return this.sendSuccessResponse(result, 'Created Successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @Get('referrals')
  async getReferrals(
    @Req() request: Request,
    @Query() queryDto: QueryReferralDTO,
  ) {
    try {
      const result = await this.studentLmsService.getReferrals(
        request.user,
        queryDto,
      );
      return this.sendSuccessResponse(result, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() request: Request) {
    try {
      const result = await this.studentLmsService.getDashboard(request.user);
      return this.sendSuccessResponse(result, 'Fetched Successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('session-feedback')
  async sessionFeedback(
    @Req() request: Request,
    @Body() feedbackDto: FeedbackFormSubmitDto,
  ) {
    try {
      await this.sessionSerivce.submitFeedback(request.user.id, feedbackDto);
      return this.sendSuccessResponse({}, 'Feedback  submitted');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('last-session')
  @ApiQuery({ name: 'batchId', type: String, required: true })
  async lastSession(@Query() payload: LastSessionDto) {
    try {
      const response = await this.sessionSerivce.lastSession(payload);
      return this.sendSuccessResponse(response, 'success');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('pending-session-feedback')
  @ApiQuery({ name: 'sessionId', type: String, required: true })
  async pendingSessionFeedback(
    @Query() payload: PendingSessionDto,
    @Req() request: Request,
  ) {
    try {
      const response = await this.sessionSerivce.pendingSessionFeedback(
        payload,
        request.user.id,
      );
      return this.sendSuccessResponse(response, 'success');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('session-recordings')
  @ApiQuery({ name: 'sessionId', type: String, required: true })
  async sessionRecording(@Query() payload: PendingSessionDto) {
    try {
      const response = await this.resourceService.sessionRecording(payload);
      return this.sendSuccessResponse(response, 'success');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('course-feedback')
  async courseFeedback(
    @Req() request: Request,
    @Body() feedbackDto: FeedbackFormSubmitDto,
  ) {
    try {
      await this.sessionSerivce.courseFeedback(request.user.id, feedbackDto);
      return this.sendSuccessResponse({}, 'Feedback  submitted');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('feedback-questions')
  @ApiQuery({ name: 'formType', required: false, type: String })
  async sessionFeedbackQuestions(@Query() payload: SearchFeedBackDto) {
    try {
      const questions = await this.studentLmsService.sessionFeedbackQuestions(
        payload,
      );
      return this.sendSuccessResponse(questions, 'Feedback Questions  Fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiQuery({ name: 'quizId', type: String, required: true })
  @ApiQuery({ name: 'submissionId', type: String, required: true })
  @Get('quiz-result')
  async quizResult(@Query() resultDto: ResultDto) {
    try {
      const result = await this.quizService.quizResult(resultDto);
      return this.sendSuccessResponse(result, 'Quiz Result  Fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('upcomingEvent')
  async upcomingEvent() {
    try {
      const result = await this.batchService.upcomingBatch();
      return this.sendSuccessResponse(result, 'event are  Fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('check-feedback')
  @ApiQuery({ name: 'batchId', type: String, required: true })
  async checkFeedack(
    @Req() request: Request,
    @Query() payload: CourseFeedbackDto,
  ) {
    try {
      const result = await this.feedbackService.checkFeedback(
        request.user.id,
        payload.batchId,
      );
      return this.sendSuccessResponse(result, 'success');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }
}
