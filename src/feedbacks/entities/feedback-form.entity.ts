import {
    Column,
    Entity,
    OneToMany,
    ManyToOne,
    DeleteDateColumn,
  } from 'typeorm';
  import { BaseEntity } from '@utils/base.entity';
import { FeedbackQuestions } from './feedback-questions.entity';
import { FeedBackType } from '@utils/enum';
 
  
  @Entity('feedback-form')
  export class FeedbackForm extends BaseEntity {
    @OneToMany(
        () => FeedbackQuestions,
        (feedBackQuestion) => feedBackQuestion.feedbackForm
      )
      questions: FeedbackQuestions[];

      @Column({ type: 'enum', enum: FeedBackType })
      type: string;
  
     @DeleteDateColumn()
     deletedAt: Date;
  }
  