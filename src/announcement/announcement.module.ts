import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { Announcement } from '@announcement/entities/announcement.entity';
import { BatchModule } from '@batch/batch.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Announcement,
      BatchEntity,
      Course,
      Student,
      SubAdmin,
      Trainer,
    ]),
    BatchModule,
    NotificationsModule
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
