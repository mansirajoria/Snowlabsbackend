import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from '@courses/dto/create-course.dto';
import { UpdateCourseDto } from '@courses/dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '@courses/entities/course.entity';
import {
  Brackets,
  ILike,
  LessThan,
  MoreThan,
  Not,
  Raw,
  Repository,
} from 'typeorm';
import { Student } from '@students/entities/student.entity';
import {
  BatchTypeEnum,
  ClassRoomType,
  StudentType,
  enrollmentType,
} from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';
import {
  CoursesQuery,
  CourseCategorySearchAdmin,
} from '@courses/dto/query-course.dto';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { CreateCourseCategoryDto } from '@courses/dto/create-course-category.dto';
import { Currilculum } from './entities/curriculum.entity';
import { FAQ } from '@faq/entities/faq.entity';
import { BatchEntity } from 'batch/entities/batch.entity';
import { CourseCategoryQuery } from './dto/query-category.dto';
import { Trainer } from '@trainer/entities/trainer.entity';
import { UpdateCourseCategoryDto } from '@courses/dto/update-category.dto';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import * as moment from 'moment';
import { Blog } from '@blogs/entities/blog.entity';
import { BlogCategory } from '@blogs/entities/blog-category.entity';
import { BatchService } from '@batch/batch.service';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { v4 as uuidv4 } from 'uuid';
import { SlugDto } from './interfaces/course.interface';
import { slugConversation } from '@utils/slugName';
import { FilterCategoryCourse } from './dto/filter-category-course.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UploadsService } from 'uploads/uploads.service';
import { IndustryTrends } from './entities/industry-trends.entity';
import { CategoryStats } from './entities/category-stats.entity';
import { getMomentNow } from '@utils/helpers/moment.date.helper';
import { SequentialIdGenerator } from '@utils/sequence-generator/id-generator.service';
import { Certificate } from './entities/certificate.entity';
import { GetCertificateDTO } from './dto/get-certificate.dto';
import { CredentialEntity } from 'credential/entities/credential.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hb = require('handlebars');

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(CourseCategory)
    private courseCategoryRepo: Repository<CourseCategory>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(BlogCategory)
    private blogCategoryRepo: Repository<BlogCategory>,
    @InjectRepository(Currilculum)
    private curriculumRepo: Repository<Currilculum>,
    @InjectRepository(FAQ) private faqRepo: Repository<FAQ>,
    @InjectRepository(TrainingPlan)
    private trainingPlansRepo: Repository<TrainingPlan>,
    @InjectRepository(IndustryTrends)
    private industryRepo: Repository<IndustryTrends>,
    @InjectRepository(CategoryStats)
    private statsRepo: Repository<CategoryStats>,
    private readonly sequenceService: SequentialIdGenerator,
    @Inject(BatchService)
    private readonly batchService: BatchService,
    @InjectRepository(Certificate)
    private readonly certificateRepo: Repository<Certificate>,
    private readonly uploadService: UploadsService,
    @InjectRepository(CredentialEntity)
    private readonly credentialRepo: Repository<CredentialEntity>,
  ) {}

  /*
   * **************** Course Category CRUD ******************
   */

  /**
   *
   * Creates and return a new course category
   *
   * @returns The newly created course category
   *
   */
  async createCourseCategory(payload: CreateCourseCategoryDto) {
    const category: CourseCategory = new CourseCategory();

    category.name = payload.name;
    category.slugName = slugConversation(payload.name);
    category.description = payload.description;
    category.about = payload.about;
    category.preRequisites = payload.preRequisites;
    category.whoCanTake = payload.whoCanTake;
    category.aboutImage = payload.AboutImage;
    category.averageRating = payload.averageRating;
    const industryPromise = payload.arrayForChart.map((item, i) => {
      const trend = this.industryRepo.create({
        year: item.year,
        percentage: item.percentage,
        index: i,
      });
      return this.industryRepo.save(trend);
    });
    category.trends = await Promise.all(industryPromise);
    const statsPromise = payload.SideData.map((item, i) => {
      const stat = this.statsRepo.create({
        stat: item.stat,
        index: i,
        statement: item.statement,
      });
      return this.statsRepo.save(stat);
    });
    category.stats = await Promise.all(statsPromise);

    const createcategory = this.courseCategoryRepo.create(category);
    const savedCategory = await this.courseCategoryRepo.save(createcategory);

    //  Creating new FAQ entries from payload
    await Promise.all(
      payload.faq.map(async (f) => {
        const faq: FAQ = new FAQ();

        faq.courseCategory = savedCategory;
        faq.question = f.question;
        faq.answer = f.answer;

        await this.faqRepo.save(faq);
      }),
    );

    return savedCategory;
  }

  /**
   *
   * Returns all the course categories
   * @returns An category for website
   *
   */

  // async findAllCategoryWithUpcomingBatch() {
  //   const categories = await this.courseCategoryRepo
  //     .createQueryBuilder('category')
  //     .leftJoinAndSelect('category.course', 'course')
  //     .leftJoinAndSelect('category.batch', 'batch')
  //     .leftJoinAndSelect('category.faqs', 'faq')
  //     .leftJoinAndSelect('category.trends', 'trends')
  //     .leftJoinAndSelect('category.stats', 'stats')
  //     .leftJoinAndSelect('course.trainingPlans', 'training')
  //     .leftJoinAndSelect('course.currilculum', 'curriculum')
  //     .where('batch.startDate > :current', { current: getMomentNow() })
  //     .andWhere('batch.filledSeats < batch.maxSize')
  //     .orderBy('category.lastModifiedDate', 'DESC')
  //     .getMany();

  // return await this.courseCategoryRepo.find({
  //   relations: {
  //     course: {
  //       trainingPlans: true,
  //       currilculum: true,
  //     },
  //     batch: true,
  //     faqs: true,
  //   },
  //   where: {
  //     batch: {
  //       startDate: MoreThan(currentDate),
  //     },
  //   },
  //   order: { lastModifiedDate: 'DESC' },
  // });

  //   return categories;
  // }
  async findAllCategoryWithUpcomingBatch() {
    const categories = await this.courseCategoryRepo
      .createQueryBuilder('category')
      .select(['category.slugName', 'category.name']) // Select only slugName and name
      .leftJoin('category.batch', 'batch')
      .where('batch.startDate > :current', { current: getMomentNow() })
      .andWhere('batch.filledSeats < batch.maxSize')
      .orderBy('category.lastModifiedDate', 'DESC')
      .getMany();

    return categories;
  }

  /**
   *
   * Returns course categories data as per the ID, also contains the related blog, total student
   * avg rating , total student, total trainer and search filter
   * @returns An category for website
   *
   */
  async findCategoryWebsite(slugDto: SlugDto) {
    const qb = this.courseCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id: slugDto.id })
      .orWhere('qb.slugName =:name', { name: slugDto.name })
      .leftJoinAndSelect('qb.course', 'course')
      .leftJoinAndSelect('qb.trends', 'trends')
      .leftJoinAndSelect('qb.stats', 'stats')
      // .innerJoinAndSelect('course.trainingPlans', 'tp')
      // .leftJoinAndSelect('course.currilculum', 'qbcc');
      .leftJoinAndSelect('qb.batch', 'qbb')
      // .leftJoinAndSelect('qbb.trainer', 'trainer')
      // .leftJoinAndSelect('qbb.course', 'qbbc')
      .leftJoinAndSelect('qb.faqs', 'qbf');

    const resp1 = await qb.getOne();

    if (!resp1)
      throw new HttpException(HttpStatus.NOT_FOUND, 'No Course category Found');

    // Blogs
    const fetchBlogCategory = await this.blogCategoryRepo.findOne({
      where: { name: ILike(resp1.name) },
    });

    let relatedBlogs: Blog[] = [];

    if (fetchBlogCategory) {
      relatedBlogs = await this.blogRepo.find({
        relations: { blogCategory: true },
        where: {
          blogCategory: { id: fetchBlogCategory.id },
        },
      });
    }

    // total student, total trainers, avg rating for this

    let totalStudents = 0;
    let totalTrainers = 0;
    const avgRating = 4.7;

    const arrangeData = async (cc: CourseCategory) => {
      // Updating the total stduents data

      const studentPromise = [];
      for (let i = 0; i < cc.batch.length; i++) {
        studentPromise.push(
          this.batchService.enrollStudentList({
            batchId: cc.batch[i].id,
          }),
        );
        (await Promise.all(studentPromise)).map(
          (item) => (totalStudents += item.total),
        );
      }

      // Updating the total trainers data
      const trainerCount = new Set();
      cc.batch.forEach((el) => trainerCount.add(el.trainer.id));

      totalTrainers = trainerCount.size;

      return {
        totalStudents,
        avgRating,
        totalTrainers,
      };
    };

    const titleData = await arrangeData(resp1);

    // find the batch list as upcoming as per category id provided

    let upcomingBatchResp: any = [];
    if (resp1.batch.length > 0) {
      const upcomingBatchQuery = qb
        .andWhere('qbb.startDate >= :currentDate', {
          currentDate: getMomentNow(),
        })
        .andWhere('qbb.isBatchFull = :val1', { val1: false })
        .andWhere('qbb.classRoomType = :val2', { val2: ClassRoomType.ONLINE });
      upcomingBatchResp = await upcomingBatchQuery.getOne();
    }

    return {
      courseCategory: resp1,
      relatedBlogs: relatedBlogs,
      totalStudents: titleData.totalStudents + 1000,
      totalTrainers: titleData.totalTrainers + 1000,
      avgRating: titleData.avgRating,
      upcomingBatch: upcomingBatchResp ? upcomingBatchResp.batch : [],
    };
  }

  async findCategoryWebsite2(slugDto: SlugDto) {
    const currentDate: Date = new Date(moment().toString());
    const courseCategory = await this.courseCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id: slugDto.id })
      .orWhere('qb.slugName =:name', { name: slugDto.name })
      .leftJoinAndSelect('qb.faqs', 'qbf')
      .leftJoinAndSelect('qb.trends', 'trends')
      .leftJoinAndSelect('qb.stats', 'stats')
      .orderBy('trends.index', 'ASC')
      .addOrderBy('stats.index', 'ASC')
      .getOne();

    if (!courseCategory)
      throw new HttpException(404, 'No Course category Found');

    // Course
    const coursePromise = this.courseRepository
      .createQueryBuilder('qb')
      .innerJoinAndMapOne(
        'qb.courseCategory',
        CourseCategory,
        'category',
        'category.id = qb.courseCategoryId',
      )
      .where('category.id = :cid', { cid: courseCategory.id })
      .leftJoinAndSelect('qb.trainingPlans', 'tp')
      .leftJoinAndSelect('qb.currilculum', 'currilculum')
      // .leftJoinAndSelect('qb.batch', 'batch')
      .leftJoinAndMapMany(
        'qb.batch',
        BatchEntity,
        'batch',
        'batch.startDate > :currentDate and batch.courseId = qb.id',
        { currentDate },
      )
      .getMany();

    // Batch
    const batchPromise = this.batchRepo
      .createQueryBuilder('qb')
      .innerJoinAndMapOne(
        'qb.courseCategory',
        CourseCategory,
        'category',
        'category.id = qb.courseCategoryId',
      )
      .where('category.id = :cid', { cid: courseCategory.id })
      .andWhere('qb.startDate > :startDate', { startDate: moment().toDate() })
      .andWhere('qb.filledSeats < qb.maxSize')
      .leftJoinAndSelect('qb.trainer', 'trainer')
      .leftJoinAndSelect('qb.course', 'course')
      .getMany();

    // Blogs
    const fetchBlogCategory = await this.blogCategoryRepo.findOne({
      where: { name: ILike(courseCategory.name) },
    });

    let relatedBlogsPromise: any = [];

    if (fetchBlogCategory) {
      relatedBlogsPromise = this.blogRepo
        .createQueryBuilder('qb')
        .innerJoinAndSelect('qb.blogCategory', 'category')
        .where('category.id = :id', { id: fetchBlogCategory.id })
        .getMany();
    }

    // Upcoming Batch

    const upcomingBatchPromise = this.batchRepo
      .createQueryBuilder('qb')
      .innerJoinAndSelect('qb.course', 'course')
      .innerJoinAndSelect('course.courseCategory', 'category')
      .where('category.id = :cid', { cid: courseCategory.id })
      .andWhere('qb.startDate >= :currentDate', {
        currentDate,
      })
      .andWhere('qb.filledSeats < qb.maxSize')
      .andWhere('qb.classRoomType = :val2', { val2: ClassRoomType.ONLINE })
      .andWhere('qb.studentType=:val4', { val4: StudentType.INDIVIDUAL })
      .orderBy('qb.startDate', 'ASC')
      .getMany();

    const [course, batch, relatedBlogs, upcomingBatch] = await Promise.all([
      coursePromise,
      batchPromise,
      relatedBlogsPromise,
      upcomingBatchPromise,
    ]);

    // total student, total trainers, avg rating for this

    const avgRating = 4.7;

    const arrangeData = async (batch: BatchEntity[]) => {
      let totalStudents = 0;
      let totalTrainers = 0;
      // Updating the total stduents data
      const studentPromise = [];
      for (let i = 0; i < batch.length; i++) {
        studentPromise.push(
          this.batchService.enrollStudentList({
            batchId: batch[i].id,
          }),
        );
      }

      (await Promise.all(studentPromise)).forEach(
        (item) => (totalStudents += item.total),
      );

      // Updating the total trainers data
      const trainerCount = new Set();
      batch.forEach((el) => trainerCount.add(el.trainer.id));

      totalTrainers = trainerCount.size;

      return {
        totalStudents,
        avgRating,
        totalTrainers,
      };
    };

    const titleData = await arrangeData(batch);

    courseCategory['course'] = course || [];
    courseCategory['batch'] = batch || [];
    courseCategory['relatedBlogs'] = relatedBlogs || [];

    // find the batch list as upcoming as per category id provided

    return {
      courseCategory,
      totalStudents: 1000 + titleData.totalStudents,
      totalTrainers: 100 + titleData.totalTrainers,
      avgRating,
      upcomingBatch,
    };
  }

  async findFilteredCourses(id: string, payload: FilterCategoryCourse) {
    const { level, mod } = payload;

    const courses = await this.courseCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id })
      .leftJoinAndSelect('qb.course', 'course')
      .leftJoinAndSelect('course.trainingPlans', 'tp')
      .leftJoinAndSelect('course.currilculum', 'qbcc')
      .andWhere(level ? 'course.courseLevel = :level' : '1=1', { level })
      .andWhere(mod ? 'tp.name = :mod' : '1=1', { mod })
      .andWhere('tp.publish = :val1', { val1: true })
      .getOne();

    if (!courses) return [];
    return courses;
  }

  /**
   *
   * Returns all the course categories saved in database
   *
   * @returns An array of course categories
   *
   */
  async findAllCourseCategory(query: CourseCategoryQuery) {
    const { name = '', web } = query;
    if (web === true) {
      const findCourseCategoryPromise = this.courseCategoryRepo
        .createQueryBuilder('courseCategory')
        .leftJoinAndSelect('courseCategory.course', 'course')
        .leftJoinAndSelect('courseCategory.batch', 'ccbatch')
        .leftJoinAndSelect('course.currilculum', 'curriculum')
        .leftJoinAndSelect('course.trainingPlans', 'trainingPlans')
        .leftJoinAndMapMany(
          'course.batch',
          BatchEntity,
          'batch',
          'batch.startDate > :current AND batch.courseId = course.id',
          { current: getMomentNow() },
        )
        .andWhere('courseCategory.name ILIKE :name', { name: `%${name}%` })
        .orderBy('batch.startDate', 'ASC')
        .getMany();
      // Stats Data
      const totalCategoryPromise = this.courseCategoryRepo.count();
      const activeBatchesPromise = this.batchRepo.count({
        where: {
          startDate: LessThan(moment().toDate()),
          endDate: MoreThan(moment().toDate()),
        },
      });
      const enrolledStudentPromise = this.enrollmentRepo.count();

      const [resp, totalCategory, activeBatches, enrolledStudent] =
        await Promise.all([
          findCourseCategoryPromise,
          totalCategoryPromise,
          activeBatchesPromise,
          enrolledStudentPromise,
        ]);
      return {
        count: resp.length,
        data: resp,
        stats: {
          totalCategory: totalCategory,
          activeBatches: activeBatches,
          EnrolledStudent: enrolledStudent,
        },
      };
    }
    const findCourseCategoryPromise = this.courseCategoryRepo
      .createQueryBuilder('courseCategory')
      .leftJoinAndSelect('courseCategory.course', 'course')
      .leftJoinAndSelect('courseCategory.batch', 'batch')
      .leftJoinAndSelect('course.currilculum', 'curriculum')
      .leftJoinAndSelect('course.trainingPlans', 'trainingPlans')
      .andWhere('courseCategory.name ILIKE :name', { name: `%${name}%` })
      .orderBy('courseCategory.lastModifiedDate', 'DESC')
      .getMany();
    // Stats Data
    const totalCategoryPromise = this.courseCategoryRepo.count();
    const activeBatchesPromise = this.batchRepo.count({
      where: {
        startDate: LessThan(moment().toDate()),
        endDate: MoreThan(moment().toDate()),
      },
    });
    const enrolledStudentPromise = this.enrollmentRepo.count();

    const [resp, totalCategory, activeBatches, enrolledStudent] =
      await Promise.all([
        findCourseCategoryPromise,
        totalCategoryPromise,
        activeBatchesPromise,
        enrolledStudentPromise,
      ]);
    return {
      count: resp.length,
      data: resp,
      stats: {
        totalCategory: totalCategory,
        activeBatches: activeBatches,
        EnrolledStudent: enrolledStudent,
      },
    };
  }

  async findCourseCategoryName(query: CourseCategoryQuery) {
    const { name = '', web } = query;
    const findCourseCategoryPromise = this.courseCategoryRepo
      .createQueryBuilder('courseCategory')
      .leftJoinAndSelect('courseCategory.course', 'course')
      .leftJoin('courseCategory.batch', 'ccbatch')
      .leftJoinAndMapMany(
        'course.batch',
        BatchEntity,
        'batch',
        'batch.startDate > :current AND batch.courseId = course.id',
        { current: getMomentNow() },
      )
      .select([
        'courseCategory.id',
        'courseCategory.name',
        'course.courseName',
        'course.slugName',
      ])
      .andWhere('courseCategory.name ILIKE :name', { name: `%${name}%` })
      .orderBy('batch.startDate', 'ASC')
      .getMany();
    const [resp] = await Promise.all([findCourseCategoryPromise]);
    return {
      count: Object.values(resp).length,
      data: resp,
    };
  }

  /**
   *
   * Get the details of a single course category by id, and also contains the related blogs,
   * avg rating ,total student, total trainer
   *
   * @returns A single course category
   *
   */
  async findCourseCategory(slugDto: SlugDto, query: any) {
    const name: string = query.name;
    const level: string = query.level;
    const mod: string = query.mod;

    const currentDate: Date = new Date(moment().toString());

    const qb = this.courseCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id: slugDto.id })
      .orWhere('qb.slugName =:name', { name: slugDto.name })
      .leftJoinAndSelect('qb.course', 'qbc')
      .leftJoinAndSelect('qbc.batch', 'qbcb')
      .leftJoinAndSelect('qbc.trainingPlans', 'qbct')
      .leftJoinAndSelect('qbc.currilculum', 'qbcc')
      .leftJoinAndSelect('qb.batch', 'qbb')
      .leftJoinAndSelect('qb.trends', 'trends')
      .leftJoinAndSelect('qb.stats', 'stats')
      .leftJoinAndSelect('qb.faqs', 'qbf');

    const checkCourseCatgory = await qb.getOne();
    if (!checkCourseCatgory)
      throw new HttpException(HttpStatus.NOT_FOUND, 'No Course category Found');

    if (checkCourseCatgory.batch.length == 0) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'No batches exists');
    }

    if (name && checkCourseCatgory.course.length == 0) {
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        'No such course found under this Category',
      );
    }
    if (name) {
      qb.andWhere('qbc.courseName ilike :val', {
        val: `%${name.toLowerCase()}%`,
      });
    }
    if (level) {
      qb.andWhere('qbc.courseLevel = :level', { level });
    }
    if (mod) {
      qb.andWhere('qbct.name = :mod', { mod });
    }

    const resp1 = await qb.getOne();

    if (!resp1 && name)
      throw new HttpException(HttpStatus.NOT_FOUND, 'No such course found');

    const fetchBlogCategory = await this.blogCategoryRepo.findOne({
      where: { name: ILike(resp1.name) },
    });

    let relatedBlogs: Blog[] = [];

    if (fetchBlogCategory) {
      relatedBlogs = await this.blogRepo.find({
        relations: { blogCategory: true },
        where: {
          blogCategory: { id: fetchBlogCategory.id },
        },
      });
    }

    resp1['relatedBlogs'] = relatedBlogs;

    // total student, total trainers, avg rating for this

    let totalStudents = 0;
    let totalTrainers = 0;
    const avgRating = 4.7;

    const arrangeData = async (cc: CourseCategory) => {
      // Updating the total stduents data

      const studentPromise = [];
      for (let i = 0; i < cc.batch.length; i++) {
        studentPromise.push(
          this.batchService.enrollStudentList({
            batchId: cc.batch[i].id,
          }),
        );

        (await Promise.all(studentPromise)).map(
          (item) => (totalStudents += item.total),
        );
      }

      // Updating the total trainers data
      cc.course.map((el: Course) => (totalTrainers += el.batch.length));

      return {
        totalStudents,
        avgRating,
        totalTrainers,
      };
    };

    const titleData = await arrangeData(resp1);

    resp1['totalStudents'] = titleData.totalStudents + 1000;
    resp1['totalTrainers'] = titleData.totalTrainers + 1000;
    resp1['avgRating'] = titleData.avgRating;

    // find the batch list as upcoming as per category id provided

    const upcomingBatchQuery = qb.andWhere('qbb.startDate >= :currentDate', {
      currentDate,
    });

    const upcomingBatchResp = await upcomingBatchQuery.getOne();
    resp1['upcomingBatch'] = upcomingBatchResp.batch;

    return resp1;
  }

  async findCourseCategoryAdmin(id: string, query: CourseCategorySearchAdmin) {
    const categoryPromise = this.courseCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id })
      .leftJoinAndSelect('qb.faqs', 'faqs')
      .leftJoinAndSelect('qb.trends', 'trends')
      .leftJoinAndSelect('qb.stats', 'stats')
      .getOne();

    const coursesPromise = this.courseRepository
      .createQueryBuilder('qb')
      .leftJoin('qb.courseCategory', 'category')
      .where('category.id = :cid', { cid: id })
      .andWhere(query.name ? 'qb.courseName ILIKE :name' : '1=1', {
        name: `%${query.name}%`,
      })
      .leftJoinAndSelect('qb.batch', 'batch')
      // .andWhere('batch.startDate <= :dt', { dt: new Date() })  -> making them comments, to track the
      // .andWhere('batch.endDate > :dt', { dt: new Date() })     -> expired courses
      .getMany();

    const totalCoursesPromise = this.courseRepository.count({
      where: { courseCategory: { id } },
    });

    const totalActiveBatchesPromise = this.batchRepo.count({
      where: {
        course: { courseCategory: { id } },
        startDate: LessThan(new Date()),
        endDate: MoreThan(new Date()),
      },
    });

    const enrolledStudentPromise = this.enrollmentRepo.count({
      where: { batch: { course: { courseCategory: { id } } } },
    });

    const [
      category,
      courses,
      totalCourses,
      totalActiveBatches,
      enrolledStudent,
    ] = await Promise.all([
      categoryPromise,
      coursesPromise,
      totalCoursesPromise,
      totalActiveBatchesPromise,
      enrolledStudentPromise,
    ]);

    return {
      category,
      courses,
      totalCourses,
      totalActiveBatches,
      enrolledStudent,
    };
  }

  /**
   *
   * Updates a course category based on id provided
   *
   * @returns The updated blog
   *
   */
  async updateCourseCategory(id: string, payload: UpdateCourseCategoryDto) {
    const findCourseCategory = await this.courseCategoryRepo.findOne({
      where: { id },
      relations: ['faqs', 'trends', 'stats'],
    });
    if (!findCourseCategory)
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        'CourseCategory  not found',
      );

    findCourseCategory.name = payload.name;
    findCourseCategory.description = payload.description;
    findCourseCategory.about = payload.about;
    findCourseCategory.preRequisites = payload.preRequisites;
    findCourseCategory.whoCanTake = payload.whoCanTake;
    findCourseCategory.slugName = payload.slugName;
    findCourseCategory.aboutImage = payload.AboutImage;
    findCourseCategory.averageRating = payload.averageRating;

    if (payload.arrayForChart) {
      await Promise.all(
        findCourseCategory.trends.map((item) =>
          this.industryRepo.delete({ id: item.id }),
        ),
      );
      const industryPromise = payload.arrayForChart.map((item, i) => {
        const trend = this.industryRepo.create({
          year: item.year,
          percentage: item.percentage,
          index: i,
        });
        return this.industryRepo.save(trend);
      });
      findCourseCategory.trends = await Promise.all(industryPromise);
    }
    if (payload.SideData) {
      await Promise.all(
        findCourseCategory.stats.map((item) =>
          this.statsRepo.delete({ id: item.id }),
        ),
      );
      const statsPromise = payload.SideData.map((item, i) => {
        const trend = this.statsRepo.create({
          stat: item.stat,
          statement: item.statement,
          index: i,
        });
        return this.statsRepo.save(trend);
      });
      findCourseCategory.stats = await Promise.all(statsPromise);
    }

    const resp = await this.courseCategoryRepo.save(findCourseCategory);

    if (payload?.faq)
      findCourseCategory.faqs.forEach(async (el: any) => {
        await this.faqRepo.delete(el.id);
      });

    if (payload?.faq)
      await Promise.all(
        payload?.faq.map(async (f: any) => {
          const faq = new FAQ();

          faq.courseCategory = findCourseCategory;
          faq.question = f.question;
          faq.answer = f.answer;

          await this.faqRepo.save(faq);
        }),
      );
    return resp;
  }

  /**
   *
   * Soft deletes a Catgeory, but currently not allowed
   *
   */

  async removeCourseCategory(id: string) {
    const courseCategory = await this.courseCategoryRepo.findOne({
      where: { id },
    });
    if (!courseCategory)
      throw new HttpException(HttpStatus.NOT_FOUND, 'CourseCategory not found');
    // await this.courseCategoryRepo.softDelete({ id });
    return 'Permission Denied';
  }

  /*
   * ****************** Course CRUD **************************
   */

  /**
   *
   * Creates and return a new Course
   *
   * @returns The newly created Course
   *
   */
  async create(req: CreateCourseDto) {
    const category: CourseCategory = await this.courseCategoryRepo.findOne({
      where: { id: req.courseCategory },
    });

    //  Throw exception if category doesn't exist
    if (!category) throw new HttpException(404, `Course Category not found`);

    const course: Course = new Course();

    course.courseCategory = category;

    course.courseName = req.courseName;
    course.courseDesc = req.courseDesc;
    course.duration = req.duration;
    course.skillSet = req.skillSet;
    course.courseLevel = req.courseLevel;
    course.courseThumbnail = req.courseThumbnail;
    course.courseMedia = req.courseMedia;
    course.courseSyllabus = req.courseSyllabus;
    course.publish = req.publish;

    course.certificationName = req.certificationName;
    course.certificationImg = req.certificationImg;
    course.certificationDesc = req.certificationDesc;

    course.about = req.about;
    course.courseFor = req.courseFor; // Who can take this course
    course.suitableFor = req.suitableFor; // Suitable for
    course.skillCovered = req.skillCovered; // skill covered
    course.metaTags = req.metaTags;
    course.metaTitle = req.metaTitle;
    course.metaDescription = req.metaDescription;
    course.slugName = req.slugName;

    const createCourse = this.courseRepository.create(course);
    const savedCourse = await this.courseRepository.save(createCourse);

    await Promise.all(
      req.currilculum.map(async (cu, index) => {
        const curriculum = new Currilculum();

        curriculum.moduleNo = index + 1;
        curriculum.course = savedCourse;
        curriculum.heading = cu.heading;
        curriculum.content = cu.content;

        await this.curriculumRepo.save(curriculum);
      }),
    );

    await Promise.all(
      req.faq.map(async (f, index) => {
        const faq = new FAQ();

        faq.questionNo = index + 1;
        faq.course = savedCourse;
        faq.question = f.question;
        faq.answer = f.answer;

        await this.faqRepo.save(faq);
      }),
    );

    await Promise.all(
      req.trainingPlans.map(async (t) => {
        const tp = new TrainingPlan();

        tp.course = savedCourse;
        tp.name = t.name;
        tp.description = t.description;
        tp.inrAmount = t.inrAmount;
        tp.dollorAmount = t.dollorAmount;
        tp.features = t.features;
        tp.publish = t.publish;

        await this.trainingPlansRepo.save(tp);
      }),
    );
    return savedCourse;
  }

  /**
   *
   * Returns all the course saved in database, with course stats for admin panel
   *
   * @returns An array of course
   *
   */

  async findAll(query: CoursesQuery) {
    const limit = query.pageLength < 1 ? 1 : query.pageLength || 10;
    const page = query.pageNo < 1 ? 1 : query.pageNo || 1;

    const { category, courseName = '' } = query;
    const currentDate: Date = new Date(moment().toString());

    const qb = this.courseRepository
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.courseCategory', 'qbcc')
      .leftJoinAndSelect('qb.batch', 'qbb')
      // .leftJoinAndSelect('qb.currilculum', 'qbc')
      // .leftJoinAndSelect('qb.faqs', 'qbf')
      // .leftJoinAndSelect('qb.trainingPlans', 'qbt')
      .where(courseName ? 'qb.courseName ILike :v1' : '1=1', {
        v1: `%${courseName}%`,
      })
      .andWhere(category ? 'qbcc.name ILike :v2' : '1=1', {
        v2: category || null,
      })
      // .addSelect('CASE when qbb.startDate <= NOW() AND qbb.endDate >= NOW() then qbb end as filterBatch')
      // .select('qb.courseName')
      // .select('qb.slugName')
      // .addSelect('COUNT(case when qbb.startDate <= NOW() and qbb.endDate >= NOW() then qbb end)')
      .orderBy('qb.lastModifiedDate', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    function filterCourse(arr: any) {
      return arr.map((el: any) => {
        if (el.batch.length > 0) {
          const newBatch = [];

          el.batch.forEach((el: BatchEntity) => {
            if (el.startDate <= currentDate && el.endDate >= currentDate)
              newBatch.push(el);
          });
          el.batch = newBatch;
        }
      });
    }

    const [resp, rcount] = await qb.getManyAndCount();

    // Course Stats
    const totalCoursesPromise = this.courseRepository.count();

    const activeBatchesPromise = this.batchRepo.count({
      where: {
        startDate: LessThan(moment().toDate()),
        endDate: MoreThan(moment().toDate()),
      },
    });
    const enrolledStudentPromise = this.enrollmentRepo.count();

    const [totalCourses, activeBatches, enrolledStudent] = await Promise.all([
      totalCoursesPromise,
      activeBatchesPromise,
      enrolledStudentPromise,
    ]);

    filterCourse(resp); // to update the course batch list

    return {
      stats: {
        totalCourses: totalCourses,
        activeBatches: activeBatches,
        enrolledStudent: enrolledStudent,
      },
      count: rcount,
      data: resp,
    };
  }

  /**
   *
   * Returns all the course saved in database, with a logic of inDemand course
   *
   * @returns An array of course, constain ongoing and upcoming batch logic
   *
   */

  async inDemandCourse(queryParam: any) {
    let limit = 6;

    if (queryParam.cid == 'all') {
      // Fetch upcoming courses first
      const upcomingresp = await this.courseRepository
        .createQueryBuilder('course')
        .select([
          'course.id',
          'course.courseName',
          'course.slugName',
          'course.duration',
          'trainingPlans.publish',
          'trainingPlans.name',
          'batch.startDate',
          'course.lastModifiedDate',
          'courseCategory.name',
        ])
        .leftJoin('course.courseCategory', 'courseCategory')
        .leftJoin('course.batch', 'batch')
        .leftJoin('course.currilculum', 'currilculum')
        .leftJoin('course.trainingPlans', 'trainingPlans')
        .where('batch.startDate >= :startDate', {
          startDate: moment().utc().toDate(),
        })
        .andWhere('batch.studentType = :studentType', {
          studentType: StudentType.INDIVIDUAL,
        })
        .andWhere('trainingPlans.name = :planName', { planName: 'live' })
        .andWhere('batch.filledSeats < batch.maxSize') // Ensure batch is not full
        .take(6)
        .getMany();

      limit -= upcomingresp.length;

      // Fetch ongoing courses with batches
      const ongoingresp = await this.courseRepository
        .createQueryBuilder('course')
        .select([
          'course.id',
          'course.courseName',
          'course.slugName',
          'course.duration',
          'trainingPlans.publish',
          'trainingPlans.name',
          'batch.startDate',
          'course.lastModifiedDate',
          'courseCategory.name',
        ])
        .leftJoin('course.courseCategory', 'courseCategory')
        .leftJoin('course.batch', 'batch')
        .leftJoin('course.currilculum', 'currilculum')
        .leftJoin('course.trainingPlans', 'trainingPlans')
        .where('batch.id IS NULL')
        //.orWhere('batch.endDate <=:date', { date: new Date() })
        .orderBy('course.lastModifiedDate', 'DESC')
        .take(limit)
        .getMany();
      return {
        upcoming: {
          count: upcomingresp.length,
          data: upcomingresp,
        },
        ongoing: {
          count: ongoingresp.length,
          data: ongoingresp,
        },
      };
    } else {
      // Fetch upcoming courses for a specific category (filtered by course category)
      const upcomingresp = await this.courseRepository
        .createQueryBuilder('course')
        .select([
          'course.id',
          'course.courseName',
          'course.slugName',
          'course.duration',
          'trainingPlans.publish',
          'trainingPlans.name',
          'batch.startDate',
          'course.lastModifiedDate',
          'courseCategory.name',
        ])
        .leftJoin('course.courseCategory', 'courseCategory')
        .leftJoin('course.batch', 'batch')
        .leftJoin('course.currilculum', 'currilculum')
        .leftJoin('course.trainingPlans', 'trainingPlans')
        .where(
          queryParam.cid !== undefined && queryParam.cid !== null
            ? 'courseCategory.id = :cid'
            : '',
          queryParam.cid !== undefined && queryParam.cid !== null
            ? { cid: queryParam.cid }
            : {},
        )
        .andWhere('batch.startDate >= :startDate', {
          startDate: moment().utc().startOf('day').toDate(),
        })
        .andWhere('batch.studentType = :studentType', {
          studentType: StudentType.INDIVIDUAL,
        })
        .andWhere('trainingPlans.name = :planName', { planName: 'live' })
        .andWhere('batch.filledSeats < batch.maxSize') // Ensure batch is not full
        .take(6)
        .getMany();

      limit -= upcomingresp.length;

      // Fetch ongoing courses for a specific category (filtered by course category ID)
      const ongoingresp = await this.courseRepository
        .createQueryBuilder('course')
        .select([
          'course.id',
          'course.courseName',
          'course.slugName',
          'course.duration',
          'trainingPlans.publish',
          'trainingPlans.name',
          'batch.startDate',
          'course.lastModifiedDate',
          'courseCategory.name',
        ])
        .leftJoin('course.courseCategory', 'courseCategory')
        .leftJoin('course.batch', 'batch')
        .leftJoin('course.currilculum', 'currilculum')
        .leftJoin('course.trainingPlans', 'trainingPlans')
        .where('courseCategory.id = :cid', { cid: queryParam.cid })
        .andWhere(
          new Brackets((qb) => {
            qb.where('batch.id IS NULL').orWhere('batch.endDate <= :date', {
              date: moment().utc().toDate(),
            });
          }),
        )
        //.orderBy('course.lastModifiedDate', 'DESC')
        .take(limit)
        .getMany();

      return {
        upcoming: {
          count: upcomingresp.length,
          data: upcomingresp,
        },
        ongoing: {
          count: ongoingresp.length,
          data: ongoingresp,
        },
      };
    }
  }

  /**
   *
   * Get the details of a single course by id
   *
   * @returns A single course
   *
   */
  async findOne(slugDto: SlugDto) {
    const filterObject = {};
    slugDto.id
      ? (filterObject['id'] = slugDto.id)
      : (filterObject['slugName'] = slugDto.name);

    const course = await this.courseRepository
      .createQueryBuilder('course')
      .where(slugDto.name ? 'course.slugName = :name' : 'course.id = :name', {
        name: slugDto.name || slugDto.id,
      })
      .leftJoinAndSelect('course.courseCategory', 'cc')
      .leftJoinAndSelect('course.currilculum', 'curriculum')
      .leftJoinAndSelect('course.faqs', 'faqs')
      .leftJoinAndSelect('course.trainingPlans', 'tp')
      .leftJoinAndMapMany(
        'course.batch',
        BatchEntity,
        'batch',
        '( batch.batchType = :SelfBatch AND batch.deletedAt is null AND batch.courseId = course.id AND batch.isWeb =true ) or (batch.startDate > :currentDate AND batch.courseId = course.id AND batch.batchType = :LiveBatch AND batch.deletedAt is null AND batch.isWeb =true )',
        {
          currentDate: getMomentNow(),
          LiveBatch: BatchTypeEnum.LIVE,
          SelfBatch: BatchTypeEnum.SELF,
        },
      )
      //.orderBy('curriculum.moduleNo', 'ASC')
      //.addOrderBy('batch.startDate', 'ASC')
      .getOne();
    if (!course)
      throw new HttpException(HttpStatus.NOT_FOUND, `Course not found`);

    const relatedCourse = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.currilculum', 'curriculum')
      .leftJoinAndSelect('course.trainingPlans', 'tp')
      .leftJoinAndSelect('course.courseCategory', 'category')
      .leftJoinAndMapMany(
        'course.batch',
        BatchEntity,
        'batch',
        '(batch.startDate > :currentDate AND batch.courseId = course.id AND batch.batchType = :LiveBatch AND batch.deletedAt is null  AND batch.isWeb =true)',
        {
          currentDate: getMomentNow(),
          LiveBatch: BatchTypeEnum.LIVE,
        },
      )
      .where('category.id = :category', { category: course.courseCategory.id })
      .andWhere('course.id <> :courseId', { courseId: course.id })
      .getMany();

    const fetchBlogCategory = await this.blogCategoryRepo.findOne({
      where: { name: ILike(course.courseCategory.name) },
    });

    let relatedBlogs: Blog[] = [];
    if (fetchBlogCategory) {
      relatedBlogs = await this.blogRepo.find({
        relations: { blogCategory: true },
        where: {
          blogCategory: { id: fetchBlogCategory.id },
        },
      });
    }

    course['relatedBlogs'] = relatedBlogs;
    course['relatedCourse'] = relatedCourse;

    //find enrolled stduents
    let sum = 0;
    for (let i = 0; i < course.batch.length; i++) {
      const findEnrolledStudent = await this.enrollmentRepo
        .createQueryBuilder('qb')
        .leftJoinAndSelect('qb.batch', 'batch')
        .where('batch.id = :val', { val: course.batch[i].id })
        .getCount();
      sum = sum + findEnrolledStudent;
    }
    course['enrolledStudents'] = sum + 1000;

    return course;
  }

  // async findOneCourseAdmin(id: string) {}

  /**
   *
   * Updates a course based on id provided
   *
   * @returns The updated course
   *
   */
  async update(id: string, req: UpdateCourseDto) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'courseCategory',
        'batch',
        'currilculum',
        'faqs',
        'trainingPlans',
      ],
    });

    if (!course)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Course not found');

    const findCategory = await this.courseCategoryRepo.findOne({
      where: { id: req.courseCategory },
    });

    course.courseCategory = findCategory;

    course.courseName = req.courseName;
    course.courseDesc = req.courseDesc;
    course.duration = req.duration;
    course.skillSet = req.skillSet;
    course.courseLevel = req.courseLevel;
    course.courseThumbnail = req.courseThumbnail;
    course.courseMedia = req.courseMedia;
    course.courseSyllabus = req.courseSyllabus;
    course.publish = req.publish;
    course.certificationName = req.certificationName;
    course.certificationImg = req.certificationImg;
    course.certificationDesc = req.certificationDesc;
    course.metaDescription = req.metaDescription;
    course.metaTitle = req.metaTitle;
    course.metaTags = req.metaTags;
    course.slugName = req.slugName;

    course.about = req.about;
    course.courseFor = req.courseFor; // Who can take this course
    course.suitableFor = req.suitableFor; // Suitable for
    course.skillCovered = req.skillCovered; // skill covered

    const savedCourse = await this.courseRepository.save(course);

    // Need to delete all the existing curriculum & faqs

    course.currilculum.forEach(async (el) => {
      await this.curriculumRepo.delete(el.id);
    });

    course.faqs.forEach(async (el) => {
      await this.faqRepo.delete(el.id);
    });

    // course.trainingPlans.forEach(async (el) => {
    //   await this.trainingPlansRepo.delete(el.id);
    // });

    if (req.currilculum) {
      await Promise.all(
        req.currilculum.map(async (cu, index) => {
          const curriculum = new Currilculum();

          curriculum.moduleNo = index + 1;
          curriculum.course = savedCourse;
          curriculum.heading = cu.heading;
          curriculum.content = cu.content;

          await this.curriculumRepo.save(curriculum);
        }),
      );
    }

    if (req.faq) {
      await Promise.all(
        req.faq.map(async (f, index) => {
          const faq = new FAQ();

          faq.questionNo = index + 1;
          faq.course = savedCourse;
          faq.question = f.question;
          faq.answer = f.answer;

          await this.faqRepo.save(faq);
        }),
      );
    }

    if (req.trainingPlans) {
      await Promise.all(
        req.trainingPlans.map(async (t) => {
          const tp = t.id
            ? await this.trainingPlansRepo.findOne({ where: { id: t.id } })
            : new TrainingPlan();
          tp.course = savedCourse;
          tp.name = t.name;
          tp.description = t.description;
          tp.inrAmount = t.inrAmount;
          tp.dollorAmount = t.dollorAmount;
          tp.features = t.features;
          tp.publish = t.publish;
          await this.trainingPlansRepo.save(tp);
        }),
      );
    }
    return savedCourse;
  }

  /**
   *
   * Soft deletes a course
   *
   */

  async remove(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: { batch: true },
    });

    if (!course) throw new Error('Course not found');
    if (course.batch.length > 0)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Course can not be removed, since it have ongoing batch',
      );
    await this.courseRepository.softDelete({ id });
  }

  async certificate(query: string, user: AuthEntity) {
    const courseDetails = await this.courseRepository.findOne({
      where: { id: query },
    });

    const alreadyExists = await this.certificateRepo.findOne({
      where: { auth: { id: user.id }, course: { id: courseDetails.id } },
    });

    let certificateId;
    let certificateDate =
      new Date().getDate() +
      ' ' +
      new Date().toLocaleDateString('en-US', { month: 'long' }) +
      ' ' +
      new Date().getFullYear();
    if (alreadyExists) {
      certificateId = alreadyExists.certificateId;
      certificateDate =
        alreadyExists.createdDate.getDate() +
        ' ' +
        alreadyExists.createdDate.toLocaleDateString('en-US', {
          month: 'long',
        }) +
        ' ' +
        alreadyExists.createdDate.getFullYear();
    } else {
      certificateId = await this.sequenceService.generateUniqueId(
        this.credentialRepo,
      );
      const certificate = new Certificate();
      certificate.certificateId = certificateId;
      certificate.auth = user;
      certificate.course = courseDetails;
      await this.certificateRepo.save(certificate);
    }

    const filePath = path.join(__dirname, '../../static/index.html');
    const result = fs.readFileSync(filePath, 'utf-8');

    let renderedHTML = result
      .replace('{{YOUR_NAME}}', user.name)
      .replace('{{DATE}}', certificateDate)
      .replace('{{COURSE_NAME}}', courseDetails.courseName)
      .replace('{{ID}}', certificateId);

    const size = 'A6';
    const height = '210mm';
    const width = '297mm';
    const compile = hb.compile(renderedHTML, { strict: true });

    // Execute the compiled template function to generate HTML content
    renderedHTML = compile();
    fs.writeFileSync('./temp.html', renderedHTML);

    const url: Buffer = await new Promise(async function (res, rej) {
      exec(
        `wkhtmltopdf --enable-local-file-access --page-height ${height} --page-width ${width}  temp.html temp.pdf`,
        async (error, stdout, stderr) => {
          if (error) {
            console.error('Error converting Excel to Pdf:', error);
            rej(error);
          } else {
            const buffer = fs.readFileSync('./temp.pdf');
            fs.unlinkSync('./temp.pdf');
            fs.unlinkSync('./temp.html');
            res(buffer);
          }
        },
      );
    });

    //   let modified= renderedHTML.toString();
    const uploadResult: any = await this.uploadService.upload(
      `${user.name}-${courseDetails.courseName}.pdf`,
      url,
      'certificate',
      false,
    );
    //find in enrollment and add it to student
    const getStudent = await this.studentRepo.findOne({
      where: { auth: { id: user.id } },
    });
    const userData = await this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .innerJoinAndSelect('enrollment.batch', 'batch')
      .innerJoinAndSelect('batch.course', 'course')
      .where('enrollment.student = :studentId', { studentId: getStudent.id })
      .getMany();

    const matchingDetails: any = userData.filter((x) => {
      return x.batch.course.id == courseDetails.id;
    });

    matchingDetails[0].certificate = uploadResult.Location;
    const saveIt = await this.enrollmentRepo.save(matchingDetails[0]);
    // console.log(saveIt)
    return uploadResult;
  }

  /*
   *
   *   Corporates
   *
   */

  async findCorporateCategories() {
    return await this.courseCategoryRepo.find({
      select: { id: true, name: true },
    });
  }

  async findCorporateCategoriesMobile() {
    return await this.courseCategoryRepo.find({
      select: {
        id: true,
        name: true,
        course: { id: true, courseName: true, slugName: true },
      },
      relations: { course: true },
    });
  }

  async findOneCorporateCategory(id: string) {
    return await this.courseRepository.find({
      where: { courseCategory: { id } },
    });
  }

  async arrangeData(batch: BatchEntity[]) {
    let totalStudents = 0;
    let totalTrainers = 0;
    const avgRating = 4.7;
    // Updating the total stduents data
    const studentPromise = [];
    for (let i = 0; i < batch.length; i++) {
      studentPromise.push(
        this.batchService.enrollStudentList({
          batchId: batch[i].id,
        }),
      );
    }

    (await Promise.all(studentPromise)).forEach(
      (item) => (totalStudents += item.total),
    );

    // Updating the total trainers data
    const trainerCount = new Set();
    batch.forEach((el) => trainerCount.add(el.trainer.id));

    totalTrainers = trainerCount.size;

    return {
      totalStudents,
      avgRating,
      totalTrainers,
    };
  }
  async courseLists(): Promise<Course[]> {
    const courses = await this.courseRepository.find({
      select: ['id', 'courseName'],
    });
    return courses;
  }

  async validateCertificate(payload: GetCertificateDTO) {
    const [certificate, count] = await this.certificateRepo.findAndCount({
      where: {
        auth: { name: ILike(`%${payload.name}%`) },
        certificateId: payload.certificateId,
      },
      relations: {
        auth: true,
        course: true,
      },
      select: {
        auth: { name: true },
        course: { courseName: true },
        certificateId: true,
        createdDate: true,
        id: true,
      },
      take: payload.pageLength,
      skip: payload.pageLength * (payload.pageNo - 1),
    });
    return { certificate, totalCount: count };
  }
  async findCourseCategoryNames() {
    const courseCategories = await this.courseCategoryRepo
      .createQueryBuilder('courseCategory')
      .select(['courseCategory.id', 'courseCategory.name'])
      .getMany();

    return {
      data: courseCategories,
    };
  }
}
