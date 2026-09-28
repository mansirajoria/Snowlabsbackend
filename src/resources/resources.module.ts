import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourceEntity } from './entities/create-resource.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Student } from '@students/entities/student.entity';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizQuestion } from 'quiz/dto/create-quiz.dto';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResourceEntity,
      SessionEntity,
      BatchEntity,
      Student,
      AssignmentSubmission,
      Enrollment,
      QuizEntity,
      QuizQuestionEntity,
    ]),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
