import { BaseEntity } from '@utils/base.entity';
import { QuestionType } from '@utils/enum';
import { Column, DeleteDateColumn, Entity } from 'typeorm';

@Entity('session-feedback-questions')
export class SessionFeedbackQuestions extends BaseEntity {
  @Column()
  question: string;

  @Column('jsonb', { nullable: true })
  options: { id: number; text: string }[];

  @Column({ type: 'enum', enum: QuestionType })
  type: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}
