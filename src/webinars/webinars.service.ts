import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Webinar } from './entities/webinar.entity';
import { WebinarEnrollment } from './entities/webinar-enrollments.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { QueryWebinarDTO } from './dto/query-webinar.dto';
import { EnrollWebinarDto } from './dto/enroll-webinar.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import HttpException from '@utils/exceptions/HttpException';
import { UpdateWebinarDto } from './dto/update-webinar.dto';
import { WebinarCategory } from './entities/webinar-category.entity';
import { CreateWebinarCategoryDTO } from './dto/create-webinar-category.dto';
import { MeetDto } from 'microsoft-team/dto/response.dto';
import { MicrosoftTeamService } from 'microsoft-team/microsoft-team.service';
// import * as moment from 'moment';
import { convertISTtoUTC } from '@utils/weekday.service';
import { NotificationsService } from '@notifications/notifications.service';
import { SlugDto } from '@courses/interfaces/course.interface';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { EmailTriger } from './interface/email';
import { MailService } from '@mail/mail.service';
import { Student } from '@students/entities/student.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import {
  getWebinarCompletionMailBody,
  getWebinarEnrollmentMailBody,
  webinarCancelBody,
} from '@utils/helpers/mailbody.helper';
import * as moment from 'moment-timezone';
import { SessionEntity } from '@session/entities/session.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
 
@Injectable()
export class WebinarsService {
  constructor(
    @InjectRepository(Webinar) private webinarRepo: Repository<Webinar>,
    @InjectRepository(WebinarCategory)
    private categoryRepo: Repository<WebinarCategory>,
    @InjectRepository(WebinarEnrollment)
    private webinarEnrollmentRepo: Repository<WebinarEnrollment>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    private readonly microsoftTeamService: MicrosoftTeamService,
    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
    private notificationsRepo: NotificationsService,
    private readonly mailService: MailService,
  ) {}
 
  //  ------------------------- Category APIs ------------------------
 
  /**
   *
   * Create new category for webinar
   *
   * @param Category create DTO
   *
   * @returns New Webinar Category
   */
  async createCategory(categoryDto: CreateWebinarCategoryDTO) {
    //  Check if already exists
    const alreadyExists = await this.categoryRepo.findOne({
      where: { name: categoryDto.name },
    });
    if (alreadyExists)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Already exists');
    const category = new WebinarCategory();
    category.name = categoryDto.name;
    return await this.categoryRepo.save(category);
  }
 
  /**
   *
   * Get all categories for webinar
   *
   * @returns All Categories for webinar
   */
  async getCategory(web = false) {
    if (web) {
      return await this.categoryRepo
        .createQueryBuilder('category')
        .leftJoin('category.webinars', 'webinar')
        .where('webinar.id IS NOT NULL') // This condition ensures that the category has associated webinars
        .getMany();
    }
    return await this.categoryRepo.find();
  }
 
