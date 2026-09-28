import { FAQ } from '@faq/entities/faq.entity';
import { Review } from '@reviews/entities/review.entity';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import { BaseEntity } from '@utils/base.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BatchEntity } from 'batch/entities/batch.entity';
import { LevelType } from '@utils/enum';
import { Currilculum } from './curriculum.entity';
import { Announcement } from '@announcement/entities/announcement.entity';
import { Payment } from '@payment/entities/payment.entity';
import { Exclude } from 'class-transformer';

@Entity('course')
export class Course extends BaseEntity {
  @Index()
  @Column({ unique: true })
  courseName: string;

  @Index()
  @Column({ unique: true, nullable: true })
  slugName: string;

  @Column({ nullable: true })
  courseDesc: string;

  @ManyToOne(
    () => CourseCategory,
    (courseCategoryEntity) => courseCategoryEntity.id,
  )
  courseCategory: CourseCategory;

  @Column()
  duration: number;

  @Column('varchar', { array: true, nullable: true })
  skillSet: string[];

  @Column({ type: 'enum', enum: LevelType })
  courseLevel: LevelType;

  @Column({ nullable: true })
  courseThumbnail: string;

  @Column({ nullable: true })
  courseMedia: string;

  @Column({ nullable: true })
  courseSyllabus: string;

  // Certification

  @Column({ nullable: true })
  certificationName: string;

  @Column({ nullable: true })
  certificationImg: string;

  @Column({ nullable: true })
  certificationDesc: string;

  // Course Overview

  @Column({ nullable: true })
  about: string;

  @Column({ nullable: true })
  courseFor: string;

  @Column({ nullable: true })
  suitableFor: string;

  @Column({ nullable: true })
  skillCovered: string;

  // Modules

  @OneToMany(() => Currilculum, (currilculumEntity) => currilculumEntity.course)
  currilculum: Currilculum[];

  // FAQs

  @OneToMany(() => FAQ, (faq) => faq.course)
  faqs: FAQ[];

  // Traininig Plans

  @OneToMany(
    () => TrainingPlan,
    (trainingPlansEntity) => trainingPlansEntity.course,
  )
  trainingPlans: TrainingPlan[];

  // Extra

  @OneToMany(() => Review, (review) => review.courseId)
  reviews?: Review[];

  @OneToMany(() => BatchEntity, (batchEntity) => batchEntity.course)
  batch: BatchEntity[];

  @OneToMany(() => Payment, (paymentEntity) => paymentEntity.course)
  payment: Payment[];

  @OneToMany(
    () => Announcement,
    (announcementEntity) => announcementEntity.annocuncement,
  )
  announcement: Announcement[];

  @Column({ type: Boolean, nullable: true, default: false })
  publish: boolean;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaTags: string;

  @Column({ nullable: true })
  metaDescription: string;
}
