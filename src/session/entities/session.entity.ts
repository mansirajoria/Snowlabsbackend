import { BaseEntity } from '@utils/base.entity';
import {
  AfterInsert,
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BatchEntity } from '@batch/entities/batch.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { SessionFeedback } from './session-feedback.entity';
import { FeedbackSubmission } from 'feedbacks/entities/feedback-form-submission.entity';
@Entity('session')
export class SessionEntity extends BaseEntity {
  @Column()
  sessionName: string;

  @Column({ nullable: true })
  sessionDate: Date;

  @Column({ nullable: true })
  sessionEndDate: Date;

  @Column({ nullable: true })
  occurrenceId: string;

  @Column({ nullable: true })
  callId: string;

  @Column({ nullable: true })
  meetingUrl: string;

  @Column({ nullable: true })
  recordingUrl: string;

  @ManyToOne(() => BatchEntity, (batchEntity) => batchEntity.sessions)
  batch: BatchEntity;

  @OneToMany(() => ResourceEntity, (resource) => resource.session)
  resources: ResourceEntity[];

  @OneToMany(() => QuizEntity, (quiz) => quiz.session)
  quiz: QuizEntity[];

  @OneToMany(
    () => FeedbackSubmission,
    (sessionFeedback) => sessionFeedback.session,
  )
  feedbacks: FeedbackSubmission[];

  @Column({ default: false })
  isRecordingAdded: boolean;

  @Column({ default: false })
  isResourcesAdded: boolean;

  @Column({ default: false })
  isLinksAdded: boolean;

  @Column({ default: false })
  isAssignmentAdded: boolean;

  @Column({ default: false })
  isQuizAdded: boolean;

  @Column({ default: false })
  isCancelled: boolean;

  @Column({ nullable: true })
  index: number;

  @Column({ default: true, nullable: true })
  isPublished: boolean;

  @DeleteDateColumn()
  deletedAt: Date;
}
