import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { QuizAttempts } from './entities/quiz-attempts.entity';
import { QuizSubmissionService } from './quiz-submission.service';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Student } from '@students/entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizAttempts,
      QuizSubmission,
      QuizEntity,
      QuizQuestionEntity,
      AuthEntity,
      Student,
    ]),
  ],
  controllers: [],
  providers: [QuizSubmissionService],
  exports: [QuizSubmissionService],
})
export class QuizAnswerModule {}
