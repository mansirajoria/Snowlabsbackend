import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { WebinarCategory } from './webinar-category.entity';
import { Platform } from '@utils/enum';
import { IsEnum } from 'class-validator';
import { TrainerInvoice } from '@trainer_lms/entities/trainer-invoice.entity';
import { Exclude } from 'class-transformer';

@Entity('webinar')
@Index('webinar_title_unique', ['title'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
@Index('webninar_slugName_unique', ['slugName'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
export class Webinar extends BaseEntity {
  @Column()
  title: string;

  @Column()
  slugName: string;

  @Column()
  featuredImage: string;

  @Column({ nullable: true })
  callId: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  meetingUrl: string;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @ManyToOne(() => Trainer)
  trainer: Trainer;

  @Column()
  designation: string;

  @Column()
  profilePic: string;

  @Column()
  trainerBio: string;

  @Column()
  noOfSeats: number;

  @Column({ type: 'boolean', default: true })
  published: boolean;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ nullable: true })
  @IsEnum(Platform)
  webinarPlatform: Platform;

  @ManyToOne(
    () => WebinarCategory,
    (WebinarCategory) => WebinarCategory.webinars,
  )
  category: WebinarCategory;

  @Column()
  availableSeats: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  meetingId: string;

  @Column({ type: 'float', default: 0 })
  feesINR: number;

  @Column({ type: 'float', default: 0 })
  feesUSD: number;

  // Invoice Manager
  @OneToMany(() => TrainerInvoice, (trainerInvoice) => trainerInvoice.webinar)
  invoice: TrainerInvoice[];

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  whatYouWillLearnSection: string;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ nullable: true })
  metaTags: string;

  @Column({ default: false })
  mailSent: boolean;
}
