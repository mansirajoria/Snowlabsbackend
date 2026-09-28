import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  EntityManager,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { FeedBackType, RoleType } from '@utils/enum';
import { Trainer } from '@trainer/entities/trainer.entity';
import { CreateTrainerDto } from '@trainer/dto/create-trainer.dto';
import { FindTrainerDto } from '@trainer/dto/trainer-query.dto';
import { TrainerSkills } from '@trainer/entities/trainer-skill.entity';
import { SkillsService } from '@skills/skills.service';
import { AddTrainerSkillDto } from './dto/add-trainerSkill.dto';
import HttpException from '@utils/exceptions/HttpException';
import { UpdateTrainerInfoDto } from '@trainer/dto/update-trainer-info.dto';
import { UpdateTrainerSkillDto } from '@trainer/dto/update-trainer-skill.dto';
import { generatePassword, hashPassword } from '@utils/helper.service';
import { generateTrainerSequence } from '@utils/sequence-generator/sequence.service';
import { LoginDto } from '@auth/dto/common.dto';
import * as bcrypt from 'bcryptjs';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Notifications } from '@notifications/entities/notifications.entity';
import { MailService } from '@mail/mail.service';
import { Enrollment } from '@batch/entities/enrollment.entity';
import axios from 'axios';
import { NotificationsService } from '@notifications/notifications.service';
import { TrainerCost } from './entities/trainer-cost.entity';
import { TrainerInvoice } from '@trainer_lms/entities/trainer-invoice.entity';
import { Skill } from '@skills/entities/skill.entity';
import { Payment } from '@payment/entities/payment.entity';
import { SessionEntity } from '@session/entities/session.entity';
import { Webinar } from '@webinars/entities/webinar.entity';

