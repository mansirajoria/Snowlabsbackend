import { AuthEntity } from '@auth/entities/auth.entity';
import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { SessionEntity } from './session.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { Student } from '@students/entities/student.entity';
import { SesssionFeedbackSubmission } from './feedback-submission.entity';

@Entity('session-feedbacks')
export class SessionFeedback extends BaseEntity {
  @ManyToOne(() => Student, (student) => student.id)
  student: Student;

  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.feedbacks)
  session: SessionEntity;

  @OneToMany(
    () => SesssionFeedbackSubmission,
    (sessionFeedbackSubmission) => sessionFeedbackSubmission.feedback,
  )
  submission: SesssionFeedbackSubmission[];

  @Column({ type: 'float4', nullable: true })
  rating: number;
}
