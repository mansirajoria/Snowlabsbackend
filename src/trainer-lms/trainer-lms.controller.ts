import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import ResponseHandler from '@utils/response.handler';
import { RolesGuard } from '@security/guards/roles.guard';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import {
  AccessType,
  PermissionType,
  RoleType,
  TrainerQueryCategory,
  TrainerQueryStatus,
} from '@utils/enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TrainerLmsService } from '@trainer_lms/trainer-lms.service';
import { ResponseDTO } from '@utils/response.dto';
import { LoginDto } from '@auth/dto/common.dto';
import { changePasswordDTO } from '@trainer_lms/dto/change-password.dto';
import { Request } from '@security/client/request';
import { AuthGuard } from '@security/guards/auth.guard';
import { CreateTrainerQuery } from '@trainer_lms/dto/create-trainer-query.dto';
import { UpdateTrainerQueryDto } from '@trainer_lms/dto/update-trainer-query.dto';
import { CreateTrainerInvoiceDto } from './dto/create-trainer-invoice.dto';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { TrainerService } from '@trainer/trainer.service';
import { UpdateTrainerInfoDto } from '@trainer/dto/update-trainer-info.dto';
import { BatchService } from '@batch/batch.service';
import { MyWebinarFilterDTO } from './dto/my-webinar-filter.dto';
import { SessionService } from 'session/session.service';
import { ResourcesService } from 'resources/resources.service';
import { AssignmentSubmissionService } from 'assignment-submission/assignment.service';
import { AssignmentEvaluation } from 'assignment-submission/dto/assignments-evaluation..dto';
import { SearchFeedBack } from '@session/dto/search-session.dto';

@ApiTags('Trainer LMS Controller')
@UseInterceptors(TransformInterceptor)
@Controller('trainer-lms')
export class TrainerLmsController extends ResponseHandler {
  constructor(
    private readonly trainerLmsService: TrainerLmsService,
    private readonly trainerService: TrainerService,
    private readonly batchService: BatchService,
    private readonly sessionService: SessionService,
    private readonly resourseService: ResourcesService,
    private readonly assignmentService: AssignmentSubmissionService,
  ) {
    super();
  }

  /*
   * Trainer LMS
   */

