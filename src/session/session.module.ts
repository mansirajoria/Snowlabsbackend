import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { SessionController } from "./session.controller";
import { SessionService } from './session.service';
import { BatchEntity } from '../batch/entities/batch.entity';
import { SessionEntity } from './entities/session.entity';
import { SessionController } from './session.controller';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { Student } from '@students/entities/student.entity';
import { SessionFeedback } from './entities/session-feedback.entity';
import { SessionFeedbackQuestions } from './entities/session-feedback-questions.entity';
import { SesssionFeedbackSubmission } from './entities/feedback-submission.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { FeedbackQuestions } from 'feedbacks/entities/feedback-questions.entity';
import { FeedbackAnswer } from 'feedbacks/entities/feedback-form-answer.entity';
import { FeedbackForm } from 'feedbacks/entities/feedback-form.entity';
import { FeedbackSubmission } from 'feedbacks/entities/feedback-form-submission.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { MicrosoftTeamModule } from 'microsoft-team/microsoft-team.module';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { MailModule } from '@mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionEntity,
      BatchEntity,
      AssignmentSubmission,
      Trainer,
      Student,
      SessionFeedback,
      SessionFeedbackQuestions,
      SesssionFeedbackSubmission,
      FeedbackQuestions,
      FeedbackAnswer,
      FeedbackForm,
      FeedbackSubmission,
      ResourceEntity,
      CredentialEntity,
      Enrollment,
    ]),
    MailModule,
    NotificationsModule,
    MicrosoftTeamModule,
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
