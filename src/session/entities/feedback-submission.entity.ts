import { Column, Entity, ManyToOne } from 'typeorm';
import { SessionFeedback } from './session-feedback.entity';
import { SessionFeedbackQuestions } from './session-feedback-questions.entity';
import { BaseEntity } from '@utils/base.entity';

@Entity('session-feedback-submission')
export class SesssionFeedbackSubmission extends BaseEntity {
  @Column({ type: 'float4', nullable: true })
  rating: number;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true })
  selectAnswer: number;

  @ManyToOne(
    () => SessionFeedback,
    (sessionFeedback) => sessionFeedback.submission,
  )
  feedback: SessionFeedback;

  @ManyToOne(
    () => SessionFeedbackQuestions,
    (sessionFeedbackQuestion) => sessionFeedbackQuestion.id,
  )
  question: SessionFeedbackQuestions;
}