  @Post('login')
  @ApiOperation({ summary: 'Login on Trainer LMS' })
  async login(@Body() req: LoginDto): Promise<ResponseDTO> {
    try {
      const token = await this.trainerLmsService.login(req);
      return this.sendSuccessResponse(token, 'Trainer Login successfull', 200);
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Trainer Profile' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerProfile(@Req() req: Request) {
    try {
      const resp = await this.trainerLmsService.trainerProfile(req.user.id);
      return this.sendSuccessResponse(resp, 'Trainer Profile');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update trainer profile info ' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async updateTrainerInfo(
    @Req() req: Request,
    @Body() payload: UpdateTrainerInfoDto,
  ) {
    try {
      const resp = await this.trainerService.updateTrainerInfo(
        req.user.id,
        payload,
      );
      return this.sendSuccessResponse(resp, 'Trainer Profile updated');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'To change the trainer password' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async changePassword(
    @Req() req: Request,
    @Body() payload: changePasswordDTO,
  ) {
    try {
      await this.trainerLmsService.changePassword(req.user.id, payload);
      return this.sendSuccessResponse({}, 'Trainer password updated');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  /*
   * Trainer Query
   */

  @Post('query')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Trainer can raise query from LMS' })
  @ApiBearerAuth()
  async createTrainerQuery(
    @Body() payload: CreateTrainerQuery,
    @Req() request: Request,
  ) {
    try {
      await this.trainerLmsService.createTrainerQuery(
        payload,
        request.user?.id,
      );
      return this.sendSuccessResponse({}, 'Trainer query created');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('query')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Trainer can see his queries' })
  @ApiBearerAuth()
  async findTrainerQueries(@Req() request: Request) {
    try {
      const queries = await this.trainerLmsService.findTrainerQueries(
        request?.user.id,
      );
      if (queries.length == 0)
        return this.sendSuccessResponse({}, 'Trainer queries found');
      return this.sendSuccessResponse(queries, 'Trainer queriesfetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   * Trainer Invoice
   */

  // Addon

  @Get('webinar/dropdown')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerWebinarToShow(@Req() request: Request) {
    try {
      const resp = await this.trainerLmsService.trainerWebinarToShow(
        request.user?.id,
      );
      return this.sendSuccessResponse(resp, 'Trainer Webinar ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('course/dropdown')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerCoursesToShow(@Req() request: Request) {
    try {
      const resp = await this.trainerLmsService.trainerCoursesToShow(
        request.user?.id,
      );
      return this.sendSuccessResponse(resp, 'Trainer Course ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('batch/dropdown/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerBatchesToShow(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      const resp = await this.trainerLmsService.trainerBatchesToShow(
        request.user?.id,
        id,
      );
      return this.sendSuccessResponse(resp, 'Trainer Batches ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('invoice')
  @UseGuards(AuthGuard)
  async createTrainerInvoice(
    @Body() payload: CreateTrainerInvoiceDto,
    @Req() request: Request,
  ) {
    try {
      await this.trainerLmsService.createTrainerInvoice(
        payload,
        request.user?.id,
      );
      return this.sendSuccessResponse({}, 'Trainer invoice query created');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('invoice')
  @UseGuards(AuthGuard)
  async trainerInvoice(@Req() request: Request) {
    try {
      const resp = await this.trainerLmsService.trainerInvoices(
        request.user?.id,
      );
      return this.sendSuccessResponse(resp, 'Trainer invoice fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  // Admin Panel

  @Post('admin/query')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin' })
  async createTrainerQueryAsAdmin(@Body() payload: CreateTrainerQuery) {
    try {
      await this.trainerLmsService.createTrainerQueryAsAdmin(payload);
      return this.sendSuccessResponse(
        {},
        'Trainer query created from admin panel',
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('admin/query')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.READ)
  @ApiBearerAuth()
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'queryId', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({
    name: 'queryCatgeory',
    required: false,
    type: 'enum',
    enum: TrainerQueryCategory,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: 'enum',
    enum: TrainerQueryStatus,
  })
  @ApiOperation({ summary: 'Admin' })
  async findAllTrainerQueryAdmin(@Query() queryParams: any) {
    try {
      const queries = await this.trainerLmsService.findAllTrainerQuery(
        queryParams,
      );
      if (queries.totalCount == 0)
        return this.sendSuccessResponse({}, 'No trainer query found');
      return this.sendSuccessResponse(queries, 'Trainer query fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('admin/query/:id')
  @UseGuards(AuthGuard)
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.READ)
  @ApiOperation({ summary: 'Admin' })
  @ApiBearerAuth()
  async findTrainerQuery(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const query = await this.trainerLmsService.findTrainerQuery(id);
      if (!query)
        return this.sendSuccessResponse({}, 'Trainer query not found');

      return this.sendSuccessResponse(query, 'Trainer query fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Patch('admin/query/:id')
  @UseGuards(AuthGuard)
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.ANNOUNCEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin' })
  async updateTrainerQuery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateTrainerQueryDto,
  ) {
    try {
      await this.trainerLmsService.updateTrainerQuery(id, payload);
      return this.sendSuccessResponse({}, 'Trainer query status updated');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   *  Trainer Webinar
   */

  @Get('webinar/my-webinar')
  @ApiOperation({ summary: 'list the trainer all webinar' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'category', required: false, type: String })
  async myWebinars(
    @Req() request: Request,
    @Query() query: MyWebinarFilterDTO,
  ) {
    try {
      const resp = await this.trainerLmsService.myWebinars(
        request.user.id,
        query,
      );
      return this.sendSuccessResponse(resp, 'Trainer webinar fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('webinar/all-webinars')
  @ApiOperation({
    summary: 'All webinar contains upcoming webinar and on-demand webinar',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async allWebinars(@Req() request: Request) {
    try {
      const resp = await this.trainerLmsService.allWebinars(request.user.id);
      return this.sendSuccessResponse(resp, 'Trainer all webinar');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  /*
   *  Trainer Batch
   */

  @Get('courses')
  @ApiOperation({ summary: 'list the trainer all courses' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async myCourses(@Req() request: Request) {
    try {
      const resp = await this.trainerLmsService.myCourses(request.user.id);
      return this.sendSuccessResponse(resp, 'Trainer courses fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'list the trainer all batches' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerBatchList(
    @Param('courseId', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    try {
      const resp = await this.batchService.trainerBatchList(
        id,
        request.user.id,
      );
      return this.sendSuccessResponse(resp, 'Batches fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'list the trainer all sessions' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerSessionList(
    @Param('batchId', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    try {
      const resp = await this.sessionService.trainerSessions(
        id,
        request.user.id,
      );
      return this.sendSuccessResponse(resp, 'Sessions fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('batch/assignments/:batchId')
  @ApiOperation({ summary: 'list the session all Assignments' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async assignmentsList(@Param('batchId', ParseUUIDPipe) id: string) {
    try {
      const resp = await this.resourseService.trainerAssignments(id);
      return this.sendSuccessResponse(resp, 'Assignmets fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('session/assignments/:assignmentId')
  @ApiOperation({ summary: 'list particular session Assignments' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async sessionAssignments(
    @Param('assignmentId', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    try {
      const resp = await this.assignmentService.sessionAssignments(
        id,
        request.user.id,
      );
      return this.sendSuccessResponse(resp, 'Assignmets fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/assignments/evaluation')
  @ApiOperation({ summary: 'evaluation of Assignments' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async assignmentsEvaluation(@Body() payload: AssignmentEvaluation) {
    try {
      await this.assignmentService.assignmentsEvaluation(payload);
      return this.sendSuccessResponse({}, 'Assignmets evaluation is done');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/dashboard')
  @ApiOperation({ summary: 'dashboard' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async dashboardData(@Req() request: Request) {
    try {
      const dashboard = await this.trainerLmsService.dashboardData(
        request.user.id,
      );
      return this.sendSuccessResponse(dashboard, 'dashboard data fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/batch-feedbacks/:batchId')
  @ApiOperation({ summary: 'dashboard' })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'pageLength', type: Number, required: false })
  @ApiQuery({ name: 'pageNo', type: Number, required: false })
  async batchFeedbacks(
    @Req() request: Request,
    @Param('batchId', ParseUUIDPipe) id: string,
    @Query() payload: SearchFeedBack,
  ) {
    try {
      const feedbacks = await this.sessionService.batchFeedbacks(
        request.user.id,
        id,
        payload,
      );
      return this.sendSuccessResponse(feedbacks, 'Feedbacks data fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/batch-calendar/:batchId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async trainerCalendar(
    @Req() request: Request,
    @Param('batchId', ParseUUIDPipe) id: string,
  ) {
    try {
      const calendar = await this.sessionService.trainerCalendar(
        id,
        request.user.id,
      );
      return this.sendSuccessResponse(calendar, 'Feedbacks data fetched');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Get('assignment/:assignmentId')
  async getAssignment(@Param('assignmentId', ParseUUIDPipe) id: string) {
    try {
      const result = await this.resourseService.getAssignment(id);
      return this.sendSuccessResponse(result, 'Assignment  Fetched');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiQuery({ name: 'filterId', type: String, required: false })
  @Get('get-upcoming')
  async getUpcomingWebinar(
    @Req() request: Request,
    @Query('filterId') filterId: string,
  ) {
    try {
      const result = await this.trainerLmsService.getUpcomingWebinarLMS(
        request.user,
        filterId,
      );
      return this.sendSuccessResponse(result, 'Successfully Fetched');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
