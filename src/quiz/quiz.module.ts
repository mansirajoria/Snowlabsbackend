import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizEntity } from './entities/create-quiz.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { QuizQuestionEntity } from './entities/question-quiz.entity';
import { Student } from '@students/entities/student.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { QuizSubmission } from 'quiz-submission/entities/quiz-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizEntity,
      SessionEntity,
      QuizQuestionEntity,
      Student,
      Enrollment,
      QuizSubmission,
    ]),
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
