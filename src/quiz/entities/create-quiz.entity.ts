import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { QuizStatusType } from '@utils/enum';
import { QuizQuestionEntity } from './question-quiz.entity';

@Entity('quiz')
export class QuizEntity extends BaseEntity {
  @Column()
  quizName: string;

  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.quiz,{cascade:true})
  session: SessionEntity;

  @OneToMany(
    () => QuizQuestionEntity,
    (quizQuestionEntity) => quizQuestionEntity.quiz,
  )
  quizes: QuizQuestionEntity[];

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true, type: 'float' })
  duration: number;

  @Column({ nullable: true, default: false })
  isPublish: boolean;

  @DeleteDateColumn()
  deletedAt: Date;
}
