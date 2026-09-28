import { HttpStatus, Injectable } from '@nestjs/common';
import HttpException from '@utils/exceptions/HttpException';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionEntity } from './entities/session.entity';
import {
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto';
import { BatchEntity } from '@batch/entities/batch.entity';
import { SearchFeedBack, SearchSessionDto } from './dto/search-session.dto';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import {
  AssignmentEnum,
  BatchTypeEnum,
  FeedBackType,
  ResourceType,
  SessionType,
} from '@utils/enum';
import { SessionFeedbackDto } from './dto/submiit-feedback.dto';
import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { SessionFeedback } from './entities/session-feedback.entity';
import { SessionFeedbackQuestions } from './entities/session-feedback-questions.entity';
import { SesssionFeedbackSubmission } from './entities/feedback-submission.entity';
import { NotificationsService } from '@notifications/notifications.service';
import * as moment from 'moment';
import { FeedbackSubmission } from 'feedbacks/entities/feedback-form-submission.entity';
import { FeedbackAnswer } from 'feedbacks/entities/feedback-form-answer.entity';
import {
  FeedbackFormDto,
  FeedbackQuestion,
} from 'feedbacks/dto/feedback-form.dto';
import { FeedbackQuestions } from 'feedbacks/entities/feedback-questions.entity';
import { FeedbackFormSubmitDto } from 'feedbacks/dto/feedback-submit.dto';
import { LastSessionDto, PendingSessionDto } from 'student-lms/dto/search.dto';
import { UUID } from 'crypto';
import { Session } from 'inspector';
import { CopyResourseDto } from './entities/copy-resource.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { MicrosoftTeamService } from 'microsoft-team/microsoft-team.service';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { UpdateMeetDto } from 'microsoft-team/dto/meet.dto';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { MailService } from '@mail/mail.service';
import { getCancellationMailBody } from '@utils/helpers/mailbody.helper';
import { UpdateSessionDto } from './dto/update-session.dto';
import { session } from 'passport';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(CredentialEntity)
    private credentialRepo: Repository<CredentialEntity>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(AssignmentSubmission)
    private assignSubmissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Trainer)
    private trainerRepo: Repository<Trainer>,
    @InjectRepository(ResourceEntity)
    private resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(FeedbackSubmission)
    private feedbackSubmissionRepo: Repository<FeedbackSubmission>,
    @InjectRepository(FeedbackAnswer)
    private feedbackAnswerRepo: Repository<FeedbackAnswer>,
    @InjectRepository(FeedbackQuestions)
    private feedbackQuestionRepo: Repository<FeedbackQuestions>,
    // @InjectRepository(FeedbackSubmission)
    // private submissionRepo: Repository<FeedbackSubmission>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    private readonly mailService: MailService,
    private notificationService: NotificationsService,
    private readonly microsoftTeamService: MicrosoftTeamService,
  ) {}

  getNextMaxNumber(arr: number[], num: number): number {
    // Find the index of the given number in the array
    const index: number = arr.indexOf(num);

    // If the number is not in the array or is the last element, return the first element
    if (index === -1 || index === arr.length - 1) {
      return arr[0];
    }

    // Otherwise, return the next element in the array
    return arr[index + 1];
  }

  nextSessionDate(inputDate: Date, weekdays: number[]): Date {
    const currentDay = moment(inputDate).day();
    weekdays = weekdays.sort();

    // Find the next weekday in the sorted array
    let nextWeekday = this.getNextMaxNumber(weekdays, currentDay);

    // Calculate the difference to the next occurrence of the specified weekday
    const dayDifference =
      nextWeekday > currentDay
        ? nextWeekday - currentDay
        : currentDay - nextWeekday;
    console.log(dayDifference);
    // Calculate the next session date
    const nextDate = moment(inputDate).add(dayDifference, 'days').toDate();

    return nextDate;
  }

  /**
   * Creates sessions based on provided batch and events.
   * @param batch - The batch for which sessions need to be created.
   * @param events - Array of events containing session details.
   */
  async createSession(batch: BatchEntity, events: any) {
    try {
      // Fetch batch details from the database
      const batchDetails = await this.batchRepo.findOne({
        where: { id: batch.id },
        relations: ['course'],
      });

      // If batch details are not found, throw a 404 exception
      if (!batchDetails) {
        throw new HttpException(404, 'Batch not found');
      }

      const sessions: Array<Object> = [];

      // Iterate through events to create session objects
      for (let i = 0; i < events.length; i++) {
        const sessionObject: CreateSessionDto = {
          sessionDate: events[i].start.dateTime,
          sessionEndDate: events[i].end.dateTime,
          batch: batchDetails,
          occurrenceId: events[i].id,
          callId: events[i].iCalUId,
          sessionName: `Session-${i + 1}`,
          meetingUrl: events[i].onlineMeeting?.joinUrl,
          index: i + 1,
        };

        sessions.push(sessionObject);
      }

      // Insert session objects into the database
      await this.sessionRepo
        .createQueryBuilder('session')
        .insert()
        .values(sessions)
        .execute();
    } catch (error) {
      // Handle any errors that may occur during session creation
      throw new HttpException(500, 'Internal server error');
    }
  }

  /**
   * Retrieves a paginated list of sessions for a batch.
   * @param searchDto - The search criteria for fetching sessions.
   * @returns A promise containing an object with sessions and total count.
   */
  async sessionList(
    searchDto: SearchSessionDto,
  ): Promise<{ sessions: any[]; total: number }> {
    const { pageLength = 10, pageNo = 1 } = searchDto;
    const batchDetails = await this.batchRepo.findOne({
      where: { id: searchDto.batchId },
    });

    if (!batchDetails) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Batch not found');
    }

    // Fetch all sessions including soft-deleted ones
    const [sessions, sessionCount] = await this.sessionRepo.findAndCount({
      where: { batch: { id: searchDto.batchId } },
      withDeleted: true,
      skip: (pageNo - 1) * pageLength,
      take: pageLength,
      order: { index: 'ASC' },
      relations: ['batch'],
    });

    // Add isDeleted field for frontend
    // const sessionsWithFlags = sessions.map(session => ({
    //   ...session,
    //   isDeleted: !!session.deletedAt,
    //   isCancelled: !!session.isCancelled,
    // }));
    const sessionsWithFlags = sessions.map((session) => {
      const { batch, ...sessionData } = session;
      return {
        ...sessionData,
        batchId: session.batch?.id,
        isDeleted: !!session.deletedAt,
        isCancelled: !!session.isCancelled,
      };
    });

    return { sessions: sessionsWithFlags, total: sessionCount };
  }

  async getSession(id: string): Promise<SessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['resources', 'quiz'],
    });
    if (!session)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid session');
    return session;
  }

  async trainerSessions(
    batchId: string,
    authId: string,
  ): Promise<{
    upcomingSessions: SessionEntity[];
    totalUpcomingSessions: number;
    totalCompletedSessions: number;
    totalAssignments: number;
    totalEvaluatedAssignments: number;
    overallRating: SessionEntity[];
  }> {
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'trainer not found');
    const batchDetails = await this.batchRepo.findOne({
      where: { id: batchId },
    });
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
    const checkDate = moment().endOf('day').toDate();
    const currentDate: Date = new Date();
    let upcomingSessions = [];
    let totalupcomingSessionOfBatch = 0;

    upcomingSessions = await this.sessionRepo.find({
      where: {
        batch: { id: batchId, batchType: BatchTypeEnum.LIVE },
        sessionDate: LessThan(checkDate),
        isCancelled: false,
        isPublished: true,
      },
      select: {
        id: true,
        sessionDate: true,
        sessionEndDate: true,
        sessionName: true,
        meetingUrl: true,
        batch: { totalDuration: true },
        index: true,
      },
      relations: { batch: true },
      order: { index: 'ASC' },
    });
    if (!upcomingSessions?.length) {
      upcomingSessions = await this.sessionRepo.find({
        where: {
          batch: { id: batchId },
          isCancelled: false,
          isPublished: true,
        },
        select: {
          id: true,
          sessionDate: true,
          sessionEndDate: true,
          sessionName: true,
          meetingUrl: true,
          batch: { totalDuration: true },
          index: true,
        },
        relations: { batch: true },
        order: { index: 'ASC' },
        take: batchDetails.batchType === BatchTypeEnum.LIVE ? 1 : 0,
      });

      const [upcomingSessionOfBatch, totalupcomingSessionOfBatch] =
        await this.sessionRepo.findAndCount({
          where: {
            batch: { id: batchId },
            sessionDate: MoreThanOrEqual(currentDate),
          },
        });
    }

    const completedSessionsPromise = this.sessionRepo.findAndCount({
      where: [
        {
          batch: { id: batchId },
          sessionEndDate: LessThanOrEqual(currentDate),
          isPublished: true,
        },
        {
          batch: { id: batchId },
        },
      ],
      select: {
        id: true,
        sessionDate: true,
        sessionName: true,
        meetingUrl: true,
      },
    });
    const totalAssignmentPromise = this.assignSubmissionRepo.count({
      where: {
        session: { batch: { id: batchId } },
        status: AssignmentEnum.SUBMITTED,
      },
    });
    const totalEvaluatedAssignmentPromise = this.assignSubmissionRepo.count({
      where: {
        session: { batch: { id: batchId } },
        isEvaluated: true,
        status: AssignmentEnum.SUBMITTED,
      },
    });
    const [
      completedSessionsResult,
      totalAssignments,
      totalEvaluatedAssignments,
      overallRating,
    ] = await Promise.all([
      completedSessionsPromise,
      totalAssignmentPromise,
      totalEvaluatedAssignmentPromise,
      this.sessionRepo.query(overallRatingQuery, [
        trainerDetails.id,
        FeedBackType.POST_SESSION,
        batchId,
      ]),
    ]);

    const [completedSessions, totalCompletedSessions] = completedSessionsResult;
    return {
      upcomingSessions,
      totalUpcomingSessions: totalupcomingSessionOfBatch,
      totalCompletedSessions,
      totalAssignments,
      totalEvaluatedAssignments,
      overallRating,
    };
  }

  //   @Cron('* * * * *')
  //   async sessionRemainder() {
  //     const currentTimeMinus30Minutes = new Date();
  // currentTimeMinus30Minutes.setMinutes(currentTimeMinus30Minutes.getMinutes() + 30);
  // const currentTime = currentTimeMinus30Minutes.toTimeString().slice(0, 8);
  // const currentDate = currentTimeMinus30Minutes.toISOString().slice(0, 19).replace('T', ' ')
  //     let target = currentDate.split(" ")[0] + " " + currentTime
  // const sessions = await this.sessionRepo
  //   .createQueryBuilder('session').leftJoinAndSelect('session.batch', 'batch')
  //   .where('session.sessionDate = :currentDate', { currentDate:target })
  //       .getMany();
  //       await Promise.all(
  //         sessions.map(async (f) => {
  //           await this.notificationService.create({ title: "Session Reminder", description: `Your session ${f.sessionName} is scheduled to start in 30 minutes at ${new Date(f.sessionDate).toTimeString().split(" ")[0]} today.`, receiverType: "Students", batchId: `${f.batch.id}` });
  //           await this.notificationService.create({ title: "Session Reminder", description: `Session ${f.sessionName} is scheduled to start in 30 minutes at ${new Date(f.sessionDate).toTimeString().split(" ")[0]} today.`, receiverType: "Admins", batchId: `${f.batch.id}` });
  //          await this.notificationService.create({ title: "Session Reminder", description: `Your session  ${f.sessionName} is scheduled to start in 30 minutes at ${new Date(f.sessionDate).toTimeString().split(" ")[0]} today.`, receiverType: "Traniers", batchId: `${f.batch.id}` });
  //     }),
  //   );

  //   }

  async submitFeedback(studentId: string, payload: FeedbackFormSubmitDto) {
    const studentDetails = await this.studentRepo.findOne({
      where: { auth: { id: studentId } },
    });
    if (!studentDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'student not found');

    const sessionDetails = await this.sessionRepo.findOne({
      where: { id: payload.sessionId },
    });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    if (!payload.feedback.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'please provide feedback',
      );
    const newFeedback = new FeedbackSubmission();
    newFeedback.student = studentDetails;
    newFeedback.session = sessionDetails;
    newFeedback.type = payload.type;
    newFeedback.rating = payload.rating;
    newFeedback.status = AssignmentEnum.SUBMITTED;
    const feedbackDetails = await this.feedbackSubmissionRepo.save(newFeedback);
    const feedbackPromises = payload.feedback.map(async (feedback) => {
      const questions = await this.feedbackQuestionRepo.findOne({
        where: { id: feedback.questionId },
      });
      const feedbackSubmission = new FeedbackAnswer();
      feedbackSubmission.comments = feedback.comments;
      feedbackSubmission.submission = feedbackDetails; // Make sure 'feedbackDetails' is defined
      feedbackSubmission.rating = feedback.rating;
      feedbackSubmission.selectAnswer = feedback.chooseOption;
      feedbackSubmission.question = questions;
      await this.feedbackAnswerRepo.save(feedbackSubmission);
    });

    await Promise.allSettled(feedbackPromises);
  }

  async courseFeedback(studentId: string, payload: FeedbackFormSubmitDto) {
    const studentDetails = await this.studentRepo.findOne({
      where: { auth: { id: studentId } },
    });
    if (!studentDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'student not found');

    const feedbackSubmissionDetails = await this.feedbackSubmissionRepo.findOne(
      {
        where: { id: payload.submissionId },
      },
    );
    if (!payload.feedback.length)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'please provide feedback',
      );
    const feedbackPromises = payload.feedback.map(async (feedback) => {
      const questions = await this.feedbackQuestionRepo.findOne({
        where: { id: feedback.questionId },
      });
      const feedbackSubmission = new FeedbackAnswer();
      feedbackSubmission.comments = feedback.comments;
      feedbackSubmission.submission = feedbackSubmissionDetails; // Make sure 'feedbackDetails' is defined
      feedbackSubmission.rating = feedback.rating;
      feedbackSubmission.selectAnswer = feedback.chooseOption;
      feedbackSubmission.question = questions;
      await this.feedbackAnswerRepo.save(feedbackSubmission);
    });

    await Promise.all(feedbackPromises);
    feedbackSubmissionDetails.status = AssignmentEnum.SUBMITTED;
    feedbackSubmissionDetails.rating = payload.rating;
    await this.feedbackSubmissionRepo.save(feedbackSubmissionDetails);
  }

  async sessionFeedbackList(
    sessionId: string,
    paylaod: SearchFeedBack,
  ): Promise<{ feedbacks: FeedbackSubmission[]; totalFeedback: number }> {
    const { pageLength = 10, pageNo = 1 } = paylaod;
    let filterObject: Object = {};
    const sessionDetails = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    const batchDetails = await this.batchRepo.findOne({
      where: { id: sessionId },
    });
    if (sessionDetails) {
      filterObject = {
        session: { id: sessionId },
        type: FeedBackType.POST_SESSION,
      };
    } else {
      filterObject = {
        batch: { id: sessionId },
        type: FeedBackType.POST_COURSE,
      };
    }

    const [feedbacks, totalFeedback] =
      await this.feedbackSubmissionRepo.findAndCount({
        where: filterObject,
        relations: ['student', 'answers', 'answers.question', 'student.auth'],
        select: {
          id: true,
          createdDate: true,
          student: { id: true, auth: { name: true, id: true } },
          rating: true,
          answers: {
            id: true,
            rating: true,
            comments: true,
            selectAnswer: true,
            question: {
              id: true,
              question: true,
              options: true,
              questionType: true,
            },
          },
        },
        take: pageLength,
        skip: (pageNo - 1) * pageLength,
      });
    return { feedbacks, totalFeedback };
  }

  async batchFeedbackList(
    batchId: string,
    paylaod: SearchFeedBack,
  ): Promise<{ feedbacks: BatchEntity[]; totalFeedback: number }> {
    const { pageLength = 10, pageNo = 1 } = paylaod;
    const query = `SELECT 
    s."sessionName",
    s.id,
    AVG(sf.rating) as rating,
    COUNT(sf.id) as "numberOfFeedback"
  FROM
    "session" s
  JOIN
    "feedback-form-submission" sf ON s.id = sf."sessionId"
  JOIN
    batch b ON s."batchId" = b.id
  WHERE
    b.id = $1
  AND
    sf."type"= $4
  GROUP BY
    s."sessionName",
    s.id
  ORDER BY
    s."index" ASC
  LIMIT $2
  OFFSET $3;
  `;
    const batchQuery = `SELECT
    ffs."type",
    ffs."batchId" AS "id",
    AVG(ffs.rating) AS rating,
    COUNT(ffs.id) AS "numberOfFeedback"
FROM
    "feedback-form-submission" ffs
WHERE
    ffs."batchId" = $1 AND ffs."type" = $2 and ffs."status"=$3
GROUP BY
    ffs."batchId", ffs."type"`;
    const postCourseFeedback = await this.feedbackSubmissionRepo.query(
      batchQuery,
      [batchId, FeedBackType.POST_COURSE, AssignmentEnum.SUBMITTED],
    );
    let feedbacks: any = await this.sessionRepo.query(query, [
      batchId,
      pageLength,
      (pageNo - 1) * pageLength,
      FeedBackType.POST_SESSION,
    ]);

    if (postCourseFeedback.length) feedbacks.unshift(...postCourseFeedback);

    return { feedbacks, totalFeedback: feedbacks.length };
  }

  async batchFeedbacks(
    trainerId: string,
    batchId: string,
    paylaod: SearchFeedBack,
  ): Promise<any> {
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: trainerId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'trainer not found');
    const { pageLength = 10, pageNo = 1 } = paylaod;
    const query = `SELECT 
    s."sessionName",
    s.id,
    s."sessionDate",
    AVG(sf.rating) as rating,
    COUNT(sf.id) as numberOfStudent
  FROM
    "session" s
  JOIN
    "feedback-form-submission" sf ON s.id = sf."sessionId"
  JOIN
    batch b ON s."batchId" = b.id
  WHERE
    b.id = $1 AND b."trainerId" =$4 AND sf."type"=$5
  GROUP BY
    s."sessionName",
    s.id,
    s."sessionDate"
  LIMIT $2
  OFFSET $3;
  `;
    const feedbacks = await this.sessionRepo.query(query, [
      batchId,
      pageLength,
      (pageNo - 1) * pageLength,
      trainerDetails.id,
      FeedBackType.POST_SESSION,
    ]);

    return { feedbacks, totalFeedback: feedbacks.length };
  }

  async trainerCalendar(
    batchId: string,
    trainerId: string,
  ): Promise<SessionEntity[]> {
    const batchDetails = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batchDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Batch not found');
    const trainerDetails = await this.trainerRepo.findOne({
      where: { auth: { id: trainerId } },
    });
    if (!trainerDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Trainer not found');
    const query = `select s."sessionName",b."batchId", s.id, c."courseName" ,
    s."sessionDate" as "sessionStartDate" from "session" s join batch b on
     s."batchId" = b.id join course c on b."courseId" =c.id  where b."trainerId"  =$1
      and b.id =$2 order by s."index";`;
    const sessions = await this.sessionRepo.query(query, [
      trainerDetails.id,
      batchId,
    ]);
    return sessions;
  }

  async lastSession(payload: LastSessionDto): Promise<SessionEntity[]> {
    const batchDetails = await this.batchRepo.findOne({
      where: { id: payload.batchId },
    });
    if (!batchDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Batch not found');
    return await this.sessionRepo.find({
      where: {
        batch: { id: payload.batchId },
        sessionEndDate: LessThan(new Date()),
      },
      order: { sessionEndDate: 'DESC' },
      take: 1,
      select: { id: true, sessionName: true },
    });
  }

  async pendingSessionFeedback(paylaod: PendingSessionDto, authId: string) {
    const isFeedbackSubmitted = await this.feedbackSubmissionRepo.findOne({
      where: {
        student: { auth: { id: authId } },
        session: { id: paylaod.sessionId },
        status: AssignmentEnum.SUBMITTED,
      },
    });
    const response: Object = {
      formType: FeedBackType.POST_SESSION,
      isOpen: isFeedbackSubmitted ? false : true,
      sessionId: paylaod.sessionId,
    };
    return response;
  }

  async commanSession(batchId: string): Promise<SessionEntity[]> {
    const sessions = await this.sessionRepo.find({
      where: { batch: { id: batchId } },
      select: ['sessionName', 'id'],
      order: { index: 'ASC' },
    });
    return sessions;
  }

  async postponedSession(sessionId: string) {
    const sessionDetails = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { batch: { trainer: { auth: true } } },
    });

    if (!sessionDetails) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
    }
    if (sessionDetails.sessionEndDate < new Date()) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Completed sessions cannot be removed',
      );
    }

    const { batch } = sessionDetails;

    const [batchDetails, credential, lastSession, numberOfSesssion] =
      await Promise.all([
        this.batchRepo.findOne({ where: { id: batch?.id } }),
        this.credentialRepo.findOne({ where: { type: 'outlook' } }),
        this.sessionRepo.findOne({
          where: { batch: { id: batch?.id } },
          order: { sessionEndDate: 'DESC' },
        }),
        this.sessionRepo.count({
          where: { batch: { id: batch.id } },
        }),
      ]);

    const endDate: Date = this.nextSessionDate(
      lastSession.sessionEndDate,
      batch?.weekDays,
    );

    const updateSessionDto = {
      startDate: sessionDetails?.batch.startDate,
      endDate,
      newTrainerEmail: '',
      oldTrainerEmail: '',
      newTrainerName: '',
      weekDays: batch?.weekDays,
    };

    await this.microsoftTeamService.updateBatchEvent(
      updateSessionDto,
      credential?.outLookToken,
      batch?.meetingId,
      true,
    );

    const events = await this.microsoftTeamService.occurrenceOfEvent(
      credential?.outLookToken,
      batch?.meetingId,
      updateSessionDto.startDate.toString(),
      updateSessionDto.endDate.toString(),
    );
    sessionDetails.isCancelled = true;
    await Promise.all([
      this.sessionRepo.save(sessionDetails),
      this.microsoftTeamService.cancelEvent(
        credential?.outLookToken,
        sessionDetails?.occurrenceId,
      ),
    ]);
    const latestSessionIndex = events?.length - 1;
    const newSession = new SessionEntity();
    newSession.sessionDate = events[latestSessionIndex].start.dateTime;
    newSession.sessionEndDate = events[latestSessionIndex].end.dateTime;
    newSession.batch = batchDetails;
    newSession.occurrenceId = events[latestSessionIndex].id;
    newSession.callId = events[latestSessionIndex].iCalUId;
    newSession.sessionName = `Session-${numberOfSesssion + 1}`;
    newSession.meetingUrl = events[latestSessionIndex].onlineMeeting?.joinUrl;
    newSession.index = numberOfSesssion + 1;
    await this.sessionRepo.save(newSession);
    batch.endDate = moment(new Date(events[latestSessionIndex].start.dateTime))
      .endOf('day')
      .toDate();
    const savedBatch = await this.batchRepo.save(batch);
    const enrollments = await this.enrollmentRepo.find({
      where: { batch: { id: savedBatch.id } },
      relations: { student: { auth: true } },
    });

    this.mailService.sendViaSendGrid({
      subject: 'Session Cancelled',
      text: getCancellationMailBody({
        date: moment(sessionDetails.sessionDate)
          .tz(batch.trainer.auth.timeZone || 'Asia/Calcutta')
          .format('DD/MM/YY'),
        time: moment(sessionDetails.sessionDate)
          .tz(batch.trainer.auth.timeZone || 'Asia/Calcutta')
          .format('hh:mm a'),
      }),
      to: batch.trainer.auth.email,
    });

    enrollments.map((enroll) => {
      return this.mailService.sendViaSendGrid({
        subject: 'Session Cancelled',
        text: getCancellationMailBody({
          date: moment(sessionDetails.sessionDate)
            .tz(enroll.student.auth.timeZone || 'Asia/Calcutta')
            .format('DD/MM/YY'),
          time: moment(sessionDetails.sessionDate)
            .tz(enroll.student.auth.timeZone || 'Asia/Calcutta')
            .format('hh:mm a'),
        }),
        to: enroll.student.auth.email,
      });
    });
  }

  async createSelfBatchSession(batch: BatchEntity) {
    try {
      // Fetch batch details from the database
      const batchDetails = await this.batchRepo.findOne({
        where: { id: batch.id },
        relations: ['course'],
      });

      // If batch details are not found, throw a 404 exception
      if (!batchDetails) {
        throw new HttpException(HttpStatus.BAD_REQUEST, 'Batch not found');
      }

      const sessions: Array<Object> = [];

      // Iterate through events to create session objects
      for (let i = 0; i < batch.totalSession; i++) {
        const sessionObject: CreateSessionDto = {
          batch: batchDetails,
          sessionName: `Session-${i + 1}`,
          index: i + 1,
        };

        sessions.push(sessionObject);
      }

      // Insert session objects into the database
      await this.sessionRepo
        .createQueryBuilder('session')
        .insert()
        .values(sessions)
        .execute();
    } catch (error) {
      // Handle any errors that may occur during session creation
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  async updateSelfBatchSesssion(batch: BatchEntity, numberOfSesssion: number) {
    try {
      const previousSessions = await this.sessionRepo.findOne({
        where: { batch: { id: batch?.id } },
        order: { index: 'DESC' },
      });
      if (!previousSessions)
        throw new HttpException(HttpStatus.BAD_REQUEST, 'session not found');
      const sessions: Array<Object> = [];
      for (let i = previousSessions.index; i < numberOfSesssion; i++) {
        const sessionObject: CreateSessionDto = {
          batch,
          sessionName: `Session-${i + 1}`,
          index: i + 1,
        };

        sessions.push(sessionObject);
      }
      // Insert session objects into the database
      await this.sessionRepo
        .createQueryBuilder('session')
        .insert()
        .values(sessions)
        .execute();
    } catch (error) {
      // Handle any errors that may occur during session creation
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  // async removeSession(id: string) {
  //   const sessionDetails = await this.sessionRepo.findOne({ where: { id } });
  //   if (!sessionDetails)
  //     throw new HttpException(HttpStatus.BAD_REQUEST, 'Session not found');
  //   await this.sessionRepo.softDelete(id);
  // }
  async removeSession(id: string) {
    const sessionDetails = await this.sessionRepo.findOne({ where: { id } });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Session not found');
    await this.sessionRepo.update(id, { isCancelled: true });
  }

  async updateSession(id: string, paylaod: UpdateSessionDto) {
    const sessionDetails = await this.sessionRepo.findOne({ where: { id } });
    if (!sessionDetails)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Session not found');
    sessionDetails.isPublished = paylaod.isPublished;
    return await this.sessionRepo.save(sessionDetails);
  }
}
