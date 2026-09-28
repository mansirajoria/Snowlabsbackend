import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BatchEntity } from './entities/batch.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BatchType,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
  W,
} from 'typeorm';
import { CreateBatchDto } from './dto/createBatch.dto';
import * as moment from 'moment';
import { Trainer } from '@trainer/entities/trainer.entity';
import HttpException from '@utils/exceptions/HttpException';
import { Course } from '@courses/entities/course.entity';
import { SearchBatchDto } from './dto/searchBatch.dto';
import { ChangeEnrollStatus, EnrollStudentDto } from './dto/enrollStudent.dto';
import { Student } from '@students/entities/student.entity';
import { Enrollment } from './entities/enrollment.entity';
import {
  AssignmentEnum,
  BatchTypeEnum,
  ClassRoomType,
  FeedBackType,
  QuizStatusType,
  SessionType,
  StudentType,
  enrollmentType,
} from '@utils/enum';
import { convertISTtoUTC, convertTo24HourSuffix } from '@utils/weekday.service';
import { UpdateBatchDto } from './dto/updateBatch.dto';
import { MicrosoftTeamService } from 'microsoft-team/microsoft-team.service';
// import { access } from 'fs';
import { Webinar } from '@webinars/entities/webinar.entity';
import { CreateMeetDto } from 'microsoft-team/dto/meet.dto';
import { MeetDto } from 'microsoft-team/dto/response.dto';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { SessionService } from 'session/session.service';
import { NotificationsService } from '@notifications/notifications.service';
import { SessionEntity } from '@session/entities/session.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import { MailService } from '@mail/mail.service';
import { ShiftBatchDto, ShiftBatchListDto } from './dto/shitBatch.dto';
import { CreateSessionDto } from '@session/dto/create-session.dto';
import { ConfigService } from '@nestjs/config';
import { TrainerCost } from '@trainer/entities/trainer-cost.entity';
import { AddStudentBatchDTO } from './dto/add-student.dto';
import { ChangeBatchDTO } from './dto/change-batch.dto';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Trainer)
    private trainerRepo: Repository<Trainer>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Enrollment)
    private enrollRepo: Repository<Enrollment>,
    private readonly microsoftTeamService: MicrosoftTeamService,
    @InjectRepository(Webinar)
    private webinarRepo: Repository<Webinar>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(QuizEntity)
    private quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizSubmission)
    private quizSubmission: Repository<QuizSubmission>,
    @InjectRepository(ResourceEntity)
    private resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(AssignmentSubmission)
    private assignmentRepo: Repository<AssignmentSubmission>,
    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
    @InjectRepository(TrainerCost)
    private trainerCostRepo: Repository<TrainerCost>,
    @InjectRepository(TrainingPlan)
    private trainingPlanRepo: Repository<TrainingPlan>,
    private readonly sessionService: SessionService,
    private readonly notificationRepo: NotificationsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}
  // function for generate first batch id
  generateFirstBatchId(
    input: string,
    count: number,
    startTime: string,
  ): string {
    const suffix: string = convertTo24HourSuffix(startTime);
    if (input.includes(' ')) {
      const words: string[] = input.split(' ');
      const code: string = words.map((word) => word.charAt(0)).join('');
      return `${code}-${count}-${suffix}`;
    }
    return `${input}-${count}-${suffix}`;
  }

  //function for generate batch id after first
  generateBatchId(input: string, startTime: string): string {
    const suffix: string = convertTo24HourSuffix(startTime);
    const regex = /(\D+)(\d+)(\D+)/; // batch id regex
    const matches = regex.exec(input);

    if (matches && matches.length === 4) {
      const prefix = matches[1];
      const number = parseInt(matches[2]);
      const incrementedNumber = number + 1;
      const output = `${prefix}${incrementedNumber}-${suffix}`;
      return output;
    }

    return input;
  }

  /**
   * Creates a new BatchEntity and saves it to the database.
   * @param batchDto The data to create a new batch.
   * @returns The created BatchEntity object.
   */
  async create(batchDto: CreateBatchDto): Promise<BatchEntity> {
    // Retrieve the Outlook credential from the database
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    const costDetails = await this.trainerCostRepo.findOne({
      where: { id: batchDto.costId },
    });
    if (!costDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid cost Id');
    // Retrieve the Course details with related CourseCategory
    const courseDetails: Course = await this.courseRepo.findOne({
      where: {
        id: batchDto.courseId,
        trainingPlans: { name: 'live', publish: true },
      },
      relations: ['courseCategory', 'trainingPlans'],
    });
    if (batchDto.studentType === StudentType.INDIVIDUAL) {
      // Validate if Course exists
      if (!courseDetails)
        throw new HttpException(401, 'Please add Live Training Plan');
    }
    if (!courseDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'course not found');

    // Retrieve the Trainer details with related TrainerSkills and Skill
    const findTrainer: Trainer = await this.trainerRepo.findOne({
      where: { id: batchDto.trainerId },
      relations: ['trainerSkills', 'trainerSkills.skill'],
    });

    // Validate if Trainer exists
    if (!findTrainer) throw new HttpException(404, 'Trainer not found');

    let batchId: string;

    // Find the latest BatchEntity with given Course
    const latestBatch: BatchEntity = await this.batchRepo
      .createQueryBuilder('batch')
      .orderBy('batch.createdDate', 'DESC')
      .leftJoinAndSelect('batch.course', 'course')
      .where('course.id = :courseId', { courseId: batchDto.courseId })
      .andWhere('batch.batchType =:batchType', {
        batchType: BatchTypeEnum.LIVE,
      })
      .select('batch.batchId AS "batchId"')
      .getRawOne();

    // Generate batchId based on the latest BatchEntity and startTime
    if (latestBatch) {
      batchId = this.generateBatchId(latestBatch.batchId, batchDto.startTime);
    } else {
      batchId = this.generateFirstBatchId(
        courseDetails.courseName,
        1,
        batchDto.startTime,
      );
    }
    let meetDetails: MeetDto;
    // Create a new BatchEntity instance
    const batch = new BatchEntity();
    const gstAmount = Math.round(
      batchDto.inrAmount *
        (this.configService.get('payment.gst', { infer: true }) / 100 || 0.18),
    );
    console.log(batchId, 77777);
    // Populate BatchEntity properties from batchDto
    batch.course = courseDetails;
    batch.studentType = batchDto.studentType;
    batch.minSize = batchDto.minSize;
    batch.maxSize = batchDto.maxSize;
    batch.trainer = findTrainer;
    batch.classRoomType = batchDto.classRoomType;
    batch.platform = batchDto.platform;
    batch.meetLocation = batchDto.meetLocation;
    batch.meetLink = batchDto.meetLink;
    batch.filledSeats = 0;
    batch.feeType = batchDto.feeType;
    batch.inrAmount = batchDto.inrAmount;
    batch.cost = costDetails;
    batch.gstCharge = gstAmount;
    batch.dollorAmount = batchDto.dollorAmount;
    batch.totalDuration = batchDto.totalDuration;
    batch.totalSession = batchDto.totalSession;
    batch.sessionType = batchDto.sessionType;
    batch.meetingId = batchDto.meetingId;
    batch.skills = batchDto.skills;
    batch.batchId = batchId;
    batch.courseCategory = courseDetails.courseCategory;
    batch.plans = courseDetails.trainingPlans[0];

    // Convert startDate and endDate to UTC based on startTime and endTime
    batch.startDate = new Date(
      convertISTtoUTC(batchDto.startDate, batchDto.startTime),
    );
    batch.endDate = new Date(
      convertISTtoUTC(batchDto.endDate, batchDto.endTime),
    );
    // Set weekDays based on sessionType
    if (batchDto.sessionType === SessionType.WEEKEND) {
      batchDto.weekDays = [6, 0];
    }
    if (batchDto.sessionType === SessionType.WEEKDAY) {
      batchDto.weekDays = [1, 2, 3, 4, 5];
    }

    // Prepare CreateMeetDto to create a meeting using MicrosoftTeamService
    const createMeetDto: CreateMeetDto = {
      startDate: batchDto.startDate,
      endDate: batchDto.endDate,
      startTime: batchDto.startTime,
      endTime: batchDto.endTime,
      trainerId: batchDto.trainerId,
      weekDays: batchDto.weekDays,
      sessionType: batchDto.sessionType,
      courseName: courseDetails.courseName,
      batchName: batchId,
    };
    if (batchDto.classRoomType === ClassRoomType.ONLINE) {
      // Create a meeting using MicrosoftTeamService
      meetDetails = await this.microsoftTeamService.createMeeting(
        createMeetDto,
        credential.outLookToken,
      );

      // Validate if meeting creation was successful
      if (!meetDetails) throw new HttpException(400, 'Batch not created');
    }
    // Set weekDays property for the BatchEntity
    batch.weekDays = batchDto.weekDays;
    const batchExists = await this.batchRepo.find({
      where: [
        {
          startDate: MoreThanOrEqual(batch.startDate),
          endDate: LessThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate: LessThanOrEqual(batch.startDate),
          endDate: MoreThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate:
            MoreThanOrEqual(batch.startDate) && LessThanOrEqual(batch.endDate),
          endDate: MoreThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate: LessThanOrEqual(batch.startDate),
          endDate:
            LessThanOrEqual(batch.endDate) && MoreThanOrEqual(batch.startDate),
          trainer: { id: batchDto.trainerId },
        },
      ],
    });
    if (batchExists.length) {
      const batchStartHour =
        batch.startDate.getHours() * 60 + batch.startDate.getMinutes();
      const batchEndHour =
        batch.endDate.getHours() * 60 + batch.endDate.getMinutes();
      batchExists.forEach((item) => {
        const startTime =
          item.startDate.getHours() * 60 + item.startDate.getMinutes();
        const endTime =
          item.endDate.getHours() * 60 + item.endDate.getMinutes();
        if (startTime >= batchStartHour && endTime <= batchEndHour)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (startTime <= batchStartHour && endTime >= batchEndHour)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (
          startTime >= batchStartHour &&
          startTime <= batchEndHour &&
          endTime >= batchEndHour
        )
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (
          startTime <= batchStartHour &&
          endTime <= batchEndHour &&
          endTime >= batchStartHour
        )
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
      });
    }
    const webinarExists = await this.webinarRepo.find({
      where: [
        {
          startDate: MoreThanOrEqual(batch.startDate),
          endDate: LessThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate: LessThanOrEqual(batch.startDate),
          endDate: MoreThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate:
            MoreThanOrEqual(batch.startDate) && LessThanOrEqual(batch.endDate),
          endDate: MoreThanOrEqual(batch.endDate),
          trainer: { id: batchDto.trainerId },
        },
        {
          startDate: LessThanOrEqual(batch.startDate),
          endDate:
            LessThanOrEqual(batch.endDate) && MoreThanOrEqual(batch.startDate),
          trainer: { id: batchDto.trainerId },
        },
      ],
    });
    if (webinarExists.length) {
      const batchStartHour =
        batch.startDate.getHours() * 60 + batch.startDate.getMinutes();
      const batchEndHour =
        batch.endDate.getHours() * 60 + batch.endDate.getMinutes();
      webinarExists.forEach((item) => {
        const startTime =
          item.startDate.getHours() * 60 + item.startDate.getMinutes();
        const endTime =
          item.endDate.getHours() * 60 + item.endDate.getMinutes();
        if (startTime >= batchStartHour && endTime <= batchEndHour)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (startTime <= batchStartHour && endTime >= batchEndHour)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (
          startTime >= batchStartHour &&
          startTime <= batchEndHour &&
          endTime >= batchEndHour
        )
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
        if (
          startTime <= batchStartHour &&
          endTime <= batchEndHour &&
          endTime >= batchStartHour
        )
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            'Cannot schedule at this time',
          );
      });
    }

    // Create a new BatchEntity with additional properties and save it to the database
    const createdBatch = this.batchRepo.create({
      ...batch,
      meetingId: meetDetails?.id,
      meetLink: meetDetails?.link,
      callId: meetDetails?.callId,
    });

    // Save the created BatchEntity
    const saveBatch: BatchEntity = await this.batchRepo.save(createdBatch);
    // Validate if the save operation was successful
    if (!saveBatch) throw new HttpException(400, 'Batch not created');

    // find all events of batch using graph apis
    if (batchDto.classRoomType === ClassRoomType.ONLINE) {
      const events = await this.microsoftTeamService.occurrenceOfEvent(
        credential?.outLookToken,
        meetDetails?.id,
        batchDto?.startDate,
        batchDto?.endDate,
      );
      await this.sessionService.createSession(saveBatch, events);
      if (batchDto.sessionType === SessionType.CUSTOM) {
        saveBatch.startDate = events[0].start.dateTime;
        await this.batchRepo.save(saveBatch);
      }
    }
    const result = await this.notificationRepo.create({
      title: 'Batch Scheduled',
      description: `${saveBatch.batchId} has been scheduled  from ${saveBatch.startDate} to ${saveBatch.endDate}`,
      receiverType: 'Trainers',
      trainerId: saveBatch.trainer.id,
    });
    // Return the saved BatchEntity
    return await this.batchRepo.findOne({
      where: { id: saveBatch.id },
      relations: { trainer: { auth: true } },
    });
  }

  /**
   * Retrieves a list of BatchEntity objects based on search criteria.
   * @param searchQuery The search criteria to filter batch list.
   * @returns An object containing batchList, total, totalBatch, activeBatch, and activeStudent.
   */
  async batchOfList(searchQuery: SearchBatchDto): Promise<{
    batchList: BatchEntity[];
    total: number;
    totalBatch: number;
    activeBatch: number;
    activeStudent: number;
    trainingPlans: TrainingPlan[];
  }> {
    // Determine the pagination limit and page number
    const { pageLength = 10, pageNo = 1 } = searchQuery;

    // Get the current date
    const currentDate: Date = new Date(moment().toString());

    // If courseId is provided in the searchQuery, check if the course exists
    if (searchQuery.courseId) {
      const courseDetails = await this.courseRepo.findOne({
        where: { id: searchQuery.courseId },
      });
      if (!courseDetails) throw new HttpException(404, 'Course not found');
    }

    // Extract the courseId from the searchQuery
    const courseId = searchQuery.courseId;

    // Build the query for fetching batchList
    const query = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoin('batch.course', 'course')
      .select([
        'auth.fullName AS "trainerName"',
        'batch.id AS "id"',
        'auth.isActive AS "accessStat"',
        'batch.startDate AS "startDate"',
        'batch.endDate AS "endDate"',
        'batch.filledSeats AS "filledSeats"',
        'batch.maxSize AS "maxSize"',
        'batch.totalDuration As "duration"',
        'batch.batchId As "batchId"',
        'batch.meetingId AS "meetingId"',
        'batch.batchType AS "batchType"',
        'batch.isWeb AS "isWeb"',
        `CASE 
        WHEN batch.startDate > :currentDate THEN 'upcoming'
        WHEN batch.startDate <= :currentDate AND batch.endDate >= :currentDate THEN 'ongoing'
        WHEN batch.batchType =:batchType THEN 'ongoing'
        ELSE 'closed'
       END AS "batchStatus"`,
      ])
      .orderBy('batch.lastModifiedDate', 'DESC')
      .setParameter('currentDate', new Date())
      .setParameter('batchType', BatchTypeEnum.SELF);

    // Apply filters to the query based on searchQuery parameters
    if (searchQuery.courseId) {
      query.where('course.id = :courseId', { courseId });
    }
    if (searchQuery.batchId) {
      query.andWhere('batch.batchId ILike :batchId', {
        batchId: `%${searchQuery.batchId}%`,
      });
    }

    // Build additional queries for calculating totalBatch, activeBatch, and activeStudent
    const totalBatchQuery = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoin('batch.course', 'course')
      .where('course.id = :courseId', { courseId });

    const activeBatchQuery = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoin('batch.course', 'course')
      .where('course.id = :courseId', { courseId })
      .andWhere('batch.startDate < :currentDate', { currentDate })
      .andWhere('batch.endDate > :currentDate', { currentDate });

    const studentQuery = this.enrollRepo
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.batch', 'batch')
      .leftJoin('batch.course', 'course')
      .where('course.id=:courseId', { courseId });

    // Apply pagination to the main batch query
    query.limit(pageLength).skip((pageNo - 1) * pageLength);
    const trainingPlansPromise = this.trainingPlanRepo.find({
      where: [
        { name: 'live', course: { id: courseId } },
        { name: 'self', course: { id: courseId } },
      ],
    });
    // Execute all queries in parallel using Promise.all
    const [
      batchList,
      total,
      totalBatch,
      activeBatch,
      activeStudent,
      trainingPlans,
    ] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
      totalBatchQuery.getCount(),
      activeBatchQuery.getCount(),
      studentQuery.getCount(),
      trainingPlansPromise,
    ]);

    // Return the results as an object
    return {
      batchList,
      total,
      totalBatch,
      activeBatch,
      activeStudent,
      trainingPlans,
    };
  }

  async revokeAccess(enrollmentId: string): Promise<{ message: string }> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    enrollment.accessStatus = false;
    await this.enrollmentRepository.save(enrollment);

    return { message: 'Temporary access revoked successfully' };
  }

  async batchListDowndown() {
    const query = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoin('batch.course', 'course')
      .select([
        'auth.fullName AS "trainerName"',
        'batch.id AS "id"',
        'auth.isActive AS "accessStat"',
        'batch.startDate AS "startDate"',
        'batch.endDate AS "endDate"',
        'batch.filledSeats AS "filledSeats"',
        'batch.maxSize AS "maxSize"',
        'batch.totalDuration As "duration"',
        'batch.batchId As "batchId"',
        `CASE 
        WHEN batch.startDate > :currentDate THEN 'upcoming'
        WHEN batch.startDate <= :currentDate AND batch.endDate >= :currentDate THEN 'ongoing'
        ELSE 'closed'
       END AS "batchStatus"`,
      ])
      .orderBy('batch.lastModifiedDate', 'DESC')
      .setParameter('currentDate', new Date());

    return await query.getRawMany();
  }

  async enrollPendingstatus(batchId: string, studentId: string) {
    const studentDetails = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    const quizQuery = `select q.id, s.id as "sessionId" from batch b join 
    "session" s on s."batchId" =b.id join
     quiz q on q."sessionId" =s.id where 
     b.id =$1 and q."isPublish"=true;`;
    const assignmentQuery = ` SELECT r.id, s.id AS "sessionId"
     FROM batch b
     JOIN "session" s ON s."batchId" = b.id
     join resource r on r."sessionId" =s.id
     WHERE b.id = $1 and r."resourceType"= 'ASSIGNMENT' and r."isPublish"=true;`;
    const [quiz, assignment] = await Promise.all([
      this.batchRepo.query(quizQuery, [batchId]),
      this.quizSubmission.query(assignmentQuery, [batchId]),
    ]);
    if (quiz.length) {
      const quizDetailsPromises = quiz.map(async (quizItem) => {
        const [quizDetails, sessionDetails] = await Promise.all([
          this.quizRepo.findOne({ where: { id: quizItem.id } }),
          this.sessionRepo.findOne({ where: { id: quizItem.sessionId } }),
        ]);

        const quizSubmission = new QuizSubmission();
        quizSubmission.quiz = quizDetails;
        quizSubmission.student = studentDetails;
        quizSubmission.status = QuizStatusType.NOT_ATTEMPTED;
        quizSubmission.session = sessionDetails;
        quizSubmission.isPublish = true;

        await this.quizSubmission.save(quizSubmission);
      });
      await Promise.all(quizDetailsPromises);
    }
    if (assignment.length) {
      const assignmentDetailsPromises = assignment.map(
        async (assignmentItem) => {
          const [assignmentDetails, sessionDetails] = await Promise.all([
            this.resourceRepo.findOne({ where: { id: assignmentItem.id } }),
            this.sessionRepo.findOne({
              where: { id: assignmentItem.sessionId },
            }),
          ]);
          const assignmentSubmisson = new AssignmentSubmission();
          assignmentSubmisson.assignment = assignmentDetails;
          assignmentSubmisson.session = sessionDetails;
          assignmentSubmisson.student = studentDetails;
          assignmentSubmisson.status = AssignmentEnum.PENDING;
          assignmentSubmisson.isPublish = true;
          await this.assignmentRepo.save(assignmentSubmisson);
        },
      );
      await Promise.all(assignmentDetailsPromises);
    }
  }

  /**
   * Enrolls a student into a batch and updates related entities.
   * @param enrollStudentDto The data to enroll a student into a batch.
   */
  async enrollStudent(enrollStudentDto: EnrollStudentDto): Promise<Enrollment> {
    // Retrieve the BatchEntity based on the provided batchId
    const batchDetails = await this.batchRepo.findOne({
      where: { id: enrollStudentDto.batchId },
      relations: { course: true },
    });

    // Validate if the BatchEntity exists
    if (!batchDetails) throw new HttpException(404, 'Batch not found');

    const enrollmentCheck = await this.enrollRepo.findOne({
      where: {
        batch: {
          course: { id: batchDetails.course.id },
          batchType: batchDetails.batchType,
        },
        student: { id: enrollStudentDto.studentId },
      },
    });

    if (enrollmentCheck && !enrollStudentDto.isShifted)
      throw new HttpException(HttpStatus.CONFLICT, 'User Already Enrolled');

    // Retrieve the Outlook credential from the database
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });

    // Retrieve the StudentEntity with related AuthEntity
    const studentDetails = await this.studentRepo.findOne({
      where: { id: enrollStudentDto.studentId },
      relations: ['auth'],
    });

    // Validate if the StudentEntity exists
    if (!studentDetails) throw new HttpException(404, 'Student not found');

    // Check if the batch is already full

    if (
      batchDetails.filledSeats === batchDetails.maxSize &&
      batchDetails.batchType === BatchTypeEnum.LIVE
    ) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'No more seats are available',
      );
    }

    // Create a new Enrollment entity and populate its properties
    const newEnrollStudent = new Enrollment();
    newEnrollStudent.batch = batchDetails;
    newEnrollStudent.student = studentDetails;
    newEnrollStudent.startDate = new Date();
    newEnrollStudent.endDate = moment().add(365, 'days').endOf('day').toDate();

    // Save the new Enrollment entity to the database
    const createEnroolment = this.enrollRepo.create(newEnrollStudent);
    const savedEnrollment = await this.enrollRepo.save(createEnroolment);
    const enrollment = await this.enrollRepo.findOne({
      where: { id: savedEnrollment.id },
      relations: { student: { auth: true }, batch: { course: true } },
    });

    // Enroll the student into the corresponding meeting in Microsoft Teams
    if (batchDetails.batchType === BatchTypeEnum.LIVE) {
      const isMeetUpdate =
        await this.microsoftTeamService.enrollStudentIntoEvent(
          batchDetails.meetingId,
          credential.outLookToken,
          studentDetails.auth.name,
          studentDetails.auth.email,
        );

      // Validate if the enrollment update in Microsoft Teams was successful
      if (!isMeetUpdate) throw new HttpException(400, 'Something went wrong');

      // Update the batch and student details
      if (batchDetails.filledSeats === batchDetails.maxSize - 1) {
        batchDetails.isBatchFull = true;
      }
      batchDetails.filledSeats++;
    }
    studentDetails.enrollmentType = enrollmentType.ENROLLED;

    // Save both batch and student entities in parallel
    await Promise.all([
      this.batchRepo.save(batchDetails),
      this.studentRepo.save(studentDetails),
      this.enrollPendingstatus(
        enrollStudentDto.batchId,
        enrollStudentDto.studentId,
      ),
    ]);
    return enrollment;
  }

  /**
   * Retrieves a list of Enrollment objects based on search criteria.
   * @param searchDto The search criteria to filter the student enrollment list.
   * @returns An object containing studentList and total.
   */
  async enrollStudentList(
    searchDto: SearchBatchDto,
  ): Promise<{ studentList: Enrollment[]; total: number }> {
    const { pageLength = 10, pageNo = 1 } = searchDto;
    // If batchId is provided in the searchDto, check if the batch exists
    if (searchDto.batchId) {
      const batchDetails = await this.batchRepo.findOne({
        where: { id: searchDto.batchId },
      });

      // Validate if the batch exists
      if (!batchDetails) throw new HttpException(404, 'Batch not found');
    }

    // If courseId is provided in the searchDto, check if the course exists
    if (searchDto.courseId) {
      const couseDetails = await this.courseRepo.findOne({
        where: { id: searchDto.courseId },
      });

      // Validate if the course exists
      if (!couseDetails) throw new HttpException(404, 'Course not found');
    }

    // Extract the courseId from the searchDto
    const courseId = searchDto.courseId;

    // Determine the pagination limit and page number

    // Build the query to fetch studentList
    const query = this.enrollRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('student.auth', 'auth')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .leftJoinAndSelect('batch.course', 'course')
      .select([
        'enrollment.id AS "id"',
        'student.studentId AS "studentId"',
        'auth.fullName AS "name"',
        'course.courseName AS "course"',
        'batch.batchId AS "batchId"',
        'enrollment.accessStatus AS "accessStat"',
        'enrollment.startDate AS "startDate"',
        'enrollment.endDate AS "endDate"',
        'enrollment.deletedAt IS NOT NULL AS isDelete',
        'auth.id AS "authId"',
        'student.id AS"studentId"',
        'course.id AS "courseId"',
        'student.country AS "country"',
        'student.countryFlag AS "countryFlag"',
        'student.studentId AS "studentShowId"',
      ]);

    // Apply filters to the query based on searchDto parameters
    if (searchDto.studentName) {
      query.where('auth.fullName ILike :name', {
        name: `%${searchDto.studentName}%`,
      });
    }
    if (searchDto.studentId)
      query.andWhere('student.studentId=:studentId', {
        studentId: searchDto.studentId,
      });
    if (searchDto.batchId) {
      query.andWhere('batch.id = :batchId', { batchId: searchDto.batchId });
    }
    if (searchDto.accessStat)
      query.andWhere('enrollment.accessStatus=:accessStatus', {
        accessStatus: searchDto.accessStat,
      });
    if (courseId) {
      query.andWhere('course.id = :courseId', { courseId });
    }

    // Apply pagination to the query

    // Execute the query to fetch the studentList and total count
    const [studentList, total] = await Promise.all([
      query
        .take(pageLength)
        .skip((pageNo - 1) * pageLength)
        .getRawMany(),
      query.getCount(),
    ]);

    // Return the results as an object
    return { studentList, total };
  }

  async changeStateOfEnrollment(id: string, payload: ChangeEnrollStatus) {
    const enrollment = await this.enrollRepo.findOne({ where: { id } });
    if (!enrollment)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid enrollment');
    enrollment.accessStatus = payload.accessStat;
    await this.enrollRepo.save(enrollment);
  }
  /**
   * Retrieves a list of BatchEntity objects and total counts based on sessions occurring today.
   * @returns An object containing batchList, totalSession, and totalWebinar.
   */
  async todaySessions(): Promise<{
    batchList: BatchEntity[];
    totalSession: number;
    totalWebinar: number;
  }> {
    // Get the start and end dates for the current day
    const endDate: Date = new Date(moment().endOf('day').toString());
    const startDate: Date = new Date(moment().startOf('day').toString());
    const query = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.sessionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('session.batch', 'batch')
      .leftJoinAndSelect('batch.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoinAndSelect('batch.course', 'course')
      .leftJoinAndSelect('batch.enroll', 'enrollments')
      .select([
        'auth.fullName AS trainerName',
        'batch.id AS id',
        'batch.batchId AS batchId',
        'batch.startDate AS startDate',
        'batch.endDate AS endDate',
        'batch.sessionType AS sessionType',
        'course.courseName AS courseName',
        'COUNT(enrollments.id) AS enrollmentCount',
      ])
      .andWhere('session.deletedAt is null')
      .andWhere('auth.fullName is not null')
      .groupBy(
        'auth.fullName, batch.id, batch.batchId, batch.startDate, batch.endDate, batch.sessionType, course.courseName',
      );

    // Build the query for fetching totalWebinar
    const webinarQuery = this.webinarRepo
      .createQueryBuilder('webinar')
      .where('webinar.endDate <= :endDate', { endDate })
      .andWhere('webinar.startDate >= :startDate', { startDate });

    // Execute both queries in parallel using Promise.all
    const [batchList, totalSession, totalWebinar] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
      webinarQuery.getCount(),
    ]);

    // Return the results as an object
    return { batchList, totalSession, totalWebinar };
  }

  /**
   * Retrieves a BatchEntity based on the provided id.
   * @param id The id of the batch to retrieve.
   * @returns The BatchEntity object.
   */
  async findOne(id: string): Promise<BatchEntity> {
    // Retrieve the BatchEntity with related Trainer, Course, and Auth entities
    const batch: any = await this.batchRepo
      .createQueryBuilder('batch')
      .where('batch.id = :id', { id })
      .leftJoinAndSelect('batch.trainer', 'trainer')
      .leftJoinAndSelect('batch.course', 'course')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoinAndSelect('batch.cost', 'cost')
      .orderBy('batch.lastModifiedDate', 'DESC')
      .getOne();

    // Validate if the BatchEntity exists
    if (!batch) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Batch Id');
    }

    const currentDate = new Date();
    let batchStatus = 'closed';
    if (batch.startDate > currentDate) {
      batchStatus = 'upcoming';
    } else if (
      (batch.BatchType =
        BatchTypeEnum.SELF ||
        (batch.startDate <= currentDate && batch.endDate >= currentDate))
    ) {
      batchStatus = 'ongoing';
    }

    const overallRatingQuery = `SELECT 
    AVG(sf.rating) as rating
  FROM
    "session" s
  JOIN
    "feedback-form-submission" sf ON s.id = sf."sessionId"
  JOIN
    batch b ON s."batchId" = b.id
  WHERE
    b."trainerId" =$1 AND sf."type"=$2 AND b.id=$3
  `;
    const [overallRating] = await this.sessionRepo.query(overallRatingQuery, [
      batch.trainer.id,
      FeedBackType.POST_SESSION,
      id,
    ]);

    batch.batchStatus = batchStatus;
    batch.trainerRating = overallRating?.rating || 0;

    return batch;
  }

  /**
   * Updates a BatchEntity with the provided id and data.
   * @param id The id of the batch to update.
   * @param updateWebinarDto The data to update the batch.
   * @returns The updated BatchEntity.
   */
  async updateBatch(id: string, updateWebinarDto: UpdateBatchDto) {
    // Retrieve the BatchEntity with related Trainer, Course, and Auth entities
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['trainer', 'course', 'trainer.auth'],
    });

    // Retrieve the Outlook credential from the database
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });

    // Validate if the BatchEntity exists
    if (!batch) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid id');
    }

    // Get previous start and end times for potential updates in Microsoft Teams
    const prevStartTime = batch.startDate.toISOString().split('T')[1];
    const prevEndTime = batch.endDate.toISOString().split('T')[1];

    // Initialize variables for potential updates in Microsoft Teams
    let teamStartDate: Date;
    let teamEndDate: Date;
    let newTrainerEmail: string;
    let oldTrainerEmail: string;
    let newTrainerName: string;

    // Extract properties from the updateWebinarDto
    const {
      minSize,
      maxSize,
      platform,
      classRoomType,
      feeType,
      inrAmount,
      dollorAmount,
      startDate,
      endDate,
      startTime,
      endTime,
      sessionType,
      trainerId,
      skills,
      totalDuration,
      weekDays,
      totalSession,
    } = updateWebinarDto;

    // Update properties in the batch entity
    batch.minSize = minSize;
    batch.maxSize = maxSize;
    batch.platform = platform;
    batch.classRoomType = classRoomType;
    batch.feeType = feeType;
    batch.inrAmount = inrAmount;
    batch.dollorAmount = dollorAmount;
    batch.totalSession = totalSession;
    if (sessionType === SessionType.WEEKEND) {
      batch.weekDays = [6, 0];
    }
    if (sessionType === SessionType.WEEKDAY) {
      batch.weekDays = [1, 2, 3, 4, 5];
    }
    // Handle start date and end date updates
    if (startDate) {
      teamStartDate = batch.startDate = new Date(
        startTime
          ? convertISTtoUTC(startDate, startTime)
          : Date.parse(`${startDate}T${prevStartTime}`),
      );
    }
    if (endDate) {
      teamEndDate = batch.endDate = new Date(
        endTime
          ? convertISTtoUTC(endDate, endTime)
          : Date.parse(`${endDate}T${prevEndTime}`),
      );
    }
    if (!startDate && endDate) {
      const prevStartDate = batch.startDate.toISOString().split('T')[0];
      teamStartDate = batch.startDate = new Date(
        startTime
          ? convertISTtoUTC(prevStartDate, startTime)
          : Date.parse(`${prevStartDate}T${prevStartTime}`),
      );
    }
    if (!endDate && startDate) {
      const prevEndDate = batch.endDate.toISOString().split('T')[0];
      teamEndDate = batch.endDate = new Date(
        endTime
          ? convertISTtoUTC(prevEndDate, endTime)
          : Date.parse(`${prevEndDate}T${prevEndTime}`),
      );
    }
    if (!startDate && !endDate) {
      const prevStartDate = batch.startDate.toISOString().split('T')[0];
      teamStartDate = batch.startDate = new Date(
        startTime
          ? convertISTtoUTC(prevStartDate, startTime)
          : Date.parse(`${prevStartDate}T${prevStartTime}`),
      );
      const prevEndDate = batch.endDate.toISOString().split('T')[0];
      teamEndDate = batch.endDate = new Date(
        endTime
          ? convertISTtoUTC(prevEndDate, endTime)
          : Date.parse(`${prevEndDate}T${prevEndTime}`),
      );
    }

    // Update other properties
    batch.sessionType = sessionType;
    batch.skills = skills;
    batch.totalDuration = totalDuration;
    if (weekDays?.length) batch.weekDays = weekDays;

    // Retrieve the new TrainerEntity if trainerId is provided, otherwise use the existing trainer
    const trainer = trainerId
      ? await this.trainerRepo.findOne({
          where: { id: trainerId },
          relations: ['auth'],
        })
      : batch.trainer;

    // Validate if the TrainerEntity exists
    if (!trainer) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Trainer ID');
    }

    // Handle Trainer updates for potential updates in Microsoft Teams
    if (trainerId) {
      newTrainerEmail = trainer.auth.email;
      newTrainerName = trainer.auth.name;
      oldTrainerEmail = batch.trainer.auth.email;
    }

    // Update the batch's trainer
    batch.trainer = trainer;

    // Prepare data for potential updates in Microsoft Teams
    const updateTeamBatch = {
      startDate: teamStartDate,
      endDate: teamEndDate,
      newTrainerEmail,
      newTrainerName,
      oldTrainerEmail,
      weekDays: weekDays?.length ? weekDays : batch.weekDays,
    };

    // Perform updates in Microsoft Teams if relevant data is provided
    if (
      startDate ||
      endDate ||
      startTime ||
      endTime ||
      trainerId ||
      weekDays?.length
    ) {
      const batchExists = await this.batchRepo.find({
        where: [
          {
            startDate: MoreThanOrEqual(updateTeamBatch.startDate),
            endDate: LessThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
            id: Not(id),
          },
          {
            startDate: LessThanOrEqual(updateTeamBatch.startDate),
            endDate: MoreThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
            id: Not(id),
          },
          {
            startDate:
              MoreThanOrEqual(updateTeamBatch.startDate) &&
              LessThanOrEqual(updateTeamBatch.endDate),
            endDate: MoreThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
            id: Not(id),
          },
          {
            startDate: LessThanOrEqual(updateTeamBatch.startDate),
            endDate:
              LessThanOrEqual(updateTeamBatch.endDate) &&
              MoreThanOrEqual(updateTeamBatch.startDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
            id: Not(id),
          },
        ],
      });
      if (batchExists.length) {
        const batchStartHour =
          updateTeamBatch.startDate.getHours() * 60 +
          updateTeamBatch.startDate.getMinutes();
        const batchEndHour =
          updateTeamBatch.endDate.getHours() * 60 +
          updateTeamBatch.endDate.getMinutes();
        batchExists.forEach((item) => {
          const startTime =
            item.startDate.getHours() * 60 + item.startDate.getMinutes();
          const endTime =
            item.endDate.getHours() * 60 + item.endDate.getMinutes();
          if (startTime >= batchStartHour && endTime <= batchEndHour)
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (startTime <= batchStartHour && endTime >= batchEndHour)
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (
            startTime >= batchStartHour &&
            startTime <= batchEndHour &&
            endTime >= batchEndHour
          )
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (
            startTime <= batchStartHour &&
            endTime <= batchEndHour &&
            endTime >= batchStartHour
          )
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
        });
      }
      const webinarExists = await this.webinarRepo.find({
        where: [
          {
            startDate: MoreThanOrEqual(updateTeamBatch.startDate),
            endDate: LessThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
          },
          {
            startDate: LessThanOrEqual(updateTeamBatch.startDate),
            endDate: MoreThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
          },
          {
            startDate:
              MoreThanOrEqual(updateTeamBatch.startDate) &&
              LessThanOrEqual(updateTeamBatch.endDate),
            endDate: MoreThanOrEqual(updateTeamBatch.endDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
          },
          {
            startDate: LessThanOrEqual(updateTeamBatch.startDate),
            endDate:
              LessThanOrEqual(updateTeamBatch.endDate) &&
              MoreThanOrEqual(updateTeamBatch.startDate),
            trainer: { id: trainerId ? trainerId : batch.trainer.id },
          },
        ],
      });
      if (webinarExists.length) {
        const batchStartHour =
          updateTeamBatch.startDate.getHours() * 60 +
          updateTeamBatch.startDate.getMinutes();
        const batchEndHour =
          updateTeamBatch.endDate.getHours() * 60 +
          updateTeamBatch.endDate.getMinutes();
        webinarExists.forEach((item) => {
          const startTime =
            item.startDate.getHours() * 60 + item.startDate.getMinutes();
          const endTime =
            item.endDate.getHours() * 60 + item.endDate.getMinutes();
          if (startTime >= batchStartHour && endTime <= batchEndHour)
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (startTime <= batchStartHour && endTime >= batchEndHour)
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (
            startTime >= batchStartHour &&
            startTime <= batchEndHour &&
            endTime >= batchEndHour
          )
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
          if (
            startTime <= batchStartHour &&
            endTime <= batchEndHour &&
            endTime >= batchStartHour
          )
            throw new HttpException(
              HttpStatus.BAD_REQUEST,
              'Cannot schedule at this time',
            );
        });
      }

      await this.microsoftTeamService.updateBatchEvent(
        updateTeamBatch,
        credential?.outLookToken,
        batch.meetingId,
      );
      const events = await this.microsoftTeamService.occurrenceOfEvent(
        credential?.outLookToken,
        batch.meetingId,
        moment(teamStartDate).format('YYYY-MM-DD').toString(),
        moment(teamEndDate).format('YYYY-MM-DD').toString(),
      );
      const oldEvents = await this.sessionRepo.find({
        where: { batch: { id: batch.id } },
        order: { index: 'asc' },
      });
      if (events.length > oldEvents.length) {
        const sessionUpdatesPromises = oldEvents.map(async (oldEvent, i) => {
          const sessionDetails = await this.sessionRepo.findOne({
            where: { id: oldEvent.id },
          });
          sessionDetails.callId = events[i].iCalUId;
          sessionDetails.sessionDate = events[i].start.dateTime;
          sessionDetails.sessionEndDate = events[i].end.dateTime;
          sessionDetails.occurrenceId = events[i].id;
          sessionDetails.meetingUrl = events[i].onlineMeeting?.joinUrl;
          return this.sessionRepo.save(sessionDetails);
        });

        await Promise.all(sessionUpdatesPromises);

        const sessions: Array<Object> = [];

        for (let i = oldEvents.length; i < events.length; i++) {
          const sessionObject: CreateSessionDto = {
            sessionDate: events[i].start.dateTime,
            sessionEndDate: events[i].end.dateTime,
            batch: batch,
            occurrenceId: events[i].id,
            callId: events[i].iCalUId,
            sessionName: `Session-${i + 1}`,
            meetingUrl: events[i].onlineMeeting?.joinUrl,
            index: i + 1,
          };
          sessions.push(sessionObject);
        }

        await this.sessionRepo
          .createQueryBuilder('session')
          .insert()
          .values(sessions)
          .execute();
      } else {
        console.log(events);
        const sessionUpdatesPromises = events.map(async (newEvent, i) => {
          const sessionDetails = await this.sessionRepo.findOne({
            where: { id: oldEvents[i].id },
          });
          sessionDetails.callId = newEvent.iCalUId;
          sessionDetails.sessionDate = newEvent.start.dateTime;
          sessionDetails.sessionEndDate = newEvent.end.dateTime;
          sessionDetails.occurrenceId = newEvent.id;
          sessionDetails.meetingUrl = newEvent.onlineMeeting?.joinUrl;
          return this.sessionRepo.save(sessionDetails);
        });

        const sessionDeletesPromises = oldEvents
          .slice(events.length)
          .map(async (oldEvent) => {
            console.log(oldEvent, 777);
            await this.sessionRepo.softDelete({ id: oldEvent.id });
          });

        await Promise.all([
          ...sessionUpdatesPromises,
          ...sessionDeletesPromises,
        ]);
      }
      if (sessionType === SessionType.CUSTOM) {
        batch.startDate = events[0].start.dateTime;
      }
    }
    const result = await this.notificationRepo.create({
      title: 'Batch Scheduled',
      description: `${batch.batchId} has been edit successful`,
      receiverType: 'Trainers',
      trainerId: batch.trainer.id,
    });
    // Save the updated batch entity and return it
    return this.batchRepo.save(batch);
  }

  /**
   * Unenrolls a student from a batch and updates related entities.
   * @param id The id of the enrollment to unenroll the student from.
   */
  async unenrollStudent(id: string) {
    // Retrieve the Enrollment with related Student, Auth, and Batch entities
    const enroll = await this.enrollRepo.findOne({
      where: { id },
      relations: ['student', 'student.auth', 'batch'],
    });

    // Retrieve the StudentEntity based on the student id from the Enrollment
    const student: Student = await this.studentRepo.findOne({
      where: { id: enroll.student.id },
    });

    // Retrieve the Outlook credential from the database
    const credential = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });

    // Validate if the Enrollment exists
    if (!enroll) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid id');

    // Unenroll the student from the corresponding meeting in Microsoft Teams
    const isUnenrolled =
      await this.microsoftTeamService.unenrollStudentFromEvent(
        enroll?.batch?.meetingId,
        credential?.outLookToken,
        enroll?.student?.auth?.email,
      );

    // Validate if the unenrollment in Microsoft Teams was successful
    if (!isUnenrolled) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Something went wrong in teams',
      );
    }
    // Update seats accordingly
    enroll.batch.filledSeats -= 1;
    const oldBatch = await this.batchRepo.save(enroll.batch);

    // Update the student's enrollment type to NOT_ENROLLED
    student.enrollmentType = enrollmentType.NOT_ENROLLED;

    // Soft delete the enrollment and save the updated student entity in parallel
    await Promise.all([
      this.enrollRepo.softDelete({ id }),
      this.studentRepo.save(student),
    ]);
    return oldBatch;
  }

  /**
   * Deletes a BatchEntity and cancels the associated event in Microsoft Teams.
   * @param id The id of the batch to delete.
   */
  async deleteBatch(id: string) {
    // Retrieve the BatchEntity based on the provided id
    const batch: BatchEntity = await this.batchRepo.findOne({
      where: { id },
    });
    // Validate if the BatchEntity exists
    if (!batch) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Batch id');
    }
    const enrollment = await this.enrollRepo.find({ where: { batch: { id } } });
    if (enrollment.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Already students enrolled in this batch ',
      );
    // Retrieve the Outlook credential from the database
    const credential = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    if (batch.batchType === BatchTypeEnum.LIVE) {
      // Get the current date
      const currentDate: Date = new Date();

      if (batch.startDate <= currentDate && batch.filledSeats === 0) {
        // The batch can be deleted, no need for further checks
      } else if (batch.startDate <= currentDate) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'This batch cannot be deleted',
        );
      }
      if (batch.endDate < currentDate && batch.filledSeats === batch.maxSize) {
        // Check if the batch can be deleted based on the end date and available seats
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'This batch cannot be deleted',
        );
      }

      // Cancel the associated event in Microsoft Teams
      const isDeleteEvent: boolean =
        await this.microsoftTeamService.cancelEvent(
          credential?.outLookToken,
          batch.meetingId,
        );

      // Validate if the event cancellation in Microsoft Teams was successful
      if (!isDeleteEvent) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'This batch cannot be deleted',
        );
      }
    }
    //call for batch cancelled notification

    const result = await this.notificationRepo.create({
      title: 'Batch Cancelled',
      description: `Batch ${id} has been cancelled`,
      receiverType: 'Students',
      batchId: `${id}`,
    });
    // Soft delete the batch entity
    await this.batchRepo.softDelete(id);
  }

  // return the batch student by batchId
  /**
   * Retrieves a list of students enrolled in a batch based on the provided batch id.
   * @param id The id of the batch to retrieve students for.
   * @returns An array of enrollments containing student information and batch id.
   */
  async batchStudentsById(id: string) {
    return await this.enrollRepo.find({
      select: {
        // Select specific fields from student and batch entities
        student: { auth: { id: true, name: true }, id: true },
        batch: { id: true },
        id: false,
      },
      // Filter enrollments based on the provided batch id
      where: { batch: { id: id } },
      // Include relations to retrieve student and batch data
      relations: {
        student: {
          auth: true, // Include student's auth information
        },
        batch: true, // Include batch information
      },
    });
  }

  async trainerBatchList(
    id: string,
    authId: string,
  ): Promise<{
    activrBatches: BatchEntity[];
    completeBatches: BatchEntity[];
  }> {
    const avtiveBatchesPromise = this.batchRepo.find({
      where: [
        {
          trainer: { auth: { id: authId } },
          course: { id },
          endDate: MoreThanOrEqual(new Date()),
        },
        {
          trainer: { auth: { id: authId } },
          course: { id },
          endDate: null,
        },
      ],
      select: {
        id: true,
        batchId: true,
        startDate: true,
        endDate: true,
        batchType: true,
      },
    });
    const completeBatchesPromise = this.batchRepo.find({
      where: {
        trainer: { auth: { id: authId } },
        course: { id },
        endDate: LessThanOrEqual(new Date()),
      },
      select: {
        id: true,
        batchId: true,
        startDate: true,
        endDate: true,
        batchType: true,
      },
    });
    const [activrBatches, completeBatches] = await Promise.all([
      avtiveBatchesPromise,
      completeBatchesPromise,
    ]);
    return { activrBatches, completeBatches };
  }

  async courseBatchList(id: string): Promise<BatchEntity[]> {
    return await this.batchRepo.find({
      where: { course: { id }, startDate: MoreThanOrEqual(new Date()) },
      select: ['id', 'batchId', 'meetingId'],
    });
  }

  async upcomingBatch(): Promise<BatchEntity[]> {
    const currentDate: Date = new Date();
    const query = `select b."batchId" ,b.id ,c.id,b."startDate" 
    ,b."endDate" ,c."courseMedia", b."maxSize",b."filledSeats"  ,c."courseName"  ,c."slugName"
    from batch b   join course c  on b."courseId" = c.id where b."startDate" > 
    $1 and b."deletedAt" is null and c."deletedAt" is null ORDER BY random() limit 1;`;
    return await this.batchRepo.query(query, [currentDate]);
  }

  async shiftBatchList(payload: ShiftBatchListDto): Promise<BatchEntity[]> {
    const isCourse = await this.courseRepo.findOne({
      where: { id: payload.courseId },
    });
    if (!isCourse)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'course not found');
    const batches = await this.batchRepo.find({
      where: {
        course: { id: payload.courseId },
        isBatchFull: false,
        endDate: MoreThanOrEqual(new Date()),
        id: Not(payload.batchId),
      },
      select: ['id', 'batchId'],
    });
    return batches;
  }

  async shiftBatch(payload: ShiftBatchDto) {
    const studentDetails = await this.studentRepo.findOne({
      where: { auth: { id: payload.authId } },
    });
    if (!studentDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'student not found');
    const batchDetails = await this.batchRepo.findOne({
      where: { id: payload.batchId },
    });
    if (!batchDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'batch not found');

    const enrollObject: EnrollStudentDto = {
      batchId: payload.batchId,
      studentId: studentDetails.id,
      isShifted: true,
    };

    const [oldBatch, newEnrollment] = await Promise.all([
      this.unenrollStudent(payload.enrollId),
      this.enrollStudent(enrollObject),
    ]);
    return { oldBatch, newEnrollment };
  }

  async upcomingBatches(courseId: string): Promise<BatchEntity[]> {
    const batches = await this.batchRepo.find({
      where: {
        startDate: MoreThanOrEqual(new Date()),
        course: { id: courseId },
      },
      select: ['id', 'batchId', 'meetingId'],
    });
    return batches;
  }

  async addStudentToBatch(payload: AddStudentBatchDTO) {
    const batch = await this.batchRepo.findOne({
      where: { id: payload.batchId },
    });
    if (!batch)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Batch ID');
    const students = await Promise.allSettled(
      payload.students.map((item) =>
        this.studentRepo.findOne({ where: { id: item } }),
      ),
    );
    // console.log(students);
    const enrollmentPromise = students.map((item) => {
      if (item.status === 'fulfilled') {
        return this.enrollStudent({
          batchId: payload.batchId,
          studentId: item.value.id,
        });
      }
    });

    await Promise.allSettled(enrollmentPromise);
  }

  async studentChangeBatch(payload: ChangeBatchDTO) {
    const enrollment = await this.enrollRepo.findOne({
      where: {
        batch: { id: payload.currentBatchId },
        student: { id: payload.studentId },
      },
      relations: { student: { auth: true } },
    });

    if (!enrollment)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Student is not enrolled in this batch',
      );

    const alreadyEnrolled = await this.enrollRepo.findOne({
      where: {
        batch: { id: payload.newBatchId },
        student: { id: payload.studentId },
      },
    });
    if (alreadyEnrolled)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This student is already enrolled',
      );
    const oldBatch = await this.unenrollStudent(enrollment.id);
    const newEnrollment = await this.enrollStudent({
      batchId: payload.newBatchId,
      studentId: payload.studentId,
    });
    return { newEnrollment, oldBatch };
  }

  async commanBatch(payload: ShiftBatchListDto): Promise<BatchEntity[]> {
    const batchDetails = await this.batchRepo.findOne({
      where: { id: payload.batchId },
    });
    const filterObject: Object = {
      course: { id: payload.courseId },
      id: Not(payload.batchId),
    };
    if (batchDetails.batchType === BatchTypeEnum.LIVE) {
      filterObject['startDate'] = LessThanOrEqual(new Date());
      filterObject['batchType'] = BatchTypeEnum.LIVE;
    } else {
      filterObject['batchType'] = BatchTypeEnum.SELF;
    }
    const batchList = await this.batchRepo.find({
      where: filterObject,
      select: ['batchId', 'id'],
    });
    return batchList;
  }

  async createSelfBatch(batchDto: CreateBatchDto) {
    const courseDetails: Course = await this.courseRepo.findOne({
      where: {
        id: batchDto.courseId,
        trainingPlans: { name: 'self', publish: true },
      },
      relations: ['courseCategory', 'trainingPlans'],
    });
    if (batchDto.isWeb) {
      const isAlreadyExistBatch = await this.batchRepo.findOne({
        where: {
          course: { id: batchDto.courseId },
          batchType: BatchTypeEnum.SELF,
          isWeb: true,
        },
      });
      if (isAlreadyExistBatch)
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'Self Batch already created',
        );
    }
    if (!courseDetails?.trainingPlans?.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Please add Self Training Plan',
      );
    if (batchDto.totalSession <= 0)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid session count');
    const findTrainer: Trainer = await this.trainerRepo.findOne({
      where: { id: batchDto.trainerId },
      relations: ['trainerSkills', 'trainerSkills.skill'],
    });

    // Validate if Trainer exists
    if (!findTrainer)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Trainer not found');
    const batch = new BatchEntity();
    const gstAmount = Math.round(
      batchDto.inrAmount *
        (this.configService.get('payment.gst', { infer: true }) / 100 || 0.18),
    );
    // let batchId: string;
    // if (courseDetails?.courseName.includes(' ')) {
    //   const words: string[] = courseDetails?.courseName.split(' ');
    //   const code: string = words.map((word) => word.charAt(0)).join('');
    //   batchId = `${code}-Self-Batch`;
    // }
    // batchId = `${courseDetails?.courseName}-Self-Batch`;
    // console.log(batchId);
    batch.course = courseDetails;
    batch.trainer = findTrainer;
    batch.feeType = batchDto.feeType;
    batch.inrAmount = batchDto.inrAmount;
    batch.gstCharge = gstAmount;
    batch.dollorAmount = batchDto.dollorAmount;
    batch.totalSession = batchDto.totalSession;
    batch.meetingId = batchDto.meetingId;
    batch.skills = batchDto.skills;
    batch.batchId = batchDto.batchId;
    batch.courseCategory = courseDetails.courseCategory;
    batch.plans = courseDetails.trainingPlans[0];
    batch.batchType = BatchTypeEnum.SELF;
    batch.isWeb = batchDto.isWeb;

    const createdBatch = this.batchRepo.create({
      ...batch,
    });

    // Save the created BatchEntity
    const saveBatch: BatchEntity = await this.batchRepo.save(createdBatch);
    // Validate if the save operation was successful
    if (!saveBatch)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Batch not created');
    await this.sessionService.createSelfBatchSession(saveBatch);

    const result = await this.notificationRepo.create({
      title: 'Batch Scheduled',
      description: `${saveBatch.batchId} has been created `,
      receiverType: 'Trainers',
      trainerId: saveBatch.trainer.id,
    });
    // Return the saved BatchEntity
    return await this.batchRepo.findOne({
      where: { id: saveBatch.id },
      relations: { trainer: { auth: true } },
    });
  }

  async updateSelfBatch(id: string, updatebatchDto: UpdateBatchDto) {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['trainer', 'course', 'trainer.auth'],
    });

    if (!batch)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid batch id');
    const {
      feeType,
      inrAmount,
      dollorAmount,
      trainerId,
      totalSession,
      batchId,
    } = updatebatchDto;
    if (batch.totalSession > totalSession)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'cant delete sessions');
    const trainer = trainerId
      ? await this.trainerRepo.findOne({
          where: { id: trainerId },
          relations: ['auth'],
        })
      : batch.trainer;

    // Validate if the TrainerEntity exists
    if (!trainer) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Trainer ID');
    }
    if (batch.totalSession < totalSession)
      await this.sessionService.updateSelfBatchSesssion(batch, totalSession);
    batch.inrAmount = inrAmount;
    batch.dollorAmount = dollorAmount;
    batch.feeType = feeType;
    batch.trainer = trainer;
    batch.batchId = batchId;
    batch.totalSession = totalSession;
    return this.batchRepo.save(batch);
  }
}
