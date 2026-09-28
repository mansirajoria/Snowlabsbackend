import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '@students/entities/student.entity';
import {
  In,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { StudentsService } from '@students/students.service';
import { StudentWorkExperience } from '@students/entities/student-work-experience.entity';
import { StudentEducation } from '@students/entities/student-education.entity';
import { ChangePasswordDTO } from './dto/change-password.dto';
import HttpException from '@utils/exceptions/HttpException';
import { hashPassword } from '@utils/helper.service';
import { compare } from 'bcryptjs';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Helpdesk } from 'query/entities/helpdesk.entity';
import { CreateStudentQueryDTO } from './dto/create-query.dto';
import { QueryService } from 'query/query.service';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { PaginationDto, SearchBatchDto } from './dto/search.dto';
import { Course } from '@courses/entities/course.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { ReferralService } from 'referral/referral.service';
import { CreateReferralDto } from 'referral/dto/create-referral.dto';
import { QueryReferralDTO } from 'referral/dto/query-referral.dto';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import {
  AssignmentEnum,
  BatchTypeEnum,
  QuizStatusType,
  ResourceType,
} from '@utils/enum';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';
import { SessionFeedbackQuestions } from 'session/entities/session-feedback-questions.entity';
import { retry, throwError } from 'rxjs';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import * as moment from 'moment';
import { FeedbackQuestion } from 'feedbacks/dto/feedback-form.dto';
import { FeedbackQuestions } from 'feedbacks/entities/feedback-questions.entity';
import { SearchFeedBackDto } from 'feedbacks/dto/search-form.dto';
import { AssignmentSubmissionService } from 'assignment-submission/assignment.service';
import { QuizSubmissionService } from 'quiz-submission/quiz-submission.service';
import { ListDto } from 'assignment-submission/dto/assignment.dto';

