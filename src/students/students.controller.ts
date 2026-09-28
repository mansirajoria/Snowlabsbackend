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
  ParseUUIDPipe,
} from '@nestjs/common';
import { StudentsService } from '@students/students.service';
import { CreateStudentDto } from '@students/dto/create-student.dto';
import { UpdateStudentDto } from '@students/dto/update-student.dto';
import { StudentQuery } from '@students/dto/query-student.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import ResponseHandler from '@utils/response.handler';
import { TransformInterceptor } from '@utils/interceptors/response.interceptor';
import { getEnrollmentMailBody } from '@utils/helpers/mailbody.helper';
import { Enrollment } from '@batch/entities/enrollment.entity';
import * as moment from 'moment';
import { MailService } from '@mail/mail.service';

@UseInterceptors(TransformInterceptor)
@ApiTags('Students')
@Controller('students')
export class StudentsController extends ResponseHandler {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    try {
      const student = await this.studentsService.create(createStudentDto);
      if (student instanceof Enrollment) {
        const mailbody = getEnrollmentMailBody({
          courseName: student.batch.course.courseName,
          duration: student.batch.totalDuration,
          startDate: moment(student.batch.startDate)
            .tz(student.student.auth.timeZone || 'Asia/Calcutta')
            .format('DD/MM/YYYY'),
          startTime: moment(student.batch.startDate)
            .tz(student.student.auth.timeZone || 'Asia/Calcutta')
            .format('hh:mm a'),
          studentName: student.student.auth.name,
        });
        this.mailService.sendViaSendGrid({
          subject: 'Enrollment Mail',
          text: mailbody,
          to: student.student.auth.email,
        });
      }
      return this.sendSuccessResponse(student, 'Student created');
    } catch (error) {
      console.log(error);
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get()
  @ApiQuery({ name: 'pageLength', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiQuery({ name: 'enrollmentStatus', required: false, type: String })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() query: StudentQuery) {
    try {
      const students = await this.studentsService.findAll(query);
      return this.sendSuccessResponse(students, 'Students fetched');
    } catch (error) {
      return this.sendFailedResponse(error, error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const student = await this.studentsService.findOne(id);
      return this.sendSuccessResponse(student, 'Student fetched');
    } catch (err) {
      return this.sendFailedResponse({ err }, err.message);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    try {
      const student = await this.studentsService.update(id, updateStudentDto);
      return this.sendSuccessResponse(student, 'Student updated');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('/sendCredentials/:id')
  async handleCreds(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.studentsService.sendEmailToUser(id);
      return this.sendSuccessResponse(undefined, 'Email sent');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('/activate/:id')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.studentsService.makeActive(id);
      return this.sendSuccessResponse(null, 'Activated successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Post('/deactivate/:id')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.studentsService.makeInactive(id);
      return this.sendSuccessResponse(null, 'Deactivated successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  @Get('/certificate/generate')
  async handleCertificate() {
    try {
      // const certificate = await this.studentsService.generateCert()
      return this.sendSuccessResponse({}, 'Generated');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

  /*
   * Facebook Login flow

  @Get('/oauth/facebook')
  @UseGuards(AuthGuard('facebook'))
  async validateFbLogin() {}

  @Get('/oauth/facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async fbCallback(@Request() req) {
    try {
      const access = await this.studentsService.facebookAuth(req.user);
      return this.sendSuccessResponse(req.user, 'Login Successful');
    } catch (err) {
      console.log(err);
      return this.sendFailedResponse(err, 'Server error');
    }
  }

    *
   * Google Login flow
    *
    * 
  @Get('/oauth/google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {}

  @Get('/oauth/google/callback')
  @UseGuards(GoogleOAuthGuard)
  async google(@Request() req: CustomRequest) {
    try {
      await this.studentsService.googleAuthRegister(req.user);
      return this.sendSuccessResponse(req.user, 'Logged in successfully');
    } catch (err) {
      return this.sendFailedResponse(err, err.message);
    }
  }

     */

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const student = await this.studentsService.remove(id);
      return this.sendSuccessResponse(student, 'Student deleted');
    } catch (err) {
      return this.sendFailedResponse(err, 'Server error');
    }
  }
}
