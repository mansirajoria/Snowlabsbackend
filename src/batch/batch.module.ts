import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BatchEntity } from './entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { Enrollment } from './entities/enrollment.entity';
import { MicrosoftTeamModule } from 'microsoft-team/microsoft-team.module';
import { WebinarsModule } from '@webinars/webinars.module';
import { Webinar } from '@webinars/entities/webinar.entity';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { SessionService } from 'session/session.service';
import { SessionEntity } from 'session/entities/session.entity';
import { SessionModule } from 'session/session.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import { MailService } from '@mail/mail.service';
import { MailModule } from '@mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { TrainerCost } from '@trainer/entities/trainer-cost.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trainer,
      ConfigModule,
      BatchEntity,
      Course,
      Student,
      Enrollment,
      Webinar,
      CredentialEntity,
      ResourceEntity,
      QuizEntity,
      AssignmentSubmission,
      QuizSubmission,
      SessionEntity,
      TrainingPlan,
      TrainerCost,
    ]),
    MicrosoftTeamModule,
    SessionModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
