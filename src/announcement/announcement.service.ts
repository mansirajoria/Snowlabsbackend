import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementTo, enrollmentType } from '@utils/enum';
import { Announcement } from '@announcement/entities/announcement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '@courses/entities/course.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import HttpException from '@utils/exceptions/HttpException';
import { BatchService } from '@batch/batch.service';
import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { FindAnnouncementDto } from './dto/find-announcement.dto';
import axios from 'axios';
import { Notifications } from '@notifications/entities/notifications.entity';
import { NotificationsService } from '@notifications/notifications.service';
@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(SubAdmin) private subAdminrepo: Repository<SubAdmin>,
    private batchService: BatchService,
    private notificationRepo: NotificationsService,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    let saveAnnouncement: Announcement;

    if (createAnnouncementDto.userBase == AnnouncementTo.BATCH) {
      // console.log('*** Work for the Batch ***');

      const findCourse = await this.courseRepo.findOne({
        where: { id: createAnnouncementDto.courseId },
      });

      if (!findCourse)
        throw new HttpException(HttpStatus.NOT_FOUND, `Course  not found`);

      const findBatch = await this.batchRepo.findOne({
        where: [
          { id: createAnnouncementDto.batchId, course: { id: findCourse.id } },
        ],
      });

      if (!findBatch)
        throw new HttpException(HttpStatus.NOT_FOUND, `Batch not found`);

      const object = new Announcement();

      object.userBase = AnnouncementTo.BATCH;
      object.course = findCourse;
      object.batch = findBatch;
      object.annocuncement = createAnnouncementDto.annocuncement;

      const createAnnouncement = this.announcementRepo.create(object);
      saveAnnouncement = await this.announcementRepo.save(createAnnouncement);

      // We need to send the web notification to the batch members

      // find all the Batch Students
      const batchStudentList = await this.batchService.batchStudentsById(
        createAnnouncementDto.batchId,
      );

      const studentList = batchStudentList.map((item) => {
        return this.notificationRepo.create({
          title: 'Announcement',
          description: createAnnouncementDto.annocuncement,
          receiverType: createAnnouncementDto.userBase,
          studentId: item.student.id,
        });
      });

      await Promise.all(studentList);

      // batchStudentList student will get the web notification on LMS
    } else {
      // console.log('*** Work for Students, Trainers, Sub_Admin ***');
      const object = new Announcement();

      object.userBase = createAnnouncementDto.userBase;
      object.annocuncement = createAnnouncementDto.annocuncement;

      const createAnnouncement = this.announcementRepo.create(object);
      saveAnnouncement = await this.announcementRepo.save(createAnnouncement);

      // we need to send the web notiication as the value of userBase

      if (createAnnouncementDto.userBase == AnnouncementTo.STUDENTS) {
        // we need to send web notification to all the enrolled student tags
        const findEnrolledStudent = await this.studentRepo.find({
          select: {
            id: true,
            studentId: true,
            auth: { id: true, name: true },
          },
          relations: { auth: true },
          where: {
            enrollmentType: enrollmentType.ENROLLED,
          },
        });

        await Promise.all(
          findEnrolledStudent.map((item) => {
            return this.notificationRepo.create({
              title: 'Anouncement',
              description: createAnnouncementDto.annocuncement,
              receiverType: createAnnouncementDto.userBase,
              studentId: item.id,
            });
          }),
        );
        // return findEnrolledStudent;
        // findEnrolledStudent list will get the web notification on LMS
      }

      if (createAnnouncementDto.userBase == AnnouncementTo.TRAINERS) {
        // we need to send web notification to active trainers
        const findActiveTrainers = await this.trainerRepo.find({
          select: {
            id: true,
            trainerId: true,
            auth: { id: true, name: true },
          },
          relations: { auth: true },
          where: {
            auth: {
              isActive: true,
            },
          },
        });

        await Promise.all(
          findActiveTrainers.map((item) => {
            return this.notificationRepo.create({
              title: 'Anouncement',
              description: createAnnouncementDto.annocuncement,
              receiverType: createAnnouncementDto.userBase,
              trainerId: item.id,
            });
          }),
        );

        // return findActiveTrainers;
        // findActiveTrainers list will get the web notification on LMS
      }

      if (createAnnouncementDto.userBase == AnnouncementTo.SUB_ADMINS) {
        // we need to send web notification to active trainers
        const findActiveSubAdmin = await this.subAdminrepo.find({
          select: {
            id: true,
            auth: { id: true, name: true },
          },
          relations: { auth: true },
          where: {
            auth: {
              isActive: true,
            },
          },
        });
        await this.notificationRepo.create({
          title: 'Announcement',
          description: createAnnouncementDto.annocuncement,
          receiverType: createAnnouncementDto.userBase,
        });
      }
    }
    return saveAnnouncement;
  }

  async findAll(query: FindAnnouncementDto) {
    const limit = query.pageLength < 1 ? 1 : query.pageLength || 10;
    const page = query.pageNo < 1 ? 1 : query.pageNo || 1;

    const { name = '' } = query;

    const resp = await this.announcementRepo
      .createQueryBuilder('qb')
      .where(name ? 'qb.annocuncement ILIKE :annocuncement' : '1=1', {
        annocuncement: `%${name}%`,
      })
      .orderBy('qb.lastModifiedDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalCount = await this.announcementRepo.count();

    return { data: resp, totalCount };
  }

  async findOne(id: string) {
    const resp = await this.announcementRepo.findOne({
      where: { id },
      relations: { course: true, batch: true },
    });
    if (!resp)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Announcement Not Found');
    return resp;
  }

  async remove(id: string) {
    const resp = await this.announcementRepo.findOne({ where: { id } });
    if (!resp)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Announcement Not Found');

    return await this.announcementRepo.softDelete(id);
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const resp = await this.announcementRepo.findOne({ where: { id } });
    if (!resp)
      throw new HttpException(HttpStatus.NOT_FOUND, 'Announcement Not Found');

    if (updateAnnouncementDto.userBase == AnnouncementTo.BATCH) {
      resp.userBase = updateAnnouncementDto.userBase;

      const findCourse = await this.courseRepo.findOne({
        where: { id: updateAnnouncementDto.courseId },
      });

      if (!findCourse)
        throw new HttpException(HttpStatus.NOT_FOUND, `Course  not found`);

      resp.course = findCourse;

      const findBatch = await this.batchRepo.findOne({
        where: { id: updateAnnouncementDto.batchId },
      });

      if (!findBatch)
        throw new HttpException(HttpStatus.NOT_FOUND, `Batch not found`);

      resp.batch = findBatch;
    } else resp.userBase = updateAnnouncementDto.userBase;

    resp.annocuncement = updateAnnouncementDto.annocuncement;

    return await this.announcementRepo.save(resp);
  }
}