  /**
   *
   * Create a new Webinar
   *
   * @returns New Webinar
   */
  async create(createWebinarDto: CreateWebinarDto) {
    // Checks if trainer exists or not
    const trainer = await this.trainerRepo.findOne({
      where: { id: createWebinarDto.trainer },
    });
 
    if (!trainer)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Trainer ID');
 
    // Checks if category exists or not
    const category = await this.categoryRepo.findOne({
      where: { id: createWebinarDto.category },
    });
    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Category not found');
 
    //  Check if webinar with same title already exists or not
    const webinarTitle = await this.webinarRepo.findOne({
      where: [
        { title: createWebinarDto.title },
        { slugName: createWebinarDto.slugName },
      ],
    });
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    if (webinarTitle)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Duplicate Title or SlugName ',
      );
    const startDate = new Date(
      convertISTtoUTC(createWebinarDto.date, createWebinarDto.startTime),
    );
    const endDate = new Date(
      convertISTtoUTC(createWebinarDto.date, createWebinarDto.endTime),
    );
    const [isAlreadyScheduledWebinar] = await Promise.all([
      this.webinarRepo
        .createQueryBuilder('webinar')
        .leftJoin('webinar.trainer', 'trainer')
        .where(
          'webinar.startDate <= :startDate and webinar.endDate >= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .orWhere(
          'webinar.endDate >= :startDate and webinar.startDate <= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .orWhere(
          'webinar.startDate >= :startDate and webinar.startDate <= :endDate and webinar.endDate >= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .orWhere(
          'webinar.startDate <= :startDate and webinar.endDate <= :endDate and webinar.endDate >= :startDate',
          {
            startDate,
            endDate,
          },
        )
        .andWhere('trainer.id = :trainerId', {
          trainerId: createWebinarDto.trainer,
        })
        .getMany(),
    ]);
    console.log(isAlreadyScheduledWebinar, 999);
    if (isAlreadyScheduledWebinar.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Trainer is already assigned to any batch or webinar on the same time. ',
      );
    const batchExists = await this.batchRepo.find({
      where: [
        {
          startDate: MoreThanOrEqual(startDate),
          endDate: LessThanOrEqual(endDate),
          trainer: { id: createWebinarDto.trainer },
        },
        {
          startDate: LessThanOrEqual(startDate),
          endDate: MoreThanOrEqual(endDate),
          trainer: { id: createWebinarDto.trainer },
        },
        {
          startDate: MoreThanOrEqual(startDate) && LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(endDate),
          trainer: { id: createWebinarDto.trainer },
        },
        {
          startDate: LessThanOrEqual(startDate),
          endDate: LessThanOrEqual(endDate) && MoreThanOrEqual(startDate),
          trainer: { id: createWebinarDto.trainer },
        },
      ],
    });
 
    if (batchExists.length) {
      const batchStartHour = startDate.getHours() * 60 + startDate.getMinutes();
      const batchEndHour = endDate.getHours() * 60 + endDate.getMinutes();
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
    let meetDetails: MeetDto;
    if (createWebinarDto.isUpcoming) {
      const createMeetdto = {
        startDate: createWebinarDto.date,
        startTime: createWebinarDto.startTime,
        endTime: createWebinarDto.endTime,
        webinarName: createWebinarDto.title,
        trainerId: createWebinarDto.trainer,
      };
      meetDetails = await this.microsoftTeamService.createWebinar(
        createMeetdto,
        credential?.outLookToken,
      );
 
      //  Check if webinar created or not
      if (!meetDetails)
        new HttpException(HttpStatus.BAD_REQUEST, 'webinar not created');
    }
 
    //  Creating a webinar if everything is fine
    const createdWebinar = this.webinarRepo.create({
      ...createWebinarDto,
      category: category,
      availableSeats: createWebinarDto.noOfSeats,
      trainer,
      meetingId: meetDetails?.id ? meetDetails.id : null,
      meetingUrl: meetDetails?.link ? meetDetails.link : null,
      callId: meetDetails?.callId ? meetDetails.callId : null,
      startDate,
      endDate,
    });
 
    createdWebinar.metaTags = createWebinarDto.metaTags;
    createdWebinar.metaTitle = createWebinarDto.metaTitle;
    createdWebinar.metaDescription = createWebinarDto.metaDescription;
    if (!createdWebinar)
      new HttpException(HttpStatus.BAD_REQUEST, 'webinar not  created');
    //notify trainer when webinar gets scheduled
    const webinarDetails = await this.webinarRepo.save(createdWebinar);
    const result = await this.notificationsRepo.create({
      title: 'Webinar Scheduled',
      description: `${webinarDetails.title} has been scheduled  from ${webinarDetails.startDate} to ${webinarDetails.endDate}`,
      receiverType: 'Trainers',
      trainerId: createWebinarDto.trainer,
    });
    return await this.webinarRepo.findOne({
      where: { id: webinarDetails.id },
      relations: { trainer: { auth: true } },
    });
  }
 
