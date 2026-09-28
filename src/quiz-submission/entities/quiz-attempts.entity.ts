import { BaseEntity } from '@utils/base.entity';
import { Column, ManyToOne, OneToMany } from 'typeorm';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { QuizSubmission } from './quiz-submission.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { QuizQuestionEntity } from 'quiz/entities/question-quiz.entity';

@Entity('quiz-attempts')
export class QuizAttempts extends BaseEntity {
  @Column()
  obtainMarks: number;

  @Column()
  totalMarks: number;

  @Column()
  correctAnswers: number;

  @ManyToOne(() => QuizEntity, (quizEntity) => quizEntity.id)
  quiz: QuizEntity;

  @ManyToOne(() => QuizSubmission, (quizSubmission) => quizSubmission.attempts)
  submission: QuizSubmission;

  @Column()
  isPassed: boolean;
}