@Injectable()
export class TrainerService {
  constructor(
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Webinar) private webinarRepo: Repository<Webinar>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(TrainerCost)
    private trainerCostRepo: Repository<TrainerCost>,
    @InjectRepository(Skill)
    private skillRepo: Repository<Skill>,
    @InjectRepository(TrainerSkills)
    private trainerSkillRepo: Repository<TrainerSkills>,
    @InjectRepository(TrainerInvoice)
    private trainerInvoice: Repository<TrainerInvoice>,
    private readonly mailService: MailService,
    private jwtService: JwtService,
    private notificationsRepo: NotificationsService,
    private skillService: SkillsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * Creates and return a new trainer
   *
   * @returns the newly created trainer
   *
   */
  async create(
    createTrainerDto: CreateTrainerDto,
    creater: any,
    // Inject the transaction manager
  ): Promise<Trainer> {
    return this.authRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const findTrainer = await transactionalEntityManager.findOne(
          AuthEntity,
          {
            where: { email: createTrainerDto.email },
          },
        );
        if (findTrainer) {
          throw new HttpException(422, `Trainer already exists`);
        }
        if (!createTrainerDto.cost.length)
          throw new HttpException(
            HttpStatus.BAD_REQUEST,
            `Provide all type of cost`,
          );
        const phoneCheck = await transactionalEntityManager.findOne(
          AuthEntity,
          {
            where: { phoneNumber: createTrainerDto.phoneNumber },
          },
        );

        if (phoneCheck) {
          throw new HttpException(409, 'Phone already exists, Try another');
        }

        const auth = new AuthEntity();
        const trainer = new Trainer();

        auth.name = createTrainerDto.name;
        auth.email = createTrainerDto.email.toLowerCase();
        // Creator
        // auth.createdBy = creater.role;
        auth.phoneNumber = createTrainerDto.phoneNumber;
        auth.role = RoleType.TRAINER;
        auth.isActive = createTrainerDto.isActive;

        trainer.auth = auth;
        trainer.trainerId = generateTrainerSequence();
        trainer.qualification = createTrainerDto.qualification;
        trainer.workExp = createTrainerDto.workExp;
        trainer.trainingExp = createTrainerDto.trainingExp;

        trainer.facebookProfile = createTrainerDto.facebookProfile;
        trainer.instragramProfile = createTrainerDto.instragramProfile;
        trainer.linkedInProfile = createTrainerDto.linkedInProfile;

        trainer.description = createTrainerDto.description;
        trainer.resume = createTrainerDto.resume;
        trainer.gstNumber = createTrainerDto.gstNumber;

        if (createTrainerDto.isActive) {
          const generateNewPassword = generatePassword();
          auth.password = await hashPassword(generateNewPassword);

          await this.mailService.sendLoginCred(
            {
              to: createTrainerDto.email,
              subject: 'Trainer Account credentails',
            },
            {
              email: createTrainerDto.email,
              password: generateNewPassword,
            },
          );
        }
        await transactionalEntityManager.save(auth);
        await transactionalEntityManager.save(trainer);
        const trainerDetails = await transactionalEntityManager.save(trainer);
        const costObject: Array<object> = [];
        for (let i = 0; i < createTrainerDto.cost.length; i++) {
          const fees = {
            inrAmount: createTrainerDto.cost[i].inrAmount,
            dollorAmount: createTrainerDto.cost[i].dollorAmount,
            feesType: createTrainerDto.cost[i].feesType,
            trainer: trainerDetails,
          };
          costObject.push(fees);
        }

        // Insert costObject into TrainerCost table within the transaction
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(TrainerCost)
          .values(costObject)
          .execute();

        return trainerDetails;
      },
    );
  }
  /**
   *
   * Returns all the trainer saved in database
   *
   * @returna an array of trainer
   *
   */

  async findAll(query: FindTrainerDto) {
    if (query.dropdown) {
      const resp = await this.trainerRepo.find({
        relations: ['auth'],
        select: ['id', 'auth'],
      });
      return resp;
    }
    const limit = query.pageLength < 1 ? 1 : query.pageLength || 10;
    const page = query.pageNo < 1 ? 1 : query.pageNo || 1;

    const {
      name,
      trainerId,
      email,
      phoneNumber,
      batchId,
      isActive,
      skillCategory,
      skill,
      keyword,
    } = query;

    const trainerPromise = this.trainerRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.auth', 'qba')
      .leftJoinAndMapMany(
        'qb.batch',
        BatchEntity,
        'batch',
        'qb.id = batch.trainerId',
      )
      .leftJoinAndSelect('qb.trainerSkills', 'tk')
      .leftJoinAndSelect('qb.cost', 'cost')
      .leftJoinAndSelect('tk.skill', 'skill')
      .leftJoinAndSelect('skill.skillCategory', 'category')
      .where(
        keyword
          ? 'qba.name ILIKE :trainerName OR qb.trainerId ILIKE :trainerName OR qba.email ILIKE :trainerName OR qba.phoneNumber ILIKE :trainerName'
          : name
          ? 'qba.name ILIKE :trainerName'
          : '1=1',
        { trainerName: `%${keyword || name}%` },
      )
      .andWhere(trainerId ? 'qb.trainerId ILIKE :trainerId' : '1=1', {
        trainerId: `%${trainerId}%`,
      })
      .andWhere(email ? 'qba.email ILIKE :email' : '1=1', {
        email: `%${email}%`,
      })
      .andWhere(phoneNumber ? 'qba.phoneNumber LIKE :number' : '1=1', {
        number: `%${phoneNumber}%`,
      })
      .andWhere(batchId ? 'batch.batchId ILIKE :batchId' : '1=1', {
        batchId: `%${batchId}%`,
      })
      .andWhere(isActive ? 'qba.isActive = :isActive' : '1=1', {
        isActive: `%${isActive}%`,
      })
      .andWhere(skillCategory ? 'category.name ILIKE :category' : '1=1', {
        category: `%${skillCategory}%`,
      })
      .andWhere(skill ? 'skill.name ILIKE :name' : '1=1', { name: skill })
      .orderBy('qb.lastModifiedDate', 'DESC')
      // .skip((page - 1) * limit)
      // .take(limit)
      .getMany();

    const totalTrainerPromise = this.trainerRepo.count();
    const activeTrainersPromise = this.trainerRepo.count({
      where: { auth: { isActive: true } },
    });

    const engagedTQ = `select t.id from batch b 
                       join trainer t ON b."trainerId"  = t.id
                       where b."endDate" >= $1
                       group by t.id `;
    const [trainerOfBatch, webinarOfBatch] = await Promise.all([
      this.batchRepo
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.trainer', 'trainer')
        .where('batch.endDate >=:endDate', { endDate: new Date() })
        .getMany(),
      this.webinarRepo
        .createQueryBuilder('webinar')
        .leftJoinAndSelect('webinar.trainer', 'trainer')
        .where('webinar.endDate >=:endDate', { endDate: new Date() })
        .getMany(),
    ]);
    let trainerIds: Array<string> = [];
    trainerOfBatch.map(({ trainer }) => {
      trainerIds.push(trainer.id);
    });
    webinarOfBatch.map(({ trainer }) => {
      trainerIds.push(trainer.id);
    });
    const uniqueIds = new Set(trainerIds);
    const engagedPromise = this.batchRepo.query(engagedTQ, [new Date()]);

    const [trainers, trainerCount, engagedTrainers] = await Promise.all([
      trainerPromise,
      totalTrainerPromise,
      engagedPromise,
      // activeTrainersPromise,
    ]);

    const vacantTrainers: number = trainerCount - uniqueIds.size;
    const activeTrainers: number = trainerCount - vacantTrainers;
    return {
      trainers: trainers,
      stats: {
        totalTrainers: trainerCount,
        vacantTrainers,
        activeTrainers,
      },
    };
  }

  /**
   *
   * Get the details of a trainer by id(uuid)
   *
   * @returns a trainer : Common
   *
   */
  async findOne(id: string, queryParams: any) {
    const currentDate: Date = new Date(moment().toString());

    const { courseName, skillName } = queryParams;

    const trainer = await this.trainerRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.auth', 'auth')
      .where('auth.id = :id', { id })
      .leftJoinAndMapMany(
        'qb.batch',
        BatchEntity,
        'batch',
        'batch.trainerId = qb.id',
      )
      .leftJoinAndSelect('qb.trainerSkills', 'tk')
      .leftJoinAndSelect('qb.cost', 'cost')
      .leftJoinAndSelect('tk.skill', 'skill')
      .leftJoinAndSelect('skill.skillCategory', 'category')
      .getOne();

    if (!trainer) throw new HttpException(404, 'Trainer Not Found');

    // skill search implementation
    if (skillName) {
      const ts = await this.trainerSkillRepo
        .createQueryBuilder('qb')
        .leftJoin('qb.trainer', 'trainer')
        .leftJoin('trainer.auth', 'auth')
        .where('auth.id = :id', { id })
        .leftJoinAndSelect('qb.skill', 'skill')
        .leftJoinAndSelect('skill.skillCategory', 'category')
        .andWhere(skillName ? 'skill.name ILIKE :skillName' : '1=1', {
          skillName: `%${skillName}%`,
        })

        .getMany();

      trainer['trainerSkills'] = ts;
    }

    // Skill Stats
    const trainerTotalSkillsPromise = this.trainerSkillRepo.count({
      where: { trainer: { auth: { id } } },
    });
    const trainerActiveSkillsPromise = this.trainerSkillRepo.count({
      where: { isActive: true, trainer: { auth: { id } } },
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
      b."trainerId" =$1 AND sf."type"=$2
  `;
    const overallRatingPromise = this.sessionRepo.query(overallRatingQuery, [
      trainer.id,
      FeedBackType.POST_SESSION,
    ]);
    const trainerEarnQuery = `select cast(sum(
      case 
        when ts.commerce is not null
        then cast(ts.commerce as decimal)
        else 0
      end) as INT) as earnings
    from "trainer-skills" ts
     join trainer t on t.id =ts."trainerId" 
     join auth a on a.id = t."authId" 
     where ts."deletedAt" is null and a.id = $1`;

    // const trainerEarningsPromise = this.trainerSkillRepo.query(
    //   trainerEarnQuery,
    //   [id],
    // );

    const earningQuery = `with roiData as (
      select 
          case
              when tc."feesType" ='Per_Pax' then (count(p.id) * tc."inrAmount")
              when tc."feesType" ='Per_Hour' then (count(s.id)  * b."totalDuration" * tc."inrAmount")
              when tc."feesType" ='Per_Batch' then (count(b.id) * tc."inrAmount")
          end as "trainerCost", t."gstNumber"
      from payment p  
      join batch b on p."batchId" = b.id
      join course c on b."courseId" = c.id
      join "trainer-cost" tc on b."costId" = tc.id
      join trainer t on b."trainerId" = t.id
      left join "session" s on b.id = s."batchId" and tc."feesType" = 'Per_Hour'
      where b."trainerId" = $1 and p."paymentStatus"='paid'
      group by b."trainerId", tc."feesType", tc."inrAmount", b."totalDuration", t."gstNumber"
      ) select sum( 
      case
        when "gstNumber" is not null then "trainerCost" + "trainerCost" * 0.18
        else "trainerCost"
      end) as "TotalTrainerCost"
      from roiData;`;

    const trainerEarnPromise = this.paymentRepo.query(earningQuery, [
      trainer.id,
    ]);

    const [
      trainerTotalSkills,
      trainerActiveSkills,
      overallRating,
      trainerEarnings,
    ] = await Promise.all([
      trainerTotalSkillsPromise,
      trainerActiveSkillsPromise,
      overallRatingPromise,
      trainerEarnPromise,
    ]);

    trainer['totalSkills'] = trainerTotalSkills;
    trainer['activeSkills'] = trainerActiveSkills;
    trainer['overallRating'] = overallRating[0]['rating']
      ? Number(overallRating[0]['rating'].toFixed(1))
      : 0;
    trainer['totalEarnings'] = trainerEarnings[0]['earnings']
      ? parseInt(trainerEarnings[0]['earnings'])
      : 0;

    // Course Stats

    const trainerBatches = await this.batchRepo
      .createQueryBuilder('qb')
      .leftJoinAndSelect('qb.course', 'course')
      .leftJoinAndSelect('qb.trainer', 'trainer')
      .leftJoin('qb.sessions', 'session')
      .leftJoinAndSelect('session.feedbacks', 'feedbacks')
      .where('trainer.id = :id', { id: trainer.id })
      // .andWhere('feedbacks.type=:type', { type: FeedBackType.POST_SESSION })
      .andWhere(
        courseName
          ? 'course.courseName ILIKE :courseName OR qb.batchId ILIKE :courseName'
          : '1=1',
        {
          courseName: `%${courseName}%`,
        },
      )

      .select([
        'qb.id AS "id"',
        'course.courseName AS "courseName"',
        'qb.batchId AS "batchId"',
        'qb.startDate As startDate',
        'qb.endDate As endDate',
        '(CAST(AVG(feedbacks.rating) * 100 AS INTEGER) / 100) AS overallRating',
        `CASE
          WHEN qb.startDate > :currentDate THEN 'Active'
          WHEN qb.startDate <= :currentDate AND qb.endDate >= :currentDate THEN 'Active'
          ELSE 'over'
         END AS "batchStatus"`,
      ])
      .groupBy('qb.id')
      .addGroupBy('course.courseName')
      .orderBy('qb.lastModifiedDate', 'DESC')
      .setParameter('currentDate', new Date())
      .getRawMany();
    const activeBatchesPromise = this.batchRepo.count({
      where: [
        {
          trainer: {
            id: trainer.id,
          },
          endDate: MoreThanOrEqual(currentDate),
        },
      ],
    });

    const batchesTaughtPromise = this.batchRepo.count({
      where: [
        {
          trainer: {
            id: trainer.id,
          },
          endDate: LessThan(currentDate),
        },
      ],
    });

    const [activeBatches, batchesTaught] = await Promise.all([
      activeBatchesPromise,
      batchesTaughtPromise,
      ,
    ]);
    let overRating = 0;
    for (let i = 0; i < trainerBatches.length; i++) {
      overRating += Number(trainerBatches[i].overallRating);
    }
    trainer['courseStats'] = {
      data: trainerBatches, // will send later trainerBatches
      activeBatches: activeBatches,
      batchesTaught: batchesTaught,
      // overallRating: overallRating[0]['rating']
      //   ? parseInt(overallRating[0]['rating'])
      // : 0,
      overallRating: overallRating[0]['rating']
        ? Number(overallRating[0]['rating'].toFixed(1))
        : 0,
      earnings: trainerEarnings[0]?.TotalTrainerCost
        ? trainerEarnings[0]?.TotalTrainerCost
        : 0,
    };

    return trainer;
  }

  async trainerSkill(id: string, payload: any) {
    return await this.trainerSkillRepo.findOne({
      where: { id, trainer: { auth: { id: payload.id } } },
      relations: { skill: { skillCategory: true } },
    });
  }

  /**
   *
   * Adding new Skill to existing trainer
   *
   * @returns a trainer with updated skills : Common
   *
   */

  async addSkill(
    id: string,
    payload: AddTrainerSkillDto,
  ): Promise<TrainerSkills> {
    // trainer Check
    const findTrainer = await this.trainerRepo.findOne({
      where: { auth: { id } },
      relations: ['auth'],
    });

    if (!findTrainer) throw new HttpException(404, `Trainer not found`);

    // check the new skill, already exists for this trainer : Existing Skill Check
    const existingSkill = await this.trainerSkillRepo.findOne({
      where: {
        trainer: { id: findTrainer.id },
        skill: { id: payload.skillId },
      },
    });
    if (existingSkill) throw new HttpException(409, 'Skill already exists');

    // Skill Check
    const findSkill = await this.skillService.findSkill(payload.skillId);
    if (!findSkill) throw new HttpException(404, `Skill not found`);

    const trainerSkill = new TrainerSkills();

    trainerSkill.skill = findSkill;
    trainerSkill.trainer = findTrainer;

    trainerSkill.rating = payload.rating;
    // trainerSkill.commerce = payload.commerce;
    trainerSkill.toc = payload.toc;
    trainerSkill.isActive = payload.isActive;

    const createTrainerSkill = this.trainerSkillRepo.create(trainerSkill);
    const result = await this.notificationsRepo.create({
      title: 'Review Skill',
      description: `New skill is added by ${findTrainer.auth.name}`,
      receiverType: 'Admins',
    });
    return await this.trainerSkillRepo.save(createTrainerSkill);
  }

  /**
   *
   * Soft Delete Skill to existing trainer
   *
   * @returns
   *
   */

  async softDeleteTraineSkill(id: string, skillId: string) {
    const findTrainerSkill = await this.trainerSkillRepo.findOne({
      where: { id: skillId, trainer: { auth: { id: id } } },
    });
    if (!findTrainerSkill) throw new HttpException(404, `Skill not found`);

    await this.trainerSkillRepo.softDelete(findTrainerSkill.id);
  }

  /**
   *
   * Update trainer existing skills
   *
   * @returns a trainer with updated skills : Common
   *
   */

  async updateTrainerSkill(id: string, payload: UpdateTrainerSkillDto) {
    // trainer Check
    const findTrainer = await this.trainerRepo.findOne({
      where: { auth: { id } },
    });
    if (!findTrainer) throw new HttpException(404, `Trainer not found`);

    // updating skill category check
    const findCategory = await this.skillService.findSkillCategory(
      payload.categoryId,
    );
    if (!findCategory) throw new HttpException(404, `Skill Category not found`);
    // updating skill check
    const findSkill = await this.skillService.findSkill(payload.skillId);
    if (!findSkill) throw new HttpException(404, `Skill not found`);

    // find trainer particular skill by trainerId and skillId from Trainer Skill
    const findTrainerSkill = await this.trainerSkillRepo.findOne({
      relations: ['trainer', 'skill'],
      where: {
        trainer: { id: findTrainer.id },
        id: payload.tid,
      },
    });

    if (!findTrainerSkill)
      throw new HttpException(404, `Trainer Skill not found`);

    findTrainerSkill.skill = findSkill;
    findTrainerSkill.skill.skillCategory = findCategory;
    findTrainerSkill.rating = payload.rating;
    findTrainerSkill.isActive = payload.isActive;
    findTrainerSkill.toc = payload.toc;
    await Promise.all([
      this.trainerSkillRepo.save(findTrainerSkill),
      this.skillRepo.save(findSkill),
    ]);
  }

  /**
   *
   * Update trainer profile information
   *
   * @returns a trainer with updated profile info  : Common
   *
   */

  async updateTrainerInfo(id: string, payload: UpdateTrainerInfoDto) {
    const findTrainer = await this.trainerRepo.findOne({
      where: { auth: { id: id } },
      relations: ['auth'],
    });
    if (!findTrainer) throw new HttpException(404, `Trainer not found`);

    const findAuth = await this.authRepo.findOne({
      where: { id: findTrainer.auth.id },
    });
    // if (payload.isActive) {
    //   const isEnrolled = await this.batchRepo.find({
    //     where: { trainer: { auth: { id } } },
    //   });
    //   if (isEnrolled.length)
    //     throw new HttpException(
    //       HttpStatus.BAD_REQUEST,
    //       `you can not inActive  enrolled trainers`,
    //     );
    // }

    // Email check
    const emailCheck = await this.authRepo.findOne({
      where: { email: payload.email },
    });

    if (emailCheck && emailCheck.id != findTrainer.auth.id)
      throw new HttpException(409, 'Email already exists, Try another');

    // Phone Number Check

    const phoneCheck = await this.authRepo.findOne({
      where: { phoneNumber: payload.phoneNumber },
    });

    if (phoneCheck && phoneCheck.phoneNumber != findTrainer.auth.phoneNumber)
      throw new HttpException(409, 'Phone already exists, Try another');

    const isTeaching = await this.batchRepo.findOne({
      where: { trainer: { id: findTrainer.id }, endDate: MoreThan(new Date()) },
    });

    if (isTeaching && payload.isActive === false) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This trainer is engaged in a batch!',
      );
    }

    findAuth.name = payload.name;
    findAuth.email = payload.email;
    findAuth.isActive = payload.isActive;
    findAuth.gender = payload.gender;
    findAuth.phoneNumber = payload.phoneNumber;
    findAuth.countryCode = payload.countryCode;
    const savedAuth = await this.authRepo.save(findAuth);

    findTrainer.workExp = payload.workExp;
    findTrainer.trainingExp = payload.trainingExp;
    findTrainer.qualification = payload.qualification;

    findTrainer.linkedInProfile = payload.linkedInProfile;
    findTrainer.facebookProfile = payload.facebookProfile;
    findTrainer.instragramProfile = payload.instragramProfile;

    findTrainer.description = payload.description;
    findTrainer.resume = payload.resume;
    findTrainer.profilePhoto = payload.profilePhoto;
    findTrainer.newUser = payload.newUser;
    findTrainer.gstNumber = payload.gstNumber;

    const savedTrainer = await this.trainerRepo.save(findTrainer);
    if (payload.cost) {
      await Promise.all(
        payload.cost.map(async (t) => {
          const tp = t.id
            ? await this.trainerCostRepo.findOne({ where: { id: t.id } })
            : new TrainerCost();
          tp.trainer = findTrainer;
          tp.inrAmount = t.inrAmount;
          tp.dollorAmount = t.dollorAmount;
          tp.inrAmount = t.inrAmount;
          await this.trainerCostRepo.save(tp);
        }),
      );
    }
    savedAuth.trainer = savedTrainer;
    return savedAuth;
  }

  /**
   *
   *  Soft Delete trainer by authId(uuid)
   *
   * @returns a soft deleted trainer
   *
   */
  async softDelete(id: string): Promise<void> {
    const findTrainer = await this.trainerRepo.findOne({
      where: { auth: { id } },
      relations: { auth: true },
    });

    const checkTrainerBatch = await this.batchRepo.findOne({
      where: [{ trainer: { auth: { id } } }],
    });

    if (checkTrainerBatch)
      throw new HttpException(
        HttpStatus.FORBIDDEN,
        '`you can not delete enrolled trainers',
      );

    await this.authRepo.softDelete({ id: findTrainer.auth.id });
    await this.trainerRepo.softDelete({ id: findTrainer.id });
  }
}
