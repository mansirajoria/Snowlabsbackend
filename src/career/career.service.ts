import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CareerCategory } from './entities/career-category.entity';
import { Repository } from 'typeorm';
import { Career } from './entities/career.entity';
import HttpException from '@utils/exceptions/HttpException';
import {
  ApplicantQueryDTO,
  CreateApplicantDto,
} from './dto/create-applicant.dto';
import { Applicant } from './entities/applicant.entity';
import { CareerQueryDto } from './dto/career-query.dto';
import { JobStatus, PositionStatus, RoleType } from '@utils/enum';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { QueryCategoryDTO } from './dto/query-category.dto';
import axios from 'axios';
import { NotificationsService } from '@notifications/notifications.service';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(CareerCategory)
    private careerCategoryRepo: Repository<CareerCategory>,
    @InjectRepository(Career) private careerRepo: Repository<Career>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Applicant) private applicantRepo: Repository<Applicant>,
    private notificationService:NotificationsService
  ) {}

  /*
   * Career Category
   */

  /**
   *
   * Creates and return a new category
   *
   * @returns The newly created category
   *
   */

  async createCategory(payload: CreateCategoryDto) {
    const duplicateCategoryCheck = await this.careerCategoryRepo.findOne({
      where: { name: payload.name },
    });

    if (duplicateCategoryCheck)
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        'Career Category already exists',
      );

    const createCategory = this.careerCategoryRepo.create(payload);
    return await this.careerCategoryRepo.save(createCategory);
  }

  /**
   *
   * Returns all the categories saved in database
   *
   * @returns An array of categories
   *
   */

  async findAllCategory(payload: QueryCategoryDTO) {
    const categories = await this.careerCategoryRepo.find({
      relations: { career: true },
      where: { id: payload.categoryId },
    });

    if (categories.length == 0)
      throw new HttpException(HttpStatus.NOT_FOUND, 'No Category Found');
    return categories;
  }

  /**
   *
   * Get the details of a single career category by id
   *
   * @returns A single career
   *
   */

  async findOneCategory(id: string) {
    const findCategory = await this.careerCategoryRepo.findOne({
      where: { id: id },
    });
    if (!findCategory)
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        'Career Category Not found',
      );
    return findCategory;
  }

  /*
   * Career
   */

  /**
   *
   * Creates and returns a new Career
   *
   * @returns The new Career
   *
   */
  async createCareer(createCareerDto: CreateCareerDto): Promise<Career> {
    const categoryCheck = await this.careerCategoryRepo.findOne({
      where: { id: createCareerDto.careerCategory },
    });

    //  Throw exception if category doesn't exist
    if (!categoryCheck)
      throw new HttpException(400, 'Career Category Not found');

    // Duplicate Career Check
    const duplicateCareerCheck = await this.careerRepo.findOne({
      where: { name: createCareerDto.name },
    });

    if (duplicateCareerCheck)
      throw new HttpException(400, 'Career already exists');

    //  Create Career
    const createCareer: Career = this.careerRepo.create({
      ...createCareerDto,
      careerCategory: categoryCheck,
    });
    return await this.careerRepo.save(createCareer);
  }

  /**
   *
   * Returns all the Career with pagination, and admin stats, search and filter added
   *
   * @returns An array of Career
   *
   */

  async findAllCareer(query: CareerQueryDto): Promise<{
    dataCount: number;
    data: Career[];
    openPositionCount: number;
    toBeReviewedCount: number;
    hiredCandidatesCount: number;
  }> {
    const { pageNo = 1, pageLength = 10, searchName = '' } = query;

    const qb = this.careerRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.careerCategory', 'category');

    // Total Count
    const dataCountPromise = qb.getCount();

    const careersPromise = qb
      // we are maping many as we can have multiple applicant for the same jon position
      .leftJoinAndMapMany(
        'qb.applicant',
        Applicant,
        'applicant',
        'qb.id = applicant.careerId',
      )
      .where('qb.name ILIKE :val', { val: `%${searchName}%` })
      .orderBy('qb.lastModifiedDate', 'DESC')
      .take(pageLength)
      .skip((pageNo - 1) * pageLength)
      .getMany();

    // * need to add the no. of applicant for the job position --> Added
    const openPosition = this.careerRepo.count({
      where: { status: PositionStatus.OPEN },
    });

    const toBeReviewed = this.applicantRepo.count({
      where: {
        status: JobStatus.NEW,
      },
    });
    const hiredCandidates = this.applicantRepo.count({
      where: {
        status: JobStatus.HIRED,
      },
    });

    const [
      dataCount,
      data,
      openPositionCount,
      toBeReviewedCount,
      hiredCandidatesCount,
    ] = await Promise.all([
      dataCountPromise,
      careersPromise,
      openPosition,
      toBeReviewed,
      hiredCandidates,
    ]);

    return {
      dataCount,
      data,
      openPositionCount,
      toBeReviewedCount,
      hiredCandidatesCount,
    };
  }

  /**
   *
   * Get the details of a single career by id
   *
   * @returns A single career
   *
   */

  async findOneCareer(id: string): Promise<Career> {
    const findCareer = await this.careerRepo.findOne({
      relations: { careerCategory: true },
      where: { id: id },
    });

    if (!findCareer) throw new HttpException(400, 'Career Not found');
    return findCareer;
  }

  /**
   *
   * Updates a career based on id provided
   *
   * @returns The updated career
   *
   */
  async updateCareer(id: string, req: UpdateCareerDto): Promise<Career> {
    // existing career check
    if (req.name) {
      const dupicateCheck = await this.careerRepo.findOne({
        relations: { careerCategory: true },
        where: [{ name: req.name }],
      });

      if (dupicateCheck)
        throw new HttpException(HttpStatus.NOT_FOUND, 'Career Already Exists');
    }

    //  Checks if career exists else throws exception
    const careerCheck = await this.careerRepo.findOne({
      relations: { careerCategory: true },
      where: { id: id },
    });
    if (!careerCheck)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Career Not found');

    if (req.careerCategory) {
      const categoryCheck = await this.careerCategoryRepo.findOne({
        where: { id: req.careerCategory },
      });
      if (!categoryCheck)
        throw new HttpException(400, 'Invalid Career Category Id');

      careerCheck.careerCategory = categoryCheck;
    }

    // Updates the career with paylaod values
    careerCheck.name = req.name;
    careerCheck.location = req.location;
    careerCheck.jobType = req.jobType;
    careerCheck.status = req.status;

    //  Save and return career
    return await this.careerRepo.save(careerCheck);
  }

  /**
   *
   * Soft deletes a Career
   *
   */
  async softDeleteCareer(id: string): Promise<any> {
    const careerCheck = await this.careerRepo.findOne({
      relations: { careerCategory: true },
      where: { id: id },
    });

    if (!careerCheck)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Career  Not found');

    return await this.careerRepo.softDelete({ id: careerCheck.id });
  }

  /*
   * Applicant Website
   */

  /**
   *
   * Creates and returns a new Applicant
   *
   * @returns The new applicant
   *
   */
  async createApplicant(payload: CreateApplicantDto): Promise<Applicant> {

    const careerCheck = await this.careerRepo.findOne({
      where: { id: payload.career },
      relations:["careerCategory"]
    });

    //  Throw exception if career doesn't exist
    if (!careerCheck) throw new HttpException(400, 'Career Not found');

    const createApplicant: Applicant = this.applicantRepo.create({
      ...payload,
      career: careerCheck,
    });
  
    const saveApplicant = await this.applicantRepo.save(createApplicant);
    await this.notificationService.create({ title: "New Job Application", description: `You received an application for ${careerCheck.careerCategory.name}`, receiverType: "Admins" })
    return saveApplicant;
  }

  /**
   *
   * Returns all the applicant with pagination, with search
   *
   * @returns An array of Applicant
   *
   */

  // ! Incase of Trainer : please provide the Category as trainer
  async findAllApplicant(query: ApplicantQueryDTO) {
    const {
      pageNo = 1,
      pageLength = 1,
      searchName = '',
      category = '',
    } = query;

    if (category == 'trainer') {
      const qb = this.applicantRepo
        .createQueryBuilder('qb')
        .leftJoinAndSelect('qb.career', 'career')
        .leftJoinAndSelect('career.careerCategory', 'category')
        .where('category.name ILIKE :category', { category });

      const trainersCountPromise = qb.getCount();

      const trainersPromise = this.applicantRepo
        .createQueryBuilder('qb')
        .leftJoinAndSelect('qb.career', 'career')
        .leftJoinAndSelect('career.careerCategory', 'category')
        .where('category.name ILIKE :category', { category })
        .andWhere('qb.name ILIKE :val1', { val1: `%${searchName}%` })
        .orderBy('qb.lastModifiedDate', 'DESC')
        .take(pageLength)
        .skip((pageNo - 1) * pageLength)
        .getMany();

      // Calculate the snowlabs trainers
      const totalTrainersPromise = this.authRepo.count({
        where: { role: RoleType.TRAINER, isActive: true },
      });

      const toBeReviewedPromise = qb
        .andWhere('qb.status = :status', { status: JobStatus.NEW })
        .getCount();

      const hiredTrainersPromise = qb
        .andWhere('qb.status = :status', { status: JobStatus.HIRED })
        .getCount();

      const [
        trainerCount,
        trainers,
        totalTrainers,
        toBeReviewed,
        hiredTrainers,
      ] = await Promise.all([
        trainersCountPromise,
        trainersPromise,
        totalTrainersPromise,
        toBeReviewedPromise,
        hiredTrainersPromise,
      ]);

      return {
        trainerCount,
        trainers,
        totalTrainers,
        toBeReviewed,
        hiredTrainers,
      };
    } else {
      const qb = this.applicantRepo
        .createQueryBuilder('qb')
        .leftJoinAndSelect('qb.career', 'career')
        .leftJoinAndSelect('career.careerCategory', 'category');

      const countPromise = qb.getCount();

      const applicantsPromise = qb
        .where('qb.name ILIKE :val1', { val1: `%${searchName}%` })
        .andWhere('category.name ILIKE :val2', { val2: `%${category}%` })
        .orderBy('qb.lastModifiedDate', 'DESC')
        .take(pageLength)
        .skip((pageNo - 1) * pageLength)
        .getMany();

      const [count, applicants] = await Promise.all([
        countPromise,
        applicantsPromise,
      ]);

      return {
        count,
        applicants,
      };
    }
  }

  /**
   *
   * Get the details of a single Applicant by id
   *
   * @returns A single applicant
   *
   */
  async findOneApplicant(id: string): Promise<Applicant> {
    const findApplicant = await this.applicantRepo.findOne({
      relations: { career: true },
      where: { id: id },
    });

    if (!findApplicant) throw new HttpException(400, 'Applicant Not found');
    return findApplicant;
  }

  /**
   *
   * Updates the single Applicant by id
   *
   * @returns void
   *
   */

  async updateApplicant(id: string, paylaod: UpdateApplicantDto) {
    const findApplicant = await this.applicantRepo.findOne({
      where: { id: id },
    });
    if (!findApplicant) throw new HttpException(400, 'Applicant Not found');

    findApplicant.status = paylaod.status;

    await this.applicantRepo.save(findApplicant);
  }
}
