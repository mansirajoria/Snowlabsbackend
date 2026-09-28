import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';

import { Announcement } from '@announcement/entities/announcement.entity';
import { Notifications } from "@notifications/entities/notifications.entity";
import { BatchModule } from '@batch/batch.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { Trainer } from '@trainer/entities/trainer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notifications,
      Announcement,
      Enrollment,
      Student,
      Trainer,
      BatchEntity
    ]),
    
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