  //  Fetches all webinars with pagination
  //  Fetches all webinars with pagination
  async findAll(query: QueryWebinarDTO) {
    const {
      search = '',
      category,
      speaker,
      date,
      recordingAvailable,
      web,
      filterId,
    } = query;
    const limit = query.page < 1 ? 1 : query.limit || 10;
    const page = query.page < 1 ? 1 : query.page || 1;
    const searchQuery = search.toLowerCase();
 
    // Applying filters and fetching upcoming webinars
    const queryData = this.webinarRepo
      .createQueryBuilder('webinar')
      .leftJoinAndSelect('webinar.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoinAndSelect('webinar.category', 'category')
      .select([
        'webinar.id',
        'webinar.title',
        'webinar.startDate',
        'webinar.lastModifiedDate',
        'webinar.endDate',
        'webinar.slugName',
        'webinar.description',
        'webinar.featuredImage',
        'webinar.coverImage',
        'webinar.profilePic',
        'trainer.id',
        'auth.name',
        'category.name',
      ])
      .where(searchQuery ? 'webinar.title ILike :name' : '1=1', {
        name: `%${searchQuery}%`,
      })
      .andWhere(web ? 'webinar.published = :web' : '1=1', { web })
      .andWhere(web ? 'webinar."availableSeats" > :seat' : '1=1', { seat: 0 })
      .andWhere(filterId ? 'webinar.slugName <> :filterId' : '1=1', {
        filterId,
      })
      .andWhere(category ? 'category.id = :categoryId' : '1=1', {
        categoryId: category || null,
      })
      .andWhere(speaker ? 'trainer.id = :trainerId' : '1=1', {
        trainerId: speaker || null,
      })
      .andWhere(
        recordingAvailable === 'true'
          ? 'webinar.recordingUrl IS NOT NULL'
          : '1=1',
      )
      .andWhere(!date ? 'webinar.startDate > :startDate' : '1=1', {
        startDate: new Date(),
      })
      .orderBy('webinar.lastModifiedDate', 'DESC');
 
    // Applying filters and fetching on-demand webinars
    const onDemandQuery = this.webinarRepo
      .createQueryBuilder('webinar')
      .leftJoinAndSelect('webinar.trainer', 'trainer')
      .leftJoinAndSelect('trainer.auth', 'auth')
      .leftJoinAndSelect('webinar.category', 'category')
      .select([
        'webinar.id',
        'webinar.title',
        'webinar.startDate',
        'webinar.lastModifiedDate',
        'webinar.endDate',
        'webinar.slugName',
        'webinar.description',
        'webinar.featuredImage',
        'webinar.coverImage',
        'webinar.profilePic',
        'webinar.designation',
        'trainer.qualification',
        'trainer.id',
        'auth.name',
        'category.name',
      ])
      .where(searchQuery ? 'webinar.title ILike :name' : '1=1', {
        name: `%${searchQuery}%`,
      })
      .andWhere(web ? 'webinar.published = :web' : '1=1', { web })
      .andWhere(filterId ? 'webinar.slugName <> :filterId' : '1=1', {
        filterId,
      })
      .andWhere(category ? 'category.id = :categoryId' : '1=1', {
        categoryId: category || null,
      })
      .andWhere(speaker ? 'trainer.id = :trainerId' : '1=1', {
        trainerId: speaker || null,
      })
      .andWhere(
        recordingAvailable === 'true'
          ? 'webinar.recordingUrl IS NOT NULL'
          : '1=1',
      )
      .andWhere(!date ? 'webinar.startDate < :startDate' : '1=1', {
        startDate: new Date(),
      })
      .orderBy('webinar.lastModifiedDate', 'DESC')
      .take(9);
 
    // Filtering webinars with provided date
    if (date) {
      const startDate = moment(date, 'YYYY-MM-DD').startOf('day').toDate();
      const endDate = moment(date, 'YYYY-MM-DD').endOf('day').toDate();
      queryData.andWhere(
        'webinar.startDate > :startDate AND webinar.startDate > :now AND webinar.startDate < :endDate',
        {
          startDate,
          now: new Date(),
          endDate,
        },
      );
 
      onDemandQuery.andWhere(
        'webinar.startDate > :startDate AND webinar.startDate < :now AND webinar.startDate < :endDate',
        {
          startDate,
          now: new Date(),
          endDate,
        },
      );
    }
 
    // Apply pagination on both queries (upcoming and on-demand)
    if (!web) {
      queryData.take(limit).skip((page - 1) * limit);
      onDemandQuery.take(limit).skip((page - 1) * limit);
    }
 
    // Resolving all promises and returning the data
    const [
      upcoming,
      onDemand,
      totalCount,
      upcomingWebinarCount,
      ondemandWebinarCount,
    ] = await Promise.all([
      queryData.getMany(), // Execute the query for upcoming webinars
      onDemandQuery.getMany(), // Execute the query for on-demand webinars
      this.webinarRepo.count(), // Count all webinars in the database
      queryData.getCount(), // Count of upcoming webinars
      onDemandQuery.getCount(), // Count of on-demand webinars
    ]);
 
    return {
      upcoming,
      onDemand,
      totalCount,
      upcomingWebinarCount,
      ondemandWebinarCount,
    };
  }
 
  /**
   * Fetches one webinar by Slug
   *
   * @param slugDto
   * @returns Webinar
   */
  async findOne(slugDto: SlugDto) {
    //  Check if exists or throw exception
 
    const filterObject: object = {};
    slugDto.id
      ? (filterObject['id'] = slugDto.id)
      : (filterObject['slugName'] = slugDto.name);
    const webinar = await this.webinarRepo.findOne({
      where: filterObject,
      relations: ['trainer', 'trainer.auth'],
    });
    if (!webinar)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid webinar');
 
    return { ...webinar, onDemand: webinar.startDate < new Date() };
  }
 
  //  Updates a webinar
  async update(id: string, updateWebinarDto: UpdateWebinarDto) {
    //  Checks whether webinar exists or not
    const webinar = await this.webinarRepo.findOne({
      where: { id },
      relations: ['trainer', 'category', 'trainer.auth'],
    });
    let startDate: Date;
    let endDate: Date;
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    if (!webinar) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid id');
 
    //  Updating values from payload
    let seatChange = 0;
    if (updateWebinarDto.noOfSeats)
      seatChange = updateWebinarDto.noOfSeats - webinar.noOfSeats;
    webinar.noOfSeats = updateWebinarDto.noOfSeats;
    webinar.title = updateWebinarDto.title;
    webinar.meetingUrl = updateWebinarDto.meetingUri;
    webinar.featuredImage = updateWebinarDto.featuredImage;
    webinar.description = updateWebinarDto.description;
    webinar.designation = updateWebinarDto.designation;
    webinar.trainerBio = updateWebinarDto.trainerBio;
    webinar.recordingUrl = updateWebinarDto.recordingUrl;
    webinar.published = updateWebinarDto.published;
    webinar.whatYouWillLearnSection = updateWebinarDto.whatYouWillLearnSection;
    webinar.coverImage = updateWebinarDto.coverImage;
    webinar.metaDescription = updateWebinarDto.metaDescription;
    webinar.metaTitle = updateWebinarDto.metaTitle;
    webinar.metaTags = updateWebinarDto.metaTags;
    webinar.slugName = updateWebinarDto.slugName;
    webinar.availableSeats += seatChange;
 
    if (webinar.availableSeats < 0)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Cannot decrease seats any more',
      );
 
    const prevStartTime = webinar.startDate.toISOString().split('T')[1];
    const prevEndTime = webinar.endDate.toISOString().split('T')[1];
    let newTrainerEmail: string;
    let oldTrainerEmail: string;
    let newTrainerName: string;
 
    //  Handling date update
    if (updateWebinarDto.date) {
      //  If date is sent then update date as well as time
      startDate = webinar.startDate = new Date(
        //  converting IST to UTC if date is sent in payload
        updateWebinarDto.startTime
          ? convertISTtoUTC(updateWebinarDto.date, updateWebinarDto.startTime)
          : Date.parse(`${updateWebinarDto.date}T${prevStartTime}`),
      );
      endDate = webinar.endDate = new Date(
        updateWebinarDto.endTime
          ? convertISTtoUTC(updateWebinarDto.date, updateWebinarDto.endTime)
          : Date.parse(`${updateWebinarDto.date}T${prevEndTime}`),
      );
    } else {
      //  Updating only time and setting date to previously set date
      const prevDate = webinar.startDate.toISOString().split('T')[0];
      startDate = webinar.startDate = new Date(
        updateWebinarDto.startTime
          ? convertISTtoUTC(prevDate, updateWebinarDto.startTime)
          : Date.parse(`${prevDate}T${prevStartTime}`),
      );
      endDate = webinar.endDate = new Date(
        updateWebinarDto.endTime
          ? convertISTtoUTC(prevDate, updateWebinarDto.endTime)
          : Date.parse(`${prevDate}T${prevEndTime}`),
      );
    }
 
    webinar.profilePic = updateWebinarDto.profilePic;
    webinar.featuredImage = updateWebinarDto.featuredImage;
    webinar.feesINR = updateWebinarDto.feesINR;
    webinar.feesUSD = updateWebinarDto.feesUSD;
 
    //  Checking for valid category
    const category = updateWebinarDto.category
      ? await this.categoryRepo.findOne({
          where: { id: updateWebinarDto.category },
        })
      : webinar.category;
    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Category ID');
    webinar.category = category;
 
    //  Updating trainer
    const trainer = updateWebinarDto.trainer
      ? await this.trainerRepo.findOne({
          where: { id: updateWebinarDto.trainer },
          relations: ['auth'],
        })
      : webinar.trainer;
    if (!trainer)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid trainer id');
    if (updateWebinarDto.trainer) {
      newTrainerEmail = trainer.auth.email;
      newTrainerName = trainer.auth.name;
      oldTrainerEmail = webinar.trainer.auth.email;
    }
    webinar.trainer = trainer;
    const updateTeamWebinar = {
      webinarName: updateWebinarDto.title,
      startDate,
      endDate,
      newTrainerEmail,
      newTrainerName,
      oldTrainerEmail,
    };
    if (
      updateWebinarDto.title ||
      updateWebinarDto.startTime ||
      updateWebinarDto.endTime ||
      updateWebinarDto.date ||
      updateWebinarDto.trainer
    ) {
      const [isAlreadyScheduledWebinar] = await Promise.all([
        this.webinarRepo
          .createQueryBuilder('webinar')
          .leftJoin('webinar.trainer', 'trainer')
          .where(
            'webinar.startDate <= :startDate and webinar.endDate >= :endDate and webinar.id <> :id',
            {
              startDate,
              endDate,
              id,
            },
          )
          .orWhere(
            'webinar.endDate >= :startDate and webinar.startDate <= :endDate and  webinar.id <> :id',
            {
              startDate,
              endDate,
              id,
            },
          )
          .orWhere(
            'webinar.startDate >= :startDate and webinar.startDate <= :endDate and webinar.endDate >= :endDate and  webinar.id <> :id',
            {
              startDate,
              endDate,
              id,
            },
          )
          .orWhere(
            'webinar.startDate <= :startDate and webinar.endDate <= :endDate and webinar.endDate >= :startDate and  webinar.id <> :id',
            {
              startDate,
              endDate,
              id,
            },
          )
          .andWhere('trainer.id = :trainerId', {
            trainerId: updateWebinarDto.trainer
              ? updateWebinarDto.trainer
              : webinar.trainer.id,
          })
          .andWhere('webinar.id <> :id', { id })
          .getMany(),
      ]);
      console.log(isAlreadyScheduledWebinar);
      if (isAlreadyScheduledWebinar.length)
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          'Trainer is already assigned to any batch or webinar on the same time. ',
        );
      const batchExists = await this.batchRepo.find({
        where: [
          {
            startDate: MoreThanOrEqual(startDate),
            endDate: LessThanOrEqual(endDate),
            trainer: {
              id: updateWebinarDto.trainer
                ? updateWebinarDto.trainer
                : webinar.trainer.id,
            },
          },
          {
            startDate: LessThanOrEqual(startDate),
            endDate: MoreThanOrEqual(endDate),
            trainer: {
              id: updateWebinarDto.trainer
                ? updateWebinarDto.trainer
                : webinar.trainer.id,
            },
          },
          {
            startDate: MoreThanOrEqual(startDate) && LessThanOrEqual(endDate),
            endDate: MoreThanOrEqual(endDate),
            trainer: {
              id: updateWebinarDto.trainer
                ? updateWebinarDto.trainer
                : webinar.trainer.id,
            },
          },
          {
            startDate: LessThanOrEqual(startDate),
            endDate: LessThanOrEqual(endDate) && MoreThanOrEqual(startDate),
            trainer: {
              id: updateWebinarDto.trainer
                ? updateWebinarDto.trainer
                : webinar.trainer.id,
            },
          },
        ],
      });
 
      if (batchExists) {
        const batchStartHour =
          startDate.getHours() * 60 + startDate.getMinutes();
        const batchEndHour = endDate.getHours() * 60 + endDate.getMinutes();
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
 
      await this.microsoftTeamService.updateWebinarEvent(
        updateTeamWebinar,
        credential?.outLookToken,
        webinar.meetingId,
      );
    }
    const result = await this.notificationsRepo.create({
      title: 'Webinar Edited',
      description: `${webinar.title} has been edited successfully`,
      receiverType: 'Trainers',
      trainerId: webinar.trainer.id,
    });
    return await this.webinarRepo.save(webinar);
  }
 
