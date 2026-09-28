import { BaseEntity } from '@utils/base.entity';
import { FeedBackType, QuestionType } from '@utils/enum';
import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm';
import { FeedbackForm } from './feedback-form.entity';

@Entity('feedback-questions')
export class FeedbackQuestions extends BaseEntity {
  @Column()
  question: string;

  @Column('jsonb', { nullable: true })
  options: { id: number; text: string }[];

  @Column({ type: 'enum', enum: QuestionType })
  questionType: string;

  @ManyToOne(() => FeedbackForm, (feedbackForm) => feedbackForm.questions)
  feedbackForm: FeedbackForm;

  @DeleteDateColumn()
  deletedAt?: Date;
}
