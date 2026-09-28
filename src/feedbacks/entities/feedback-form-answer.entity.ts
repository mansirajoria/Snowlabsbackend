import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { FeedbackQuestions } from './feedback-questions.entity';
import { FeedbackSubmission } from './feedback-form-submission.entity';

@Entity('feedback-form-answers')
export class FeedbackAnswer extends BaseEntity {
  @Column({ type: 'float4', nullable: true })
  rating: number;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true })
  selectAnswer: number;

  @ManyToOne(
    () => FeedbackQuestions,
    (feedbackQuestions) => feedbackQuestions.id,
  )
  question: FeedbackQuestions;

  @ManyToOne(
    () => FeedbackSubmission,
    (feedbackSubmission) => feedbackSubmission.answers,
  )
  submission: FeedbackSubmission;
}
