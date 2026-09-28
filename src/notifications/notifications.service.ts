import { HttpStatus, Injectable } from '@nestjs/common';

import { AnnouncementTo, RoleType, enrollmentType } from '@utils/enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '@courses/entities/course.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import HttpException from '@utils/exceptions/HttpException';
import { BatchService } from '@batch/batch.service';
import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { Notifications } from './entities/notifications.entity';
import { FindNotificationsDto } from './dto/find.notifications.dto';
import { CreateNotificationDto } from './dto/create-notifications.dto';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private notificationRepo: Repository<Notifications>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Trainer)
    private trainerRepo: Repository<Trainer>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    let saveNotification: Notifications;

    const object = new Notifications();
    object.announcementId = createNotificationDto.announcementId;
    object.title = createNotificationDto.title;
    object.description = createNotificationDto.description;
    object.trainerId = createNotificationDto.trainerId;
    object.studentId = createNotificationDto.studentId;
    object.courseId = createNotificationDto.courseId;
    object.batchId = createNotificationDto.batchId;
    object.receiverType = createNotificationDto.receiverType;
    const createNotification = this.notificationRepo.create(object);
    // eslint-disable-next-line prefer-const
    saveNotification = await this.notificationRepo.save(createNotification);
    return saveNotification;
  }

  async findAll(query: FindNotificationsDto, user: AuthEntity) {
    const limit = query.pageLength < 1 ? 1 : query.pageLength || 10;
    const page = query.pageNo < 1 ? 1 : query.pageNo || 1;
    let details: any = {};
    // console.log(user,"user")
    if (user.role == RoleType.STUDENT) {
      details = await this.studentRepo.findOne({
        where: { auth: { id: user.id } },
      });
    }
    if (user.role == RoleType.TRAINER) {
      details = await this.trainerRepo.findOne({
        where: { auth: { id: user.id } },
      });
    }

    let batchIds;
    let data;
    if (user.role == RoleType.STUDENT) {
      batchIds = await this.enrollmentRepo.find({
        where: { student: { id: details.id } },
        relations: ['batch'],
      });
      data = batchIds.map((enrollment) => enrollment.batch.id);
    }
    if (user.role == RoleType.TRAINER) {
      batchIds = await this.batchRepo.find({
        where: { trainer: { id: details.id } },
      });
      data = batchIds.map((enrollment) => enrollment.id);
    }

    const queryBuilder =
      this.notificationRepo.createQueryBuilder('notifications');
    if (user.role == 'Admin') {
      queryBuilder.where('notifications.receiverType = :receiverType', {
        receiverType: 'Admins',
      });
    }
    if (user.role == RoleType.SUB_ADMIN) {
      queryBuilder.where('notifications.receiverType = :receiverType', {
        receiverType: 'Sub_Admin',
      });
    }
    if (user.role == RoleType.STUDENT) {
      queryBuilder
        .where(
          '(notifications.studentId IS NOT NULL AND notifications.studentId = :studentId)',
          { studentId: details.id },
        )
        .orWhere('notifications.batchId IN (:batchIds)', { batchIds: data })
        .orWhere('notifications.announcementId IS NOT NULL')
        .andWhere('notifications.receiverType = :receiverType', {
          receiverType: 'Students',
        });
    }
    if (user.role == RoleType.TRAINER) {
      queryBuilder
        .where(
          '(notifications.trainerId IS NOT NULL AND notifications.trainerId = :trainerId)',
          { trainerId: details.id },
        )
        .orWhere('notifications.batchId IN (:batchIds)', { batchIds: data })
        .orWhere('notifications.announcementId IS NOT NULL')
        .andWhere('notifications.receiverType = :receiverType', {
          receiverType: 'Trainers',
        });
    }
    const resp = await queryBuilder
      .orderBy('notifications.createdDate', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getMany();

    return { data: resp };
  }
}
