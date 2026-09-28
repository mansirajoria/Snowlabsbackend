import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackForm } from './entities/feedback-form.entity';
import { FeedbackQuestions } from './entities/feedback-questions.entity';
import { FeedbackController } from './feedback-controller';
import { FeedbackService } from './feedback-service';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { FeedbackSubmission } from './entities/feedback-form-submission.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedbackForm,FeedbackQuestions, Enrollment,FeedbackSubmission
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports:[FeedbackService]
})
export class FeedbackModule {}
