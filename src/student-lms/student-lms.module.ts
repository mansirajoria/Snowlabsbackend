import { Module } from '@nestjs/common';
import { StudentLmsService } from './student-lms.service';
import { StudentLmsController } from './student-lms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Student } from '@students/entities/student.entity';
import { StudentsModule } from '@students/students.module';
import { StudentEducation } from '@students/entities/student-education.entity';
import { StudentWorkExperience } from '@students/entities/student-work-experience.entity';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Helpdesk } from 'query/entities/helpdesk.entity';
import { QueryModule } from 'query/query.module';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { Country } from 'country/entities/country.entity';
import { Course } from '@courses/entities/course.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { AssignmentModule } from 'assignment-submission/assignment.module';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { QuizAnswerModule } from 'quiz-submission/quiz-submission.module';
import { QuizModule } from 'quiz/quiz.module';
import { NotificationsModule } from 'notifications/notifications.module';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { ReferralModule } from 'referral/referral.module';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';
import { SessionModule } from 'session/session.module';
import { SessionFeedbackQuestions } from 'session/entities/session-feedback-questions.entity';
import { BatchModule } from '@batch/batch.module';
import { FeedbackQuestions } from 'feedbacks/entities/feedback-questions.entity';
import { FeedbackModule } from 'feedbacks/feedback.module';
import { ResourcesModule } from 'resources/resources.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthEntity,
      Student,
      StudentEducation,
      StudentWorkExperience,
      WebinarEnrollment,
      Webinar,
      Helpdesk,
      BatchEntity,
      Enrollment,
      Course,
      SessionEntity,
      ResourceEntity,
      AssignmentSubmission,
      QuizSubmission,
      BatchEntity,
      SessionFeedbackQuestions,
      QuizEntity,
      FeedbackQuestions,
    ]),
    StudentsModule,
    QueryModule,
    AssignmentModule,
    QuizAnswerModule,
    QuizModule,
    NotificationsModule,
    ReferralModule,
    SessionModule,
    BatchModule,
    FeedbackModule,
    ResourcesModule,
  ],
  controllers: [StudentLmsController],
  providers: [StudentLmsService],
})
export class StudentLmsModule {}
