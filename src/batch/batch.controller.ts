import {
  Controller,
  Post,
  UseInterceptors,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Req,
  UseGuards,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import {
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import ResponseHandler from '@utils/response.handler';
import { CreateBatchDto } from './dto/createBatch.dto';
import { ResponseDTO } from '@utils/response.dto';
import { ChangeEnrollStatus, EnrollStudentDto } from './dto/enrollStudent.dto';
import { SearchBatchDto } from './dto/searchBatch.dto';
import { UpdateBatchDto } from './dto/updateBatch.dto';
import { Request } from '@security/client/request';
import {
  CheckAccess,
  CheckPermissions,
  Roles,
} from '@security/decorators/roles.decorator';
import {
  AccessType,
  BatchTypeEnum,
  PermissionType,
  RoleType,
} from '@utils/enum';
import { AuthGuard } from '@security/guards/auth.guard';
import { RolesGuard } from '@security/guards/roles.guard';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { ShiftBatchDto, ShiftBatchListDto } from './dto/shitBatch.dto';
import { AddStudentBatchDTO } from './dto/add-student.dto';
import { ChangeBatchDTO } from './dto/change-batch.dto';
import {
  getChangeBatchMailBody,
  getTrainerEnrollmentMailBody,
} from '@utils/helpers/mailbody.helper';
import { MailService } from '@mail/mail.service';
import { SessionService } from '@session/session.service';
import * as moment from 'moment';
import { BatchType } from 'typeorm';

@ApiTags('Batch-Controller')
@ApiBearerAuth()
@UseInterceptors(TransformInterceptor)
@Controller({ path: 'batch', version: '1' })
export class BatchController extends ResponseHandler {
  constructor(
    private readonly batchService: BatchService,
    private readonly mailService: MailService,
    private readonly sessionService: SessionService,
  ) {
    super();
  }

  @ApiQuery({ name: 'batchId', required: true, type: String })
  @ApiQuery({ name: 'courseId', required: true, type: String })
  @Get('/common-batch')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  async commanBatch(@Query() payload: ShiftBatchListDto): Promise<ResponseDTO> {
    try {
      const result = await this.batchService.commanBatch(payload);
      return this.sendSuccessResponse(result, 'batch fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('list/:courseId')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async courseBatchList(
    @Param('courseId', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const result = await this.batchService.courseBatchList(id);
      return this.sendSuccessResponse(result, 'batch fetched successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch('revoke-access/:enrollmentId')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  async revokeAccess(@Param('enrollmentId') enrollmentId: string) {
    try {
      const response = await this.batchService.revokeAccess(enrollmentId);

      return this.sendSuccessResponse(response, 'Access Revoked');
    } catch (error) {
      return this.sendFailedResponse({}, error.message);
    }
  }

  @Post('/create')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async create(@Body() createBatchDto: CreateBatchDto): Promise<ResponseDTO> {
    try {
      const resp =
        createBatchDto.batchType === BatchTypeEnum.LIVE
          ? await this.batchService.create(createBatchDto)
          : await this.batchService.createSelfBatch(createBatchDto);
      const mailbody = getTrainerEnrollmentMailBody();
      this.mailService.sendViaSendGrid({
        subject: 'Trainer Instruction',
        text: mailbody,
        to: resp.trainer.auth.email,
      });
      return this.sendSuccessResponse(resp, 'Batch created successfully', 201);
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse({}, error.message);
    }
  }

  @Get('/')
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'pageLength', required: false, type: Number })
  @ApiQuery({ name: 'studentName', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  async batchOfList(@Query() payload: SearchBatchDto): Promise<ResponseDTO> {
    try {
      const batchList = await this.batchService.batchOfList(payload);
      return this.sendSuccessResponse(
        { batchList },
        'Batch list fetched successfully',
        200,
      );
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/dropdown')
  async batchDropdown(): Promise<ResponseDTO> {
    try {
      const resp = await this.batchService.batchListDowndown();
      return this.sendSuccessResponse(resp, 'Batch list ');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Post('/enroll-student')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async enrollStudnet(
    @Body() enrollStudentDto: EnrollStudentDto,
  ): Promise<ResponseDTO> {
    try {
      await this.batchService.enrollStudent(enrollStudentDto);
      return this.sendSuccessResponse({}, 'Student enroll  successfully', 200);
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/enroll-students')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiQuery({ name: 'pageLength', required: false, type: Number })
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'studentName', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiQuery({ name: 'accessStat', required: false, type: Boolean })
  async enrollStudentList(
    @Query() payload: SearchBatchDto,
  ): Promise<ResponseDTO> {
    try {
      const studentList = await this.batchService.enrollStudentList(payload);
      return this.sendSuccessResponse(
        studentList,
        'Student Fetch successfully',
        200,
      );
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get('/shift-batch-list')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.READ)
  @ApiQuery({ name: 'batchId', required: true, type: String })
  @ApiQuery({ name: 'courseId', required: true, type: String })
  async shiftBatchList(@Query() req: ShiftBatchListDto): Promise<ResponseDTO> {
    try {
      const result = await this.batchService.shiftBatchList(req);
      return this.sendSuccessResponse(result, 'batch fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/shift-batch')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async shiftBatch(@Body() payload: ShiftBatchDto): Promise<ResponseDTO> {
    try {
      const result = await this.batchService.shiftBatch(payload);
      const mailbody = getChangeBatchMailBody({
        name: result.newEnrollment.student.auth.name,
        newDate: moment(result.newEnrollment.batch.startDate)
          .tz(result.newEnrollment.student.auth.timeZone || 'Asia/Calcutta')
          .format('DD/MM/YYYY'),
        newTime: moment(result.newEnrollment.batch.startDate)
          .tz(result.newEnrollment.student.auth.timeZone || 'Asia/Calcutta')
          .format('hh:mm a'),
        oldDate: moment(result.oldBatch.startDate)
          .tz(result.newEnrollment.student.auth.timeZone || 'Asia/Calcutta')
          .format('DD/MM/YYYY'),
        oldTime: moment(result.oldBatch.startDate)
          .tz(result.newEnrollment.student.auth.timeZone || 'Asia/Calcutta')
          .format('hh:mm a'),
      });
      this.mailService.sendViaSendGrid({
        subject: 'New Batch Details',
        text: mailbody,
        to: result.newEnrollment.student.auth.email,
      });
      return this.sendSuccessResponse({}, 'batch shift successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Patch('enroll-students/:enrollId')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  async changeStateOfEnrollment(
    @Param('enrollId') id: string,
    @Body() paload: ChangeEnrollStatus,
  ) {
    try {
      await this.batchService.changeStateOfEnrollment(id, paload);
      return this.sendSuccessResponse({}, ' Change status successfully', 200);
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/today-session')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.CALENDER)
  @CheckAccess(AccessType.READ)
  async todaySessions(): Promise<ResponseDTO> {
    try {
      const batchDetails = await this.batchService.todaySessions();
      return this.sendSuccessResponse(
        { batchDetails },
        'Batch Fetch successfully',
        200,
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
  async findOne(@Param('id') id: string) {
    try {
      const batch = await this.batchService.findOne(id);
      return this.sendSuccessResponse(batch, 'Fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async update(
    @Param('id') id: string,
    @Body() updatebatchDto: UpdateBatchDto,
  ) {
    try {
      const batch =
        updatebatchDto.batchType &&
        updatebatchDto.batchType === BatchTypeEnum.SELF
          ? await this.batchService.updateSelfBatch(id, updatebatchDto)
          : await this.batchService.updateBatch(id, updatebatchDto);

          const mailbody = getTrainerEnrollmentMailBody();
          this.mailService.sendViaSendGrid({
            subject: 'Trainer Instruction',
            text: mailbody,
            to: batch.trainer.auth.email,
          });  
      return this.sendSuccessResponse(batch, 'Updated successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async delete(@Req() req: Request, @Param('id') id: string) {
    try {
      await this.batchService.deleteBatch(id);
      return this.sendSuccessResponse({}, 'Batch delete successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Delete('/enroll-student/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.COURSES)
  @CheckAccess(AccessType.WRITE)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async unenrollStudent(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      await this.batchService.unenrollStudent(id);
      return this.sendSuccessResponse({}, 'Unenrolled successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Get('/upcoming/:id')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.USER_MANAGEMENT)
  @CheckAccess(AccessType.WRITE)
  @ApiParam({ name: 'id', required: true, type: UUID })
  async upcoming(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.batchService.upcomingBatches(id);
      return this.sendSuccessResponse(response, 'Fetch successfully');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/en')
  async enro(@Body() req: any) {
    try {
      const { batchId, studentId } = req;
      await this.batchService.enrollPendingstatus(batchId, studentId);
      return this.sendSuccessResponse({}, 'batch fetched successfully');
    } catch (err) {
      return this.sendFailedResponse({}, err.message);
    }
  }

  @Post('/add-student')
  async addStudent(@Body() payload: AddStudentBatchDTO) {
    try {
      const result = await this.batchService.addStudentToBatch(payload);
      return this.sendSuccessResponse(result, 'Student Added');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('/change-batch')
  @Roles(RoleType.ADMIN, RoleType.SUB_ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @CheckPermissions(PermissionType.BATCH)
  @CheckAccess(AccessType.WRITE)
  async changeBatch(@Body() payload: ChangeBatchDTO) {
    try {
      const result = await this.batchService.studentChangeBatch(payload);
      return this.sendSuccessResponse(result, 'Student Batch Changed');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }
}
