import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { FeedbackQuestions } from './feedback-questions.entity';
import { AssignmentEnum, FeedBackType } from '@utils/enum';
import { FeedbackAnswer } from './feedback-form-answer.entity';
import { FeedbackForm } from './feedback-form.entity';
import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { Course } from '@courses/entities/course.entity';
import { SessionEntity } from '@session/entities/session.entity';
import { BatchEntity } from '@batch/entities/batch.entity';

@Entity('feedback-form-submission')
export class FeedbackSubmission extends BaseEntity {
  @Column({ type: 'float4', nullable: true })
  rating: number;

  @Column({ type: 'enum', enum: AssignmentEnum })
  status: AssignmentEnum;

  @OneToMany(
    () => FeedbackAnswer,
    (feedbackAnswer) => feedbackAnswer.submission,
  )
  answers: FeedbackAnswer[];

  @ManyToOne(() => Student, (student) => student.id)
  student: Student;

  @ManyToOne(() => Trainer, (trainer) => trainer.id, { nullable: true })
  trainer: Trainer;

  @ManyToOne(() => BatchEntity, (batch) => batch.id, { nullable: true })
  batch: BatchEntity;

  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.feedbacks)
  session: SessionEntity;

  @Column({ type: 'enum', enum: FeedBackType })
  type: string;
}