@Injectable()
export class StudentLmsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(ResourceEntity)
    private resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    private studentService: StudentsService,
    @InjectRepository(StudentWorkExperience)
    private readonly workRepo: Repository<StudentWorkExperience>,
    @InjectRepository(StudentEducation)
    private readonly educationRepo: Repository<StudentEducation>,
    @InjectRepository(WebinarEnrollment)
    private readonly webinarEnrollRepo: Repository<WebinarEnrollment>,
    @InjectRepository(Webinar)
    private readonly webinarRepo: Repository<Webinar>,
    @InjectRepository(FeedbackQuestions)
    private readonly feedbackRepo: Repository<FeedbackQuestions>,
    @InjectRepository(Helpdesk)
    private readonly queryRepo: Repository<Helpdesk>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionRepo: Repository<QuizSubmission>,
    @InjectRepository(QuizEntity)
    private readonly quizRepo: Repository<QuizEntity>,
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
    private readonly queryService: QueryService,
    private readonly referralService: ReferralService,
    private readonly assignmentSubmissionService: AssignmentSubmissionService,
    private readonly quizSubmissrionService: QuizSubmissionService,
  ) {}
  async updateProfile(user: AuthEntity, updateDto: UpdateProfileDTO) {
    const {
      name,
      facebookUri,
      githubUri,
      linkedInUri,
      profilePicUri,
      country,
      email,
      workExperience,
      education,
      gender,
      timeZone,
      interests,
      countryCode,
      dateOfBirth,
      trainingFundedBy,
      learningObjective,
      phoneNumber,
      newUser,
    } = updateDto;
    const student = await this.studentRepo.findOne({
      relations: ['auth', 'education', 'workExperience'],
      where: { auth: { id: user.id } },
    });
    if (phoneNumber) {
      const phoneExists = await this.authRepo.findOne({
        where: { phoneNumber, id: Not(user.id) },
      });
      console.log(phoneExists);
      if (phoneExists)
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'An account with the same phone number already exists',
        );
    }
    student.facebookUri = facebookUri;
    student.githubUri = githubUri;
    student.linkedInUri = linkedInUri;
    student.profilePicUri = profilePicUri;
    student.country = country;
    student.trainingFundedBy = trainingFundedBy;
    student.interests = interests;
    student.learningObjective = learningObjective;
    student.newUser = newUser;
    user.gender = gender;
    user.name = name;
    user.phoneNumber = phoneNumber;
    user.dateOfBirth = dateOfBirth;
    user.timeZone = timeZone;
    user.countryCode = countryCode;
    if (email) {
      const exists = await this.authRepo.findOne({ where: { email } });
      if (exists && exists.id !== user.id)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Email already exists');
      user.email = email;
    }

    await Promise.all(
      student.workExperience.map((item) =>
        this.workRepo.delete({ id: item.id }),
      ),
    );
    if (workExperience) {
      const workExp = workExperience.map((item) =>
        this.workRepo.create({ ...item }),
      );
      const savedWork = await Promise.all(
        workExp.map((item) => this.workRepo.save(item)),
      );
      student.workExperience = savedWork;
    }

    await Promise.all(
      student.education.map((item) =>
        this.educationRepo.delete({ id: item.id }),
      ),
    );
    if (education) {
      const eduCreate = education.map((item) =>
        this.educationRepo.create({ ...item }),
      );
      const savedEdu = await Promise.all(
        eduCreate.map((item) => this.educationRepo.save(item)),
      );
      student.education = savedEdu;
    }

    await this.authRepo.save(user);
    return await this.studentRepo.save(student);
  }

  async changePassword(user: AuthEntity, changeDto: ChangePasswordDTO) {
    const { currentPassword, newPassword } = changeDto;
    if (currentPassword === newPassword)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'New password cannot be same as current password',
      );
    const student = await this.studentRepo.findOne({
      relations: ['auth'],
      where: { auth: { id: user.id } },
    });
    if (!student) throw new HttpException(HttpStatus.FORBIDDEN, 'Invalid user');
    const match = await compare(currentPassword, student.auth.password);
    if (!match)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Wrong Password');
    student.auth.password = await hashPassword(newPassword);
    return await this.authRepo.save(student.auth);
  }

  async getProfile(user: AuthEntity) {
    const student = await this.studentRepo.findOne({
      relations: ['auth', 'workExperience', 'education'],
      where: { auth: { id: user.id } },
    });
    console.log("students are",student); // This will print the student object in your backend terminal
    return student;
    
    
  }

  async getEnrolledWebinars(user: AuthEntity) {
    const webinarEnrollments = await this.webinarEnrollRepo.find({
      where: {
        auth: { id: user.id },
        webinar: { endDate: MoreThan(new Date()) },
      },
      relations: { webinar: { trainer: { auth: true }, category: true } },
    });
    const webinars = webinarEnrollments.map((item) => item.webinar);
    return webinars;
  }

  //       slugName: true,
  //       trainer: {
  //         id: true,
  //         auth: {
  //           id: true,
  //           name: true,
  //         },
  //       },
  //     },
  //   });

  //   return webinarQuery;
  // }
  async getWebinarsRecent(user: AuthEntity) {
    try {
      // Fetch enrolled webinar IDs using TypeORM's query builder and raw result
      const enrolledWebinars = await this.webinarEnrollRepo
        .createQueryBuilder('we')
        .select('we.webinarId')
        .where('we.authId = :userId', { userId: user.id })
        .getRawMany(); // Use getRawMany() for raw result

      // Map the raw results to get an array of webinarId values
      const enrolledWebinarIds = enrolledWebinars.map((item) => item.webinarId);

      // Fetch upcoming webinars, excluding the ones the user is enrolled in
      const webinarQuery = await this.webinarRepo.find({
        where: {
          id: Not(In(enrolledWebinarIds)),
          startDate: MoreThan(new Date()),
        },
        take: 3,
        order: { startDate: 'ASC' },
        relations: {
          trainer: { auth: true },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          featuredImage: true,
          meetingUrl: true,
          slugName: true,
          description: true,
          whatYouWillLearnSection: true,
          metaDescription: true,
          trainer: {
            id: true,
            auth: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Return the result
      return webinarQuery;
    } catch (error) {
      console.error('Error fetching webinars:', error);
      throw new Error('Failed to fetch webinars.');
    }
  }

  async getUpcomingWebinars(user: AuthEntity, filterId?: string) {
    const enrollments = await this.webinarEnrollRepo.query(
      ` select we."webinarId" from "webinar-enrollment" we where we."authId" = $1`,
      [user.id],
    );
    const exceptionId: string[] = enrollments.map((item) => item.webinarId);

    if (filterId) exceptionId.push(filterId);

    const webinarQuery = await this.webinarRepo.find({
      where: {
        id: Not(In(exceptionId)),
        startDate: MoreThan(new Date()),
        published: true,
      },
      relations: { trainer: { auth: true } },
    });

    return webinarQuery;
  }

  async getOndemandWebinars(user: AuthEntity, pagination: PaginationDto) {
    const { pageNo = 1, pageLength = 10 } = pagination;
    if (pageNo < 1 || pageLength < 1) {
      throw new HttpException(
        400,
        'Page number and length must be positive numbers',
      );
    }
    // Fetch enrolled webinars for the user
    // const enrolledWebinars = await this.webinarEnrollRepo.find({
    //   where: { auth: { id: user.id } },
    //   relations: { webinar: true },
    // });

    // Query webinars with only necessary fields
    const [webinars, totalCount] = await this.webinarRepo.findAndCount({
      where: {
        endDate: LessThan(new Date()), // Only fetch past webinars
        published: true,
      },
      relations: {
        trainer: { auth: true }, // Fetch trainer details
        category: true, // Fetch webinar category
      },
      select: {
        id: true, // Webinar ID
        title: true, // Webinar title
        startDate: true, // Webinar start time
        endDate: true, // Webinar end time
        profilePic: true,
        slugName: true,
        meetingUrl: true,
        category: { name: true },
        trainer: {
          auth: { name: true }, // Trainer's name
          qualification: true, // Trainer's qualification
        },
      },
      take: pageLength,
      skip: (pageNo - 1) * pageLength,
      order: { startDate: 'DESC' },
    });

    return { webinars, totalCount };
  }

  async getQueries(user: AuthEntity) {
    const queries = await this.queryRepo.find({
      where: { student: { auth: { id: user.id } } },
      order: { createdDate: 'desc' },
    });
    return queries;
  }

  async postQuery(user: AuthEntity, queryDto: CreateStudentQueryDTO) {
    const student = await this.studentRepo.findOne({
      where: { auth: { id: user.id } },
    });
    if (!student) throw new HttpException(HttpStatus.FORBIDDEN, 'Invalid user');
    const { query, queryType } = queryDto;
    const studentQuery = await this.queryService.createHelpdesk({
      query,
      queryType,
      studentId: student.id,
    });
    return studentQuery;
  }

  async getEnrolledbatches(payload: SearchBatchDto) {
    let batchDetails;
    const student = await this.studentRepo.findOne({
      where: { auth: { id: payload.authId } },
    });

    if (!student) throw new HttpException(HttpStatus.FORBIDDEN, 'Invalid user');
    const course = await this.courseRepo.findOne({
      where: { id: payload.courseId },
    });
    if (!course)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid course');

    const checkDate = moment(new Date()).endOf('day');
    if (payload.batchType === BatchTypeEnum.LIVE) {
      const batchDetailsQuery = this.enrollmentRepo
        .createQueryBuilder('enrollment')
        .leftJoinAndSelect('enrollment.student', 'student')
        .where('student.id=:id', { id: student.id })
        .leftJoinAndSelect('enrollment.batch', 'batch')
        .andWhere('batch.batchType=:batchType', {
          batchType: BatchTypeEnum.LIVE,
        })
        .leftJoinAndSelect('batch.course', 'course')
        .andWhere('course.id=:courseId', { courseId: payload.courseId })
        .leftJoinAndSelect('batch.trainer', 'trainer')
        .leftJoinAndSelect('trainer.auth', 'auth')
        .leftJoinAndSelect('batch.sessions', 'sessions')
        //.andWhere('sessions.sessionDate < :date', { date: checkDate })
        .andWhere('sessions.isPublished = :isPublished', { isPublished: true })
        .orderBy('sessions.index', 'DESC');

      batchDetails = await batchDetailsQuery.getMany();
    }

    if (!batchDetails?.length) {
      const batchDetailsQuery = this.enrollmentRepo
        .createQueryBuilder('enrollment')
        .leftJoinAndSelect('enrollment.student', 'student')
        .where('student.id=:id', { id: student.id })
        .leftJoinAndSelect('enrollment.batch', 'batch')
        .andWhere(
          payload.batchType === BatchTypeEnum.LIVE
            ? 'batch.batchType=:LiveBatch'
            : 'batch.batchType=:SelfBatch',
          {
            LiveBatch: BatchTypeEnum.LIVE,
            SelfBatch: BatchTypeEnum.SELF,
          },
        )
        .leftJoinAndSelect('batch.course', 'course')
        .andWhere('course.id=:courseId', { courseId: payload.courseId })
        .leftJoinAndSelect('batch.trainer', 'trainer')
        .leftJoinAndSelect('trainer.auth', 'auth')
        .leftJoinAndSelect('batch.sessions', 'sessions')
        .andWhere('sessions.isPublished = :isPublished', { isPublished: true })
        // .andWhere('sessions.sessionDate < :date', { date: new Date() })
        .orderBy('sessions.index', 'ASC');
      payload.batchType === BatchTypeEnum.LIVE ? batchDetailsQuery.take(1) : '';
      batchDetails = await batchDetailsQuery.getMany();
    }
    const totalQuiz = this.quizRepo.count({
      where: {
        session: { batch: { id: batchDetails[0]?.batch?.id } },
        isPublish: true,
      },
    });
    const totalAssingment = this.resourceRepo.count({
      where: {
        resourceType: ResourceType.ASSIGNMENT,
        session: { batch: { id: batchDetails[0]?.batch?.id } },
        isPublish: true,
      },
    });
    const [quizCount, assignmentCount] = await Promise.all([
      totalQuiz,
      totalAssingment,
    ]);

    const sessions = await this.sessionRepo.find({
      where: { batch: { id: batchDetails[0]?.batch?.id } },
    });
    let submitCount = 0;
    let totalCount = 0;
    const assignmentPromise = [];

    sessions.forEach((item) => {
      const resoursePayload: ListDto = {
        authId: payload.authId,
        sessionId: item.id,
      };
      const assignmentsPromise =
        this.assignmentSubmissionService.getAssignments(resoursePayload);
      const quizesPromise =
        this.quizSubmissrionService.getQuizzes(resoursePayload);
      assignmentPromise.push(assignmentsPromise);
      assignmentPromise.push(quizesPromise);
    }),
      (await Promise.all(assignmentPromise)).forEach((item) => {
        if (item.length > 0) {
          item.forEach((item: AssignmentSubmission | QuizSubmission) => {
            if (
              item &&
              (item.status === AssignmentEnum.SUBMITTED ||
                item.status === QuizStatusType.ATTEMPTED)
            )
              submitCount++;
          });
        }
      });

    totalCount = assignmentCount + quizCount;

    const completionPercent = (submitCount / totalCount) * 100;

    const batches = await this.courseProgress(
      batchDetails,
      payload.authId,
      payload.batchType,
    );

    if (payload.batchType === BatchTypeEnum.SELF) {
      const progress = completionPercent || 0;
      batches[0]['courseProgress'] = +progress.toFixed(2);
    }
    return { batches, quizCount, assignmentCount };
  }

  async getEnrolledCourses(id: string): Promise<Enrollment[]> {
    const student = await this.studentRepo.findOne({
      where: { auth: { id } },
    });
    if (!student) throw new HttpException(HttpStatus.FORBIDDEN, 'Invalid user');
    const currentDate: Date = new Date();
    const courses = await this.enrollmentRepo.query(
      `select c."courseName", b."batchId",b."batchType",
      c.id as "courseId" 
      from enrollment e 
      join student s on s.id=e."studentId"
      join batch b on b.id =e."batchId" 
      join course c on c.id =b."courseId"
      where s.id =$1 and e."deletedAt" is null and e."accessStatus" = 'true'`,
      [student.id],
    );
    return courses;
  }

  async getSessionResourses(
    id: string,
  ): Promise<{ studyMaterial: ResourceEntity[]; links: ResourceEntity[] }> {
    const sessionsDetails = await this.sessionRepo.findOne({ where: { id } });
    if (!sessionsDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid session');
    const [studyMaterial, links] = await Promise.all([
      this.resourceRepo.find({
        where: {
          session: { id },
          isPublish: true,
          resourceType: ResourceType.STUDY_MATERIAL,
        },
      }),
      this.resourceRepo.find({
        where: {
          session: { id },
          isPublish: true,
          resourceType: ResourceType.LINKS,
        },
      }),
    ]);
    return { studyMaterial, links };
  }

  async getReferrals(user: AuthEntity, querydto: QueryReferralDTO) {
    const referrals = await this.referralService.findAll(user, querydto);
    return referrals;
  }

  async createReferral(user: AuthEntity, createDto: CreateReferralDto) {
    const referral = await this.referralService.create({
      ...createDto,
      authId: user.id,
    });
    return referral;
  }

  async getDashboard(user: AuthEntity) {
    const assignmentPending = this.assignmentSubmissionRepo.count({
      where: {
        student: { auth: { id: user.id } },
        status: AssignmentEnum.PENDING,
      },
    });
    const assignmentTotal = this.assignmentSubmissionRepo.count({
      where: { student: { auth: { id: user.id } } },
    });
    const quizPending = this.quizSubmissionRepo.count({
      where: {
        student: { auth: { id: user.id } },
        status: QuizStatusType.NOT_ATTEMPTED,
      },
    });
    const quizTotal = this.quizSubmissionRepo.count({
      where: { student: { auth: { id: user.id } } },
    });

    const courseCompletedCount = await this.enrollmentRepo.count({
      where: {
        student: { auth: { id: user.id } },
        batch: { endDate: LessThan(new Date()) },
      },
    });
    const courseTotal = this.enrollmentRepo.query(
      `select count(distinct(c.id)) as courseCount  from enrollment e join batch b on b.id =e."batchId" join course c on c.id =b."courseId" join student s on s.id =e."studentId" 
    join  auth a on a.id =s."authId" where a.id =$1 and e."deletedAt" is null group by c.id `,
      [user.id],
    );
    const upcoming = this.sessionRepo.find({
      where: {
        batch: { enroll: { student: { auth: { id: user.id } } } },
        sessionDate: MoreThanOrEqual(new Date()),
      },
      relations: { batch: { course: true, trainer: { auth: true } } },
      order: { sessionDate: 'ASC' },
      take: 3,
    });
    const courseQuery = `with SessionCount as 
(select s2."batchId", c."courseName", c."id", a."fullName" , count(case when s2."sessionEndDate"<$1 then 1 else null END) as completeSession, 
count(s2.id) as totalSession from enrollment e 
join student s on s.id = e."studentId" 
join batch b on e."batchId" = b.id 
join trainer t on b."trainerId" = t.id 
join auth a on a.id = t."authId"
join course c on b."courseId" = c.id 
join auth on s."authId" = auth.id 
join "session" s2 on s2."batchId" = b.id 
where auth.id = $2 and b."endDate">$1 and e."deletedAt" IS NULL
group by s2."batchId", c."courseName", a."fullName" ,c."id" ) 
select "batchId", "courseName", "fullName", "id" as "courseId",round( (completeSession::numeric / totalSession * 100),0) AS completePercentage, completeSession, totalSession
from SessionCount;`;
    const completeQuery = `with SessionCount as 
(select s2."batchId", c."courseName", a."fullName" , c."id", b."batchType", count(case when s2."sessionEndDate"<$1 then 1 else null END) as completeSession, 
count(s2.id) as totalSession from enrollment e 
join student s on s.id = e."studentId" 
join batch b on e."batchId" = b.id 
join trainer t on b."trainerId" = t.id 
join auth a on a.id = t."authId"
join course c on b."courseId" = c.id 
join auth on s."authId" = auth.id 
join "session" s2 on s2."batchId" = b.id 
where auth.id = $2 and  b."endDate"<$1 and  e."deletedAt" IS NULL
group by s2."batchId", c."courseName", a."fullName",c."id", b."batchType") 
select "batchId", "courseName", "fullName","id" as "courseId", "batchType",  round( (completeSession::numeric / totalSession * 100),0) AS completePercentage, completeSession, totalSession
from SessionCount;`;
    const courseProgress = this.enrollmentRepo.query(courseQuery, [
      new Date(),
      user.id,
    ]);
    const courseCompletePromise = this.educationRepo.query(completeQuery, [
      new Date(),
      user.id,
    ]);
    const [
      assignmentPendingCount,
      assignmentTotalCount,
      quizPendingCount,
      quizTotalCount,
      courseCompletionCount,
      courseTotalCount,
      upcomingEvents,
      courseProgressData,
      courseCompleted,
    ] = await Promise.all([
      assignmentPending,
      assignmentTotal,
      quizPending,
      quizTotal,
      courseCompletedCount,
      courseTotal,
      upcoming,
      courseProgress,
      courseCompletePromise,
    ]);
    return {
      assignmentPendingCount,
      assignmentTotalCount,
      quizPendingCount,
      quizTotalCount,
      courseCompletionCount,
      courseTotalCount: courseTotalCount[0]?.coursecount,
      upcomingEvents,
      courseProgressData,
      courseCompleted,
    };
  }

  async sessionFeedbackQuestions(
    payload: SearchFeedBackDto,
  ): Promise<FeedbackQuestions[]> {
    return await this.feedbackRepo.find({
      where: { feedbackForm: { type: payload.formType } },
    });
  }

  async courseProgress(
    batchDetails: Enrollment[],
    authId: string,
    batchType: BatchTypeEnum,
  ): Promise<Enrollment[]> {
    let courseProgress;
    const studentDetails = await this.studentRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (batchType === BatchTypeEnum.LIVE) {
      const courseProgressQuery = `with SessionCount as 
    (select s2."batchId", c."courseName", a."fullName" , count(case when s2."sessionEndDate"<$1 then 1 else null END) as completeSession, 
    count(s2.id) as totalSession from enrollment e 
    join student s on s.id = e."studentId" 
    join batch b on e."batchId" = b.id 
    join trainer t on b."trainerId" = t.id 
    join auth a on a.id = t."authId"
    join course c on b."courseId" = c.id 
    join auth on s."authId" = auth.id 
    join "session" s2 on s2."batchId" = b.id 
    where s.id = $2 and b.id =$3 and  e."deletedAt" IS NULL and s2."deletedAt" IS NULL
    group by s2."batchId", c."courseName", a."fullName"  ) 
    select "courseName",  round( (completeSession::numeric / totalSession * 100),0) AS completePercentage, completeSession, totalSession
    from SessionCount`;
      courseProgress = await this.enrollmentRepo.query(courseProgressQuery, [
        new Date(),
        studentDetails.id,
        batchDetails[0].batch.id,
      ]);
      batchDetails[0]['courseProgress'] = courseProgress[0];
    } else {
      batchDetails[0]['courseProgress'] = '0';
    }

    return batchDetails;
  }
}
