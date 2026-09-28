import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Raw, Repository } from 'typeorm';
import { BlogType, enrollmentType } from '@utils/enum';
import { Student } from '@students/entities/student.entity';
import { Course } from '@courses/entities/course.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import * as moment from 'moment';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Blog } from '@blogs/entities/blog.entity';
import { MockTest } from 'mockTest/entities/mock-test.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { AnalyticsService } from 'analytics/analytics.service';
import { getMomentNow } from '@utils/helpers/moment.date.helper';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Webinar) private webinarRepo: Repository<Webinar>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(MockTest) private mockTestRepo: Repository<MockTest>,
    @InjectRepository(Enrollment) private enrollRepo: Repository<Enrollment>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async dashboardAnalytics() {
    const studentCountPromise = this.enrollRepo.count();

    const coursesCountPromise = this.courseRepo.count();

    const trainersCountPromise = this.trainerRepo.count();

    const expiredBatchesCountPromise = this.batchRepo.count({
      where: { endDate: LessThan(moment().toDate()) },
    });

    const ongoingBatchesCountPromise = this.batchRepo.count({
      where: {
        startDate: LessThan(moment().toDate()),
        endDate: MoreThan(moment().toDate()),
      },
    });

    const upcomingBatchesCountPromise = this.batchRepo.count({
      where: { startDate: MoreThan(moment().toDate()) },
    });

    const todayEnrollCountPromise = this.enrollRepo
      .createQueryBuilder('qb')
      .where('qb.createdDate BETWEEN :startDate AND :endDate', {
        startDate: moment().startOf('day').toDate(),
        endDate: moment().endOf('day').toDate(),
      })
      .getCount();

    const registrationCountPromise = this.studentRepo
      .createQueryBuilder('qb')
      .innerJoinAndSelect('qb.auth', 'qba')
      .where('qba.isActive = :val1', { val1: true })
      .andWhere('qb.createdDate > :val2', {
        val2: moment().startOf('day').toDate(),
      })
      .andWhere('qb.createdDate < :val3', {
        val3: moment().endOf('day').toDate(),
      })
      .getCount();

    const todayBatches = await this.batchRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.course', 'course')
      .andWhere(`:val2 = ANY(qb.weekDays)`, { val2: moment().day() })
      .andWhere('qb.startDate <=:val4', {
        val4: new Date(moment().endOf('day').toString()),
      })
      .andWhere('qb.endDate >= :val3', {
        val3: new Date(moment().endOf('day').toString()),
      })
      .getMany();

    const todayWebinars: any = await this.webinarRepo
      .createQueryBuilder('qb')
      .andWhere('qb.startDate >= :val2', {
        val2: moment().startOf('day').toDate(),
      })
      .andWhere('qb.endDate <= :val3', {
        val3: moment().endOf('day').toDate(),
      })
      .getMany();

    const [
      studentCount,
      coursesCount,
      trainersCount,
      expiredBatchesCount,
      ongoingBatchesCount,
      upcomingBatchesCount,
      todayEnrollCount,
      registrationCount,
      //visitorsCount,
    ] = await Promise.all([
      studentCountPromise,
      coursesCountPromise,
      trainersCountPromise,
      expiredBatchesCountPromise,
      ongoingBatchesCountPromise,
      upcomingBatchesCountPromise,
      todayEnrollCountPromise,
      registrationCountPromise,
      // this.analyticsService.getViewerCount(),
    ]);

    const eventAll = todayBatches
      .concat(todayWebinars)
      .sort((a: any, b: any) => a.startTime - b.startTime);

    return {
      enrollmentStudents: studentCount,
      activeCourses: coursesCount,
      trainers: trainersCount,
      batches: {
        expired: expiredBatchesCount,
        ongoing: ongoingBatchesCount,
        upcoming: upcomingBatchesCount,
      },
      todayStats: {
        enrolled: todayEnrollCount,
        registration: registrationCount,
        visitors: 0,
      },
      events: {
        e: eventAll,
        webinars: todayWebinars.length,
        batches: todayBatches.length,
      },
    };
  }

  async globalSearchWeb(query: any) {
    const resp = {
      courses: {
        count: 0,
        data: [],
      },
      blogs: {
        count: 0,
        data: [],
      },
      interviewQuestions: {
        count: 0,
        data: [],
      },
      tutorials: {
        count: 0,
        data: [],
      },
      mockTest: {
        count: 0,
        data: [],
      },
      webinar: {
        count: 0,
        data: [],
      },
    };

    const [course, courseCount] = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.trainingPlans', 'tp')
      .leftJoinAndSelect('course.currilculum', 'curriculum')
      .leftJoinAndSelect('course.courseCategory', 'category')
      .where('course.courseName ILIKE :name', { name: `%${query.key}%` })
      .orWhere('category.name ILIKE :name', { name: `%${query.key}%` })
      .orWhere('course.courseDesc ILIKE :name', { name: `%${query.key}%` })
      .leftJoinAndMapMany(
        'course.batch',
        BatchEntity,
        'batch',
        'batch.startDate > :currentDate AND batch.courseId = course.id',
        { currentDate: getMomentNow() },
      )
      .getManyAndCount();

    resp.courses.data = course;
    resp.courses.count = courseCount;

    const [d2, c2] = await this.blogRepo.findAndCount({
      relations: { blogCategory: true },
      where: [
        {
          blogTitle: Raw(
            (blogTitle) =>
              `LOWER(${blogTitle}) Like '%${query.key.toLowerCase()}%'`,
          ),
          blogType: BlogType.Article,
        },
      ],
    });

    resp.blogs.data = d2;
    resp.blogs.count = c2;

    const [d3, c3] = await this.blogRepo.findAndCount({
      relations: { blogCategory: true },
      where: [
        {
          blogTitle: Raw(
            (blogTitle) =>
              `LOWER(${blogTitle}) Like '%${query.key.toLowerCase()}%'`,
          ),
          blogType: BlogType.Interview,
        },
      ],
    });

    resp.interviewQuestions.data = d3;
    resp.interviewQuestions.count = c3;

    const [d4, c4] = await this.blogRepo.findAndCount({
      relations: { blogCategory: true },
      where: [
        {
          blogTitle: Raw(
            (blogTitle) =>
              `LOWER(${blogTitle}) Like '%${query.key.toLowerCase()}%'`,
          ),
          blogType: BlogType.Tutorial,
        },
      ],
    });

    resp.tutorials.count = c4;
    resp.tutorials.data = d4;

    // const [d5, c5] = await this.mockTestRepo.findAndCount({
    //   where: [
    //     {
    //       testName: Raw(
    //         (testName) =>
    //           `LOWER(${testName}) Like '%${query.key.toLowerCase()}%'`,
    //       ),
    //     },
    //     {
    //       description: Raw(
    //         (testName) =>
    //           `LOWER(${testName}) Like '%${query.key.toLowerCase()}%'`,
    //       ),
    //     },
    //     {
    //       mockTestCategory: {
    //         name: Raw(
    //           (name) => `LOWER(${name}) Like '%${query.key.toLowerCase()}%'`,
    //         ),
    //       },
    //     },
    //   ],
    // });

    resp.mockTest.count = 0;
    resp.mockTest.data = null;

    const [d6, c6] = await this.webinarRepo.findAndCount({
      where: [
        {
          title: Raw(
            (title) => `LOWER(${title}) Like '%${query.key.toLowerCase()}%'`,
          ),
        },
        {
          description: Raw(
            (description) =>
              `LOWER(${description}) Like '%${query.key.toLowerCase()}%'`,
          ),
        },
        {
          category: {
            name: Raw(
              (name) => `LOWER(${name}) Like '%${query.key.toLowerCase()}%'`,
            ),
          },
        },
      ],
      relations: { trainer: { auth: true }, category: true },
    });
    resp.webinar.count = c6;
    resp.webinar.data = d6;

    return resp;
  }
}
