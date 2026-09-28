import {
  Column,
  DeleteDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@utils/base.entity';

import { QuizEntity } from './create-quiz.entity';

@Entity('quiz-questions')
export class QuizQuestionEntity extends BaseEntity {
  @ManyToOne(() => QuizEntity, (quizEntity) => quizEntity.quizes)
  quiz: QuizEntity;

  @Column()
  question: string;

  @Column('jsonb')
  options: { id: number; text: string }[];

  @Column()
  correctAnswer: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Generated('increment')
  questionNo:number

}
