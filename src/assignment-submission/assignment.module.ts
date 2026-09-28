import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AssignmentSubmissionService } from './assignment.service';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { Student } from '@students/entities/student.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { SessionEntity } from '@session/entities/session.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentSubmission,
      ResourceEntity,
      Student,
      BatchEntity,
      SessionEntity,
      Trainer,
    ]),
    NotificationsModule
  ],
  exports: [AssignmentSubmissionService],
  providers: [AssignmentSubmissionService],
})
export class AssignmentModule {}