  /**
   * Soft deletes a webinar
   *
   * @param id
   */
  async remove(id: string): Promise<void> {
    //  Check if the webinar exists
    const webinar = await this.webinarRepo.findOne({ where: { id } });
    if (webinar.endDate < new Date()) {
      await this.webinarRepo.softDelete({ id });
      return;
    }
    const enrollStudents = await this.webinarEnrollmentRepo.find({
      where: { webinar: { id } },
      relations: ['auth'],
    });
    //  Fetching the outlook token for canceling the event
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
 
    //  Throw error if the webinar doesn't exist
    if (!webinar) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid id');
    const isWebinarCancel = await this.microsoftTeamService.cancelEvent(
      credential?.outLookToken,
      webinar.meetingId,
    );
    //  Throw error if the API fails
    if (!isWebinarCancel)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This webinar has not cancelled',
      );
    //  Soft deletes the webinar
    if (enrollStudents.length) {
      for (let i = 0; i < enrollStudents.length; i++) {
        this.mailService.sendViaSendGrid({
          to: enrollStudents[i].auth.email.toLowerCase(),
          subject: 'Webinar Cancelled',
          text: webinarCancelBody({
            date: moment(webinar.startDate)
              .tz(enrollStudents[i].auth.timeZone || 'Asia/Calcutta')
              .format('DD/MM/YY'),
            time: moment(webinar.startDate)
              .tz(enrollStudents[i].auth.timeZone || 'Asia/Calcutta')
              .format('hh:mm A'),
            name: enrollStudents[i].auth.name.toLowerCase(),
          }),
        });
      }
    }
    await this.webinarRepo.softDelete({ id });
  }
 
  /**
   * Enroll student into webinar
   *
   * @param enrollment
   * @returns Webinar enrollment
   */
  async enroll(enrollment: EnrollWebinarDto, timezone?: string) {
    let user = await this.authRepo.findOne({
      where: { email: enrollment.email },
    });
    if (!user) {
      user = new AuthEntity();
      user.name = enrollment.name;
      user.email = enrollment.email;
      user.phoneNumber = enrollment.phone;
      user = await this.authRepo.save(user);
    }
    const studentDetails = await this.studentRepo.findOne({
      where: { auth: { email: enrollment.email } },
    });
    // if (!auth) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid user');
    const webinar = await this.webinarRepo.findOne({
      where: { id: enrollment.webinarID },
    });
 
    if (!webinar)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid webinar id');
    const alreadyEnrolled = await this.webinarEnrollmentRepo
      .createQueryBuilder('webenrolled')
      .leftJoinAndSelect('webenrolled.auth', 'auth')
      .leftJoinAndSelect('webenrolled.webinar', 'webinar')
      .where('auth.email = :email', { email: enrollment.email })
      .andWhere('webenrolled.webinar.id = :webId', {
        webId: enrollment.webinarID,
      })
      .getOne();
    if (webinar.availableSeats === 0)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'No more seats are available',
      );
    const credential: CredentialEntity = await this.credentialRepo.findOne({
      where: { type: 'outlook' },
    });
    if (alreadyEnrolled)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Already enrolled');
    const isWebinarUpdate =
      await this.microsoftTeamService.enrollStudentIntoEvent(
        webinar.meetingId,
        credential?.outLookToken,
        user.name,
        user.email,
      );
    if (!isWebinarUpdate) throw new HttpException(400, ' Something went wrong');
    const newEnroll = new WebinarEnrollment();
    newEnroll.auth = user;
    newEnroll.webinar = webinar;
    webinar.availableSeats--;
    await this.webinarRepo.save(webinar);
 
    // send mail to user
 
    const date1 = moment(webinar.startDate);
    const date2 = moment(webinar.endDate);
 
    const hoursDiff = date2.diff(date1, 'hours');
    const minsDiff = date2.diff(date1, 'minutes');
 
    const startDate = moment(webinar.startDate).tz(timezone).format('DD/MM/YY');
    const startTime = moment(webinar.startDate).tz(timezone).format('hh:mm A');
 
    this.mailService.sendViaSendGrid({
      to: user.email.toLowerCase(),
      subject: 'Your Webinar Seat Confirmation',
      text: getWebinarEnrollmentMailBody({
        date: startDate,
        duration: hoursDiff.toString(),
        platform: webinar.webinarPlatform,
        meetingUrl: webinar.meetingUrl,
        time: startTime,
        name: user.name,
        title: webinar.title,
        durationMinutes: minsDiff.toString(),
      }),
    });
 
    if (studentDetails)
      await this.notificationsRepo.create({
        title: 'Webinar Enroll',
        description: `You have successfully enrolled in ${webinar.title} webinar`,
        receiverType: 'Students',
        studentId: studentDetails.id,
      });
    return await this.webinarEnrollmentRepo.save(newEnroll);
  }
 
  async getEnrollments(webinarId: string, search: string) {
    const enrollments = await this.webinarEnrollmentRepo
      .createQueryBuilder('webenrolled')
      .leftJoin('webenrolled.auth', 'auth')
      .select([
        'webenrolled.id',
        'auth.name',
        'auth.email',
        'auth.phoneNumber',
        'webenrolled.registeredAt',
      ])
      .leftJoin('webenrolled.webinar', 'webinar')
      .where('webinar.id = :webinarId', { webinarId })
      .andWhere(search ? 'auth.name ILIKE :search ' : '1=1', {
        search: `%${search}%`,
      })
      .getMany();
 
    const payload = enrollments.map((item) => ({
      id: item.id,
      name: item.auth.name,
      email: item.auth.email,
      phoneNumber: item.auth.phoneNumber,
      registerDate: item.registeredAt,
    }));
    return payload;
  }
 
  // @Cron('*/1 * * * *')
  async reminder() {
    const startDateForMinute: Date = moment().add(5, 'minutes').toDate();
    const endDateForMinute: Date = moment().add(6, 'minutes').toDate();
    const startDateForFourHour: Date = moment().add(4, 'hour').toDate();
    const endDateForFourHour: Date = moment()
      .add(4, 'hour')
      .add(1, 'minutes')
      .toDate();
    const startDateForOneHour: Date = moment().add(1, 'hour').toDate();
    const endDateForOneHour: Date = moment()
      .add(1, 'hour')
      .add(1, 'minutes')
      .toDate();
    const [firstwebinars, secondWebinar, thirdWebinar] = await Promise.all([
      this.todayWebinar(startDateForMinute, endDateForMinute),
      this.todayWebinar(startDateForOneHour, endDateForOneHour),
      this.todayWebinar(startDateForFourHour, endDateForFourHour),
    ]);
    const webinarsDetails = [
      ...firstwebinars,
      ...secondWebinar,
      ...thirdWebinar,
    ];
    if (webinarsDetails.length) {
      webinarsDetails.map((webinar) => {
        const emailObject: EmailTriger = {
          name: webinar.auth?.name,
          date: moment().format('YYYY-MM-DD'),
          platform: 'TEAMS',
          weblink: webinar.webinar.meetingUrl,
          email: webinar.auth?.email,
        };
        this.triggerMail(emailObject);
      });
    }
  }
 
  @Cron(CronExpression.EVERY_2_HOURS)
  async webinarCompletion() {
    const webinars = await this.webinarRepo.find({
      where: { mailSent: false, endDate: LessThan(new Date()) },
    });
 
    const webinarArr = [];
    const updatedWeb = webinars.map((item) => {
      item.mailSent = true;
      webinarArr.push(item.id);
      return item;
    });
 
    const savedWebinarPromise = updatedWeb.map((item) =>
      this.webinarRepo.save(item),
    );
    await Promise.all(savedWebinarPromise);
 
    const enrollments = await this.webinarEnrollmentRepo.find({
      where: { webinar: { id: In(webinarArr) } },
      relations: { auth: true, webinar: true },
    });
    enrollments.forEach((item) => {
      const { subject, body } = getWebinarCompletionMailBody(
        item.webinar.title,
      );
      this.mailService.sendViaSendGrid({
        subject,
        text: body,
        to: item.auth.email,
      });
    });
  }
 
  async todayWebinar(
    startDate: Date,
    endDate: Date,
  ): Promise<WebinarEnrollment[]> {
  
    const webinars = await this.webinarEnrollmentRepo
      .createQueryBuilder('webinar-enrollment')
      .leftJoinAndSelect('webinar-enrollment.auth', 'auth')
      .leftJoinAndSelect('webinar-enrollment.webinar', 'webinar')
      .where(`webinar."startDate" <= :startDate`, { startDate })
      .andWhere('webinar.startDate > :endDate', { endDate })
      .getMany();
    return webinars;
  }
 
  async triggerMail(payload: EmailTriger) {
    const emailTemplates = `<p>Dear ${payload.name}</p>
    <p>We appreciate your registration in the <strong>(Webinar name)</strong> at SnowLabs Technology. The webinar is scheduled to commence in the next 3 days/1 day/3 hours/1 hour.</p>
    <p>Here are the details for the webinar:</p>
    <ul>
        <li><strong>Date:</strong> ${payload.date}</li>
        <li><strong>Platform:</strong>${payload.platform}</li>
    </ul>
    <p>Webinar Access Link: <a href="${payload.weblink}">Webinar Access Link</a></p>
    <p>Please mark your calendar and set a reminder for the event. Simply click on the provided access link to join the session.</p>
    <p>If you have any questions or need further information before the webinar, please feel free to reach out to us at <a href="mailto:training@snowlabstechnology.com">training@snowlabstechnology.com</a></p>
    <p>We look forward to having you with us and sharing valuable insights during the webinar. Thank you for your participation and support.</p>
    <p>Best regards,</p>
    <p>Team SnowLabs Technology</p>`;
    this.mailService.sendViaSendGrid({
      to: process.env.MAIL_MAIL,
      subject: 'Webinar Reminder',
      text: emailTemplates,
    });
  }
  async upcomingWebinars(): Promise<Webinar[]> {
    const webinars = await this.webinarRepo.find({
      where: { startDate: MoreThanOrEqual(new Date()) },
      select: ['id', 'title', 'meetingId'],
    });
    return webinars;
  }
  //i have a webinar table in which trainerId is a column and value present in trainerId is a id column in trainer table
  // and in trainer table authId is a column and value present in this authId is id column in auth table
  // and in auth table fullName is a column name i want to select that column name do some join relations or something else
  // and complete the above code with addition of fullName column.
 
  async getWebinarDetails() {
  
    const currentDate = new Date();
 
    const upcoming = await this.webinarRepo
      .createQueryBuilder('webinar')
      .leftJoinAndSelect('webinar.category', 'category')
      .leftJoin('webinar.trainer', 'trainer') // Joining trainer table
      .select([
        'webinar.id',
        'webinar.title',
        'webinar.startDate',
        'webinar.lastModifiedDate',
        'webinar.endDate',
        'webinar.slugName',
 
        'webinar.description',
        'webinar.featuredImage',
        'webinar.profilePic',
      
        'category.name',
      ])
      .where(
        'webinar.startDate >= :currentDate AND webinar.endDate >= :currentDate',
        { currentDate },
      )
      .orderBy('webinar.startDate', 'DESC')
      .take(2)
      .getMany();
 
    return {
      upcoming,
    };
  }
}