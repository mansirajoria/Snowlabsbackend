import { Course } from '@courses/entities/course.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import {
  StudentType,
  ClassRoomType,
  FeeType,
  Platform,
  SessionType,
  BatchStatus,
  BatchTypeEnum,
} from '@utils/enum';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { Announcement } from '@announcement/entities/announcement.entity';
import { Payment } from '@payment/entities/payment.entity';
import { SessionEntity } from '../../session/entities/session.entity';
import { TrainerInvoice } from '@trainer_lms/entities/trainer-invoice.entity';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import { Forum } from '@forum/entities/forum.entity';
import { TrainerCost } from '@trainer/entities/trainer-cost.entity';

@Entity('batch')
export class BatchEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', nullable: true })
  batchId: string;

  // Relations

  @ManyToOne(() => Course, (courseEntity) => courseEntity.batch)
  course: Course;

  @ManyToOne(
    () => CourseCategory,
    (courseCategoryEntity) => courseCategoryEntity.batch,
  )
  courseCategory: CourseCategory;

  @ManyToOne(() => Trainer, (trainerEntity) => trainerEntity.batch)
  trainer: Trainer;

  @OneToMany(() => Enrollment, (enrollmentEntity) => enrollmentEntity.batch)
  enroll: Enrollment[];

  // Basic Details

  @Column({ nullable: true })
  minSize: number;

  @Column({ nullable: true })
  maxSize: number;

  // ClassRoom

  @Column({
    type: 'enum',
    enum: ClassRoomType,
    nullable: true,
  })
  classRoomType: ClassRoomType;

  @Column({
    type: 'enum',
    enum: Platform,
    nullable: true,
  })
  platform: Platform;

  @Column({
    type: 'enum',
    enum: StudentType,
    nullable: true,
  })
  studentType: StudentType;

  @Column({ nullable: true })
  meetLocation: string;

  @Column({ nullable: true })
  meetLink: string;

  // Fees

  @Column({
    type: 'enum',
    enum: FeeType,
  })
  feeType: FeeType;

  @Column({
    type: 'enum',
    enum: BatchTypeEnum,
    default: BatchTypeEnum.LIVE,
  })
  batchType: BatchTypeEnum;

  @Column()
  inrAmount: number;

  @Column()
  dollorAmount: number;

  @Column({ nullable: true })
  gstCharge: number;

  // @Column({ nullable: true })
  // labCost: number;

  // Schedule

  @Column({ type: 'float', nullable: true })
  totalDuration: number;
  @Column({
    type: 'enum',
    enum: SessionType,
    nullable: true,
  })
  sessionType: SessionType;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date; // this need to calculated according to the sessions and start date

  // EndTime - StartTime : no. of hours for 1 session

  @Column()
  totalSession: number; // (totalDuration / sessionDuration) : no. of session that will be delivered

  @Column('integer', { array: true, nullable: true })
  weekDays: number[];

  @Column('varchar', { array: true, nullable: true })
  skills: string[];

  @Column({ nullable: true })
  meetingId: string;

  @Column({ nullable: true })
  filledSeats: number;

  @Column({ default: false })
  isBatchFull: boolean;

  @Column({ default: true })
  isWeb: boolean;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    nullable: true,
  })
  status: BatchStatus;

  @OneToMany(
    () => Announcement,
    (announcementEntity) => announcementEntity.annocuncement,
  )
  announcement: Announcement[];

  @OneToMany(() => Payment, (paymentEntity) => paymentEntity.batch)
  payment: Payment;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => SessionEntity, (session) => session.batch)
  sessions: SessionEntity[];

  // Invoice Manager
  @OneToMany(() => TrainerInvoice, (trainerInvoice) => trainerInvoice.batch)
  invoice: TrainerInvoice[];

  @ManyToOne(() => TrainingPlan, (trainingPlan) => trainingPlan.batches)
  plans: TrainingPlan;

  @Column({ nullable: true })
  callId: string;

  // Forum
  @OneToMany(() => Forum, (forumEntity) => forumEntity.batch)
  forum: Forum[];

  @ManyToOne(() => TrainerCost, (trainerCost) => trainerCost.id, {
    nullable: true,
  })
  cost: TrainerCost;
  batchName: string;
}
