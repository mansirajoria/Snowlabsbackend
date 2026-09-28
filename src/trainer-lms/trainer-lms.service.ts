import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import {
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { LoginDto } from '@auth/dto/common.dto';
import * as bcrypt from 'bcryptjs';
import * as moment from 'moment';
import { changePasswordDTO } from '@trainer_lms/dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import {
  FeedBackType,
  InvoiceQueryCategory,
  InvoiceQueryStatus,
  RoleType,
  TrainerQueryStatus,
} from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';
import { hashPassword } from '@utils/helper.service';
import { MailService } from '@mail/mail.service';
import { Trainer } from '@trainer/entities/trainer.entity';
import { TrainerQuery } from '@trainer_lms/entities/trainer-query.entity';
import { CreateTrainerQuery } from '@trainer_lms/dto/create-trainer-query.dto';
import { TrainerQueryTrack } from './entities/trainer-query-track.entity';
import {
  generateInvoiceSequence,
  generateQuerySequence,
} from '@utils/sequence-generator/sequence.service';
import { UpdateTrainerQueryDto } from './dto/update-trainer-query.dto';
import { CreateTrainerInvoiceDto } from './dto/create-trainer-invoice.dto';
import { TrainerInvoice } from './entities/trainer-invoice.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { TrainerInvoiceTrack } from './entities/trainer-invoice-track.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { MyWebinarFilterDTO } from './dto/my-webinar-filter.dto';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';
import { Notifications } from '@notifications/entities/notifications.entity';
import { NotificationsService } from '@notifications/notifications.service';
import { SessionEntity } from '@session/entities/session.entity';
import { Session } from 'inspector';
import { Payment } from '@payment/entities/payment.entity';
@Injectable()
export class TrainerLmsService {
  constructor(
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(TrainerQuery)
    private trainerQueryRepo: Repository<TrainerQuery>,
    @InjectRepository(TrainerQueryTrack)
    private trainerQueryTrackRepo: Repository<TrainerQueryTrack>,
    @InjectRepository(TrainerInvoice)
    private trainerInvoiceRepo: Repository<TrainerInvoice>,
    @InjectRepository(TrainerInvoiceTrack)
    private trainerInvoiceTrackRepo: Repository<TrainerInvoiceTrack>,
    @InjectRepository(Webinar) private webinarRepo: Repository<Webinar>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(WebinarEnrollment)
    private webinarEnrollmentRepo: Repository<WebinarEnrollment>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private notificationRepo: NotificationsService,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  /**
   *
   *  login the trainer on LMS
   *
   * @returns auth token
   *
   */

  async login(req: LoginDto): Promise<{ token: string; trainer: AuthEntity }> {
    const userEmail = req.email;
    const userPassword = req.password;

    const findUser = await this.authRepo.findOne({
      where: [{ email: userEmail, role: RoleType.TRAINER }],
    });

    if (!findUser) throw new HttpException(404, `Trainer not found !!`);

    const isPasswordMatching: boolean = await bcrypt.compare(
      userPassword,
      findUser.password,
    );

    if (!isPasswordMatching)
      throw new HttpException(400, 'Incorrect email or password');

    if (!findUser.isActive)
      throw new HttpException(400, 'Your account is disabled');
    findUser.isLogIn = true;
    await this.authRepo.save(findUser);
    const jwtObject = {
      id: findUser.id,
      role: findUser.role,
    };

    const token: string = this.jwtService.sign(jwtObject);

    const trainer = await this.authRepo
      .createQueryBuilder('qb')
      .where('qb.email = :email', { email: userEmail })
      .andWhere('qb.role = :role1', { role1: RoleType.TRAINER })
      .innerJoinAndMapOne(
        'qb.trainer',
        Trainer,
        'trainer',
        'trainer.authId = qb.id',
      )
      .getOne();

    return { token, trainer };
  }

  async trainerProfile(id: string) {
    const trainer = await this.trainerRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.auth', 'auth')
      .where('auth.id = :id', { id })
      .leftJoinAndSelect('qb.trainerSkills', 'tk')
      .leftJoinAndSelect('tk.skill', 'skill')
      .leftJoinAndSelect('skill.skillCategory', 'category')
      .getOne();

    return trainer;
  }

  async changePassword(id: string, payload: changePasswordDTO) {
    if (payload.newPassword != payload.confirmPassword)
      throw new HttpException(
        404,
        `Confirm password should be same as New Pasword`,
      );

    const findTrainer = await this.authRepo.findOne({
      where: { id: id, role: RoleType.TRAINER },
    });
    if (!findTrainer) throw new HttpException(404, `Trainer not found`);

    const isPasswordMatching: boolean = await bcrypt.compare(
      payload.currentPassword,
      findTrainer.password,
    );

    if (!isPasswordMatching) throw new HttpException(400, 'Incorrect password');

    const isPasswordSame: boolean = await bcrypt.compare(
      payload.newPassword,
      findTrainer.password,
    );
    if (isPasswordSame)
      throw new HttpException(400, 'New Password cant be as Old Password');

    findTrainer.password = await hashPassword(payload.newPassword);

    await this.authRepo.save(findTrainer);
    // Updated Password mail
    // await this.mailService.sendMail({
    //   to: findTrainer.email,
    //   subject: 'Login Password is updated',
    // });
  }

  async getTrainer(id: string) {
    return await this.trainerRepo.findOne({
      where: { auth: { id: id } },
    });
  }

  /*

  *
  *  Trainer Query Handlers
  * 
  
  */

  // Query

  async createTrainerQuery(payload: CreateTrainerQuery, id: string) {
    const trainer = await this.getTrainer(id);
    if (!trainer) throw new HttpException(404, 'Trainer not found');

    const TQ = new TrainerQuery();

    TQ.queryId = generateQuerySequence();
    TQ.query = payload.query;
    TQ.queryCategory = payload.queryCategory;
    TQ.trainer = trainer;
    TQ.status = TrainerQueryStatus.NEW;

    const TQT = new TrainerQueryTrack();
    const savedTQ = await this.trainerQueryRepo.save(TQ);

    TQT.trainerQuery = savedTQ;
    //query posted successfully notification
    const data: any = {
      title: 'SnowLabs Support',
      description: `New query has been raised. Query id ${TQ.queryId}`,
      receiverType: 'Admins',
    };
    // console.log(data, 'data to be inserted');
    const result = await this.notificationRepo.create(data);
    await this.trainerQueryTrackRepo.save(TQT);
  }

  async findTrainerQueries(id: string) {
    return await this.trainerQueryRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .where('auth.id = :id', { id })
      .select([
        'qb.id AS "id"',
        'qb.queryId AS "queryId"',
        'qb.queryCategory AS "queryCategory"',
        'qb.query AS "query"',
        `CASE
        WHEN qb.status = :val1 THEN 'Processing'
        WHEN qb.status = :val2 THEN 'Processing'
        WHEN qb.status = :val3 THEN 'Processing'
        WHEN qb.status = :val4 THEN 'Resolved'
        END AS "status"`,
        'qb.createdDate AS "createdDate"',
      ])
      .setParameters({
        val1: TrainerQueryStatus.NEW,
        val2: TrainerQueryStatus.OPENDED,
        val3: TrainerQueryStatus.PROCESSING,
        val4: TrainerQueryStatus.RESOLVED,
      })
      .getRawMany();
  }

  // Trainer Webianr and Courses to show for dropdown

  async trainerWebinarToShow(id: string) {
    return this.webinarRepo.find({
      where: { trainer: { auth: { id } } },
      select: { id: true, title: true, slugName: true },
    });
  }

  async trainerCoursesToShow(id: string) {
    return await this.courseRepo.find({
      where: { batch: { trainer: { auth: { id } } } },
      select: { id: true, courseName: true },
    });
  }

  async trainerBatchesToShow(id: string, cid: string) {
    return await this.batchRepo.find({
      select: { id: true, batchId: true },
      where: { trainer: { auth: { id } }, course: { id: cid } },
    });
  }

  // Invoice
  async createTrainerInvoice(payload: CreateTrainerInvoiceDto, id: string) {
    const trainer = await this.trainerRepo.findOne({
      where: { auth: { id } },
    });
    if (!trainer) throw new HttpException(404, 'Trainer not found');

    if (payload.invoiceCategory == InvoiceQueryCategory.WEBINAR) {
      const findWebinar = await this.webinarRepo.findOne({
        where: {
          id: payload.webinarId,
          // trainer: { auth: { id } },
        },
      });

      if (!findWebinar) throw new HttpException(404, 'Webinar Not Found');

      const TI = new TrainerInvoice();

      TI.invoiceId = generateInvoiceSequence();
      TI.invoiceCategory = InvoiceQueryCategory.WEBINAR;
      TI.status = TrainerQueryStatus.NEW;
      TI.invoiceAmount = payload.amount;
      TI.trainer = trainer;
      TI.webinar = findWebinar;

      const TIT = new TrainerInvoiceTrack();
      const savedTI = await this.trainerInvoiceRepo.save(TI);

      TIT.trainerInvoice = savedTI;

      return await this.trainerInvoiceTrackRepo.save(TIT);
    }

    if (payload.invoiceCategory == InvoiceQueryCategory.COURSE) {
      const findCourse = await this.courseRepo.findOne({
        where: {
          id: payload.courseId,
        },
        relations: { batch: true },
      });

      if (!findCourse) throw new HttpException(404, 'Course Not Found');

      const findBatch = await this.batchRepo.findOne({
        where: { id: payload.batchId },
      });

      if (!findBatch) throw new HttpException(404, 'Batch Not Found');

      const TI = new TrainerInvoice();

      TI.invoiceId = generateInvoiceSequence();
      TI.invoiceCategory = InvoiceQueryCategory.COURSE;
      TI.status = TrainerQueryStatus.NEW;
      TI.invoiceAmount = payload.amount;
      TI.trainer = trainer;
      TI.batch = findBatch;

      const TIT = new TrainerInvoiceTrack();
      const savedTI = await this.trainerInvoiceRepo.save(TI);

      TIT.trainerInvoice = savedTI;

      return await this.trainerInvoiceTrackRepo.save(TIT);
    }
  }

  async trainerInvoices(id: string) {
    return await this.trainerInvoiceRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoinAndSelect('qb.webinar', 'webinar')
      .leftJoinAndSelect('qb.batch', 'batch')
      .leftJoin('batch.sessions', 'sessions')
      .leftJoinAndSelect('sessions.feedbacks', 'feedbacks')
      .where('auth.id = :id', { id })
      .select([
        'qb.id AS "id"',
        'qb.invoiceId AS "invoiceId"',
        'qb.invoiceCategory AS "invoiceCategory"',
        'qb.invoiceAmount AS "invoiceAmount"',
        'webinar.title AS "webinarTitle"',
        'batch.batchId AS "batchId"',
        // 'qb.status AS "status"',
        'AVG(feedbacks.rating) as "rating"',
        `CASE
          WHEN qb.status = :val1 THEN 'Raised'
          WHEN qb.status = :val2 THEN 'Processing'
          WHEN qb.status = :val3 THEN 'Processing'
          WHEN qb.status = :val4 THEN 'Resolved'
          WHEN qb.status = :val5 THEN 'Rejected'
        END AS "status"`,
        'qb.createdDate AS "createdDate"',
      ])
      .setParameters({
        val1: InvoiceQueryStatus.NEW,
        val2: InvoiceQueryStatus.OPENDED,
        val3: InvoiceQueryStatus.PROCESSING,
        val4: InvoiceQueryStatus.RESOLVED,
        val5: InvoiceQueryStatus.REJECTED,
      })
      .groupBy('qb.id, webinar.title, batch.batchId')
      .getRawMany();
  }

  // Admin Panel

  async createTrainerQueryAsAdmin(payload: CreateTrainerQuery) {
    const trainer = await this.trainerRepo.findOne({
      where: { trainerId: payload.trainerId },
    });
    if (!trainer) throw new HttpException(404, 'Trainer not found');

    const TQ = new TrainerQuery();

    TQ.queryId = generateQuerySequence();
    TQ.query = payload.query;
    TQ.queryCategory = payload.queryCategory;
    TQ.trainer = trainer;
    TQ.status = TrainerQueryStatus.NEW;

    const TQT = new TrainerQueryTrack();
    const savedTQ = await this.trainerQueryRepo.save(TQ);

    TQT.trainerQuery = savedTQ;

    await this.trainerQueryTrackRepo.save(TQT);
  }

  async findAllTrainerQuery(queryParams: any) {
    const limit = queryParams.pageLength < 1 ? 1 : queryParams.pageLength || 10;
    const page = queryParams.pageNo < 1 ? 1 : queryParams.pageNo || 1;

    const { queryId, query, status, queryCatgeory } = queryParams;

    const queryPromise = this.trainerQueryRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      // .leftJoinAndSelect('qb.trainerQueryTrack', 'track')
      .where(query ? 'qb.query ILIKE :val1' : '1=1', {
        val1: `%${query}%`,
      })
      .andWhere(queryId ? 'qb.queryId ILIKE :val2' : '1=1', {
        val2: `%${queryId}%`,
      })
      .andWhere(queryCatgeory ? 'qb.queryCategory = :val3' : '1=1', {
        val3: queryCatgeory,
      })
      .andWhere(status ? 'qb.status = :status' : '1=1', { status })
      .orderBy('qb.lastModifiedDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalCountPromise = this.trainerQueryRepo.count();

    const unresolvedPromise = this.trainerQueryRepo.count({
      where: [
        { status: TrainerQueryStatus.NEW },
        { status: TrainerQueryStatus.PROCESSING },
        { status: TrainerQueryStatus.OPENDED },
      ],
    });

    const startDate = new Date(moment().startOf('months').toDate());
    const endDate = new Date(moment().endOf('months').toDate());

    const solvedTodayPromise = this.trainerQueryRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.trainerQueryTrack', 'track')
      .where('qb.status = :val1', { val1: TrainerQueryStatus.RESOLVED })
      .andWhere('track.status = :val2', { val2: TrainerQueryStatus.RESOLVED })
      .andWhere('track.createdAt > :val3', { val3: startDate })
      .andWhere('track.createdAt < :val4', { val4: endDate })
      .getCount();

    const [queries, totalCount, unresolvedQueries, solvedToday] =
      await Promise.all([
        queryPromise,
        totalCountPromise,
        unresolvedPromise,
        solvedTodayPromise,
      ]);

    return {
      totalCount,
      unresolvedQueries,
      solvedToday,
      queries,
    };
  }

  async findTrainerQuery(id: string) {
    return await this.trainerQueryRepo.findOne({
      where: { trainer: { auth: true }, trainerQueryTrack: true, id },
      relations: { trainerQueryTrack: true, trainer: { auth: true } },
      order: { trainerQueryTrack: { createdAt: 'ASC' } },
    });
  }

  async updateTrainerQuery(id: string, payload: UpdateTrainerQueryDto) {
    const findQuery = await this.trainerQueryRepo.findOne({
      where: { id },
      relations: { trainer: true, trainerQueryTrack: true },
    });

    if (!findQuery) throw new HttpException(404, 'Trainer Query Not found');
    if (payload.isOpened && !findQuery.isOpened) {
      const TQT = new TrainerQueryTrack();
      TQT.status = TrainerQueryStatus.OPENDED;
      TQT.trainerQuery = findQuery;
      findQuery.isOpened = true;

      await this.trainerQueryRepo.save(findQuery);
      const savedTQT = await this.trainerQueryTrackRepo.save(TQT);

      const data: any = {
        title: 'Query Update',
        description: `new update found on Query id ${findQuery.queryId}`,
        receiverType: 'Trainers',
        trainerId: `${findQuery.trainer.id}`,
      };
      await this.notificationRepo.create(data);
      return savedTQT;
    }

    const TQT = new TrainerQueryTrack();

    TQT.trainerQuery = findQuery;
    TQT.status = payload.status;
    TQT.comments = payload.comments;

    // Updating status manually
    findQuery.status = payload.status;
    await this.trainerQueryRepo.save(findQuery);

    if (payload.status || payload.comments)
      await this.trainerQueryTrackRepo.save(TQT);
    const data: any = {
      title: 'Query Update',
      description: `new update found on Query id ${findQuery.queryId}`,
      receiverType: 'Trainers',
      trainerId: `${findQuery.trainer.id}`,
    };
    await this.notificationRepo.create(data);
    return;
  }

  /*

  *
  *  Trainer Webinar
  * 
  
  */

  async myWebinars(id: string, query: MyWebinarFilterDTO) {
    const findTrainer = await this.authRepo.findOne({
      where: { id: id, role: RoleType.TRAINER },
    });
    if (!findTrainer) throw new HttpException(404, `Trainer not found`);

    // const findWebinarsPromise = this.webinarRepo
    //   .createQueryBuilder('qb')
    //   .leftJoinAndSelect('qb.trainer', 'trainer')
    //   .leftJoinAndSelect('qb.category', 'category')
    //   .leftJoinAndSelect('trainer.auth', 'auth')
    //   .where('auth.id = :id', { id: findTrainer.id })
    //   .andWhere(query.category ? 'category.name ILIKE :category' : '1=1', {
    //     category: `%${query.category}%`,
    //   })
    //   .orderBy('qb.startDate', 'DESC')
    //   .getMany();
    const findWebinarsPromise = this.webinarRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.trainer', 'trainer')
      .leftJoin('qb.category', 'category')
      .leftJoin('trainer.auth', 'auth') // Joining 'auth' for the trainer's details
      .where('auth.id = :id', { id: findTrainer.id })
      .andWhere(query.category ? 'category.name ILIKE :category' : '1=1', {
        category: `%${query.category}%`, // Filter by category if present
      })
      .orderBy('qb.startDate', 'DESC')
      .select([
        'qb.id',
        'qb.title',
        'qb.slugName',
        'qb.startDate',
        'qb.meetingUrl',
        'qb.endDate',
        'qb.profilePic',
        'category.name', // Fetch category name
        'auth.name', // Fetch trainer's name from 'auth'
        'trainer.qualification', // Fetch trainer qualification
      ])
      .getMany();

    const webinarTakenPromise = this.webinarRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.trainer', 'trainer')
      .leftJoin('trainer.auth', 'auth')
      .where('auth.id = :id', { id: findTrainer.id })
      .andWhere('qb.endDate <= :dt', { dt: new Date() })
      .getCount();

    const upcomingWebinarPromise = this.webinarRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.trainer', 'trainer')
      .leftJoin('trainer.auth', 'auth')
      .where('auth.id = :id', { id: findTrainer.id })
      .andWhere('qb.startDate >= :dt', { dt: new Date() })
      .getCount();

    const [webinarTaken, upcomingWebinar, findWebinars] = await Promise.all([
      webinarTakenPromise,
      upcomingWebinarPromise,
      findWebinarsPromise,
    ]);
    return { webinarTaken, upcomingWebinar, findWebinars };
  }

  async allWebinars(id: string) {
    // const featuredWebinarsPromise = this.webinarEnrollmentRepo.find({
    //   where: { auth: { id: Not(id) } },
    //   relations: { webinar: true },
    // });

    // const featuredWebinarsPromise = this.webinarEnrollmentRepo
    //   .createQueryBuilder('we')
    //   .leftJoin('we.webinar', 'qb')
    //   .leftJoin('qb.trainer', 'trainer')
    //   .leftJoin('qb.category', 'category')
    //   .leftJoin('trainer.auth', 'auth')
    //   .where('we.auth.id != :id', { id })
    //   .orderBy('qb.startDate', 'ASC')
    //   .select([
    //     'qb.id',
    //     'qb.title',
    //     'qb.slugName',
    //     'qb.startDate',
    //     'qb.endDate',
    //     'qb.profilePic',
    //     'category.name', // Fetch category name
    //     'auth.fullName', // Fetch trainer name
    //     'trainer.qualification', // Fetch trainer qualification
    //   ])
    //   .getMany();

    // const upcomingWebinarsPromise = this.webinarRepo.find({
    //   where: {
    //     trainer: { auth: { id } },
    //     startDate: MoreThanOrEqual(new Date()),
    //   },
    //   order: { startDate: 'asc' },
    // });
    const upcomingWebinarsPromise = this.webinarRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.trainer', 'trainer')
      .leftJoin('qb.category', 'category')
      .leftJoin('trainer.auth', 'auth') // Join the auth table via trainer
      .where('auth.id = :id', { id }) // Filter by the trainer's auth ID
      .andWhere('qb.startDate >= :now', { now: new Date() }) // Only upcoming webinars
      .orderBy('qb.startDate', 'ASC') // Order by start date in ascending order
      .select([
        'qb.id',
        'qb.title',
        'qb.slugName',
        'qb.meetingUrl',
        'qb.startDate',
        'qb.endDate',
        'qb.profilePic',
        'category.name', // Fetch category name
        'auth.name', // Fetch trainer's name directly from auth
        'trainer.qualification', // Fetch trainer's qualification
      ])
      .getMany();

    // const onDemandWebinarsPromise = this.webinarRepo.find({
    //   where: { endDate: LessThanOrEqual(new Date()) },
    // });
    // const onDemandWebinarsPromise = this.webinarRepo
    //   .createQueryBuilder('qb')
    //   .leftJoin('qb.trainer', 'trainer')
    //   .leftJoin('qb.category', 'category')
    //   .leftJoin('trainer.auth', 'auth')
    //   .where('qb.endDate <= :currentDate', { currentDate: new Date() })
    //   .orderBy('qb.startDate', 'DESC')
    //   .select([
    //     'qb.id',
    //     'qb.title',
    //     'qb.slugName',
    //     'qb.startDate',
    //     'qb.endDate',
    //     'qb.profilePic',
    //     'category.name', // Fetch category name
    //     'auth.fullName', // Fetch trainer name
    //     'trainer.qualification', // Fetch trainer qualification
    //   ])
    //   .getMany();

    const [upcomingWebinars] = await Promise.all([
      // featuredWebinarsPromise,
      upcomingWebinarsPromise,
      // onDemandWebinarsPromise,
    ]);

    return {
      // featuredWebinars,
      upcomingWebinars,
      // onDemandWebinars,
    };
  }

  /*

  *
  *  Trainer Batches
  * 
  
  */

  async myCourses(id: string) {
    const batchDetails = await this.courseRepo.find({
      where: { batch: { trainer: { auth: { id } } } },
    });

    if (!batchDetails) throw new HttpException(404, `Trainer not found`);
    return batchDetails;
  }

  async dashboardData(trainerId: string): Promise<{
    activeBatch: BatchEntity;
    completedBatch: BatchEntity[];
    completeWebinar: number;
    overallRating: any;
    totalEarning: any;
    raisedInvoice: any;
  }> {
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: trainerId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'trainer not found');
    const currentDate: Date = new Date();
    const activeBatchQuery = `with SessionCounts as 
    (select b."batchId", c."courseName" ,
    count(case when s."sessionEndDate"< $1 then 1 else null END) as completeSession, 
    count(s.id) as totalSession from batch b 
    join course c on b."courseId" =c.id 
    join "session" s on s."batchId" =b.id 
    join trainer t on b."trainerId" =t.id 
    where t.id =$2 and b."endDate" > $1 and b."deletedAt" IS NULL
    group by b."batchId" ,c."courseName" ) 
    select "batchId", "courseName",completeSession, totalSession,round( (completeSession::numeric / totalSession * 100),0) AS completePercentage
        from SessionCounts;`;

    const completedBatchQuery = `with SessionCounts as 
    (select b."batchId", c."courseName" ,
    count(case when s."sessionEndDate"< $1 then 1 else null END) as completeSession, 
    count(s.id) as totalSession from batch b 
    join course c on b."courseId" =c.id 
    join "session" s on s."batchId" =b.id 
    join trainer t on b."trainerId" =t.id 
    where t.id =$2 and b."endDate" <= $1 and b."deletedAt" IS NULL
    group by b."batchId" ,c."courseName" ) 
    select "batchId", "courseName",completeSession, totalSession,round( (completeSession::numeric / totalSession * 100),0) AS completePercentage
        from SessionCounts;`;

    const activeBatchPromise = this.batchRepo.query(activeBatchQuery, [
      currentDate,
      trainerDetails.id,
    ]);

    const completedBatchPromise = this.batchRepo.query(completedBatchQuery, [
      currentDate,
      trainerDetails.id,
    ]);

    const overallRatingQuery = `SELECT 
    AVG(sf.rating) as rating
    FROM
      "session" s
    JOIN
      "feedback-form-submission" sf ON s.id = sf."sessionId"
    JOIN
      batch b ON s."batchId" = b.id
    WHERE
      b."trainerId" =$1 AND sf."type"=$2
  `;

    const earningQuery = `with roiData as (
      select 
          case
              when tc."feesType" ='Per_Pax' then (count(p.id) * tc."inrAmount")
              when tc."feesType" ='Per_Hour' then (b."totalDuration" * tc."inrAmount")
              when tc."feesType" ='Per_Batch' then ( tc."inrAmount" *1)
          end as "trainerCost", t."gstNumber"
      from payment p  
      join batch b on p."batchId" = b.id
      join course c on b."courseId" = c.id
      join "trainer-cost" tc on b."costId" = tc.id
      join trainer t on b."trainerId" = t.id
      where b."trainerId" = $1 and p."paymentStatus"='paid' or  p."paymentStatus"='captured'
      group by b."trainerId", tc."feesType", tc."inrAmount", b."totalDuration", t."gstNumber"
      ) select sum( 
      case
        when "gstNumber" is not null then "trainerCost" + "trainerCost" * 0.18
        else "trainerCost"
      end) as "TotalTrainerCost"
      from roiData;
    `;

    // const eQuery = `
    //   select sum(ti."invoiceAmount") as earnings from "trainer-invoice" ti
    //   where  ti."trainerId" = $1 and status = 'Resolved'
    // `;

    const trainerEarnPromise = this.paymentRepo.query(earningQuery, [
      trainerDetails?.id,
    ]);

    const completeWebinarPromise = this.webinarRepo.count({
      where: {
        trainer: { auth: { id: trainerId } },
        endDate: LessThanOrEqual(new Date()),
      },
    });

    const raisedInvoice = await this.trainerInvoices(trainerId);

    // eslint-disable-next-line prefer-const
    const [
      activeBatch,
      completedBatch,
      completeWebinar,
      overallRating,
      totalEarning,
    ] = await Promise.all([
      activeBatchPromise,
      completedBatchPromise,
      completeWebinarPromise,
      this.sessionRepo.query(overallRatingQuery, [
        trainerDetails.id,
        FeedBackType.POST_SESSION,
      ]),
      trainerEarnPromise,
    ]);

    overallRating[0]['rating'] = overallRating[0]['rating']
      ? Number(overallRating[0]['rating'].toFixed(1))
      : 0;

    return {
      activeBatch,
      completedBatch,
      completeWebinar,
      overallRating,
      totalEarning,
      raisedInvoice,
    };
  }

  async batchFeedbacks(batchId: string, trainerId: string): Promise<any> {
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: trainerId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'trainer not found');
  }

  async getUpcomingWebinarLMS(user: AuthEntity, filterId: string) {
    const trainer = await this.trainerRepo.findOne({
      where: { auth: { id: user.id } },
    });

    const webinars = await this.webinarRepo.find({
      where: {
        trainer: { id: trainer.id },
        startDate: MoreThan(new Date()),
        published: true,
        id: Not(filterId),
      },
      order: { startDate: 'ASC' },
      relations: {
        trainer: true,
        category: true,
      },
    });
    return webinars;
  }
}
