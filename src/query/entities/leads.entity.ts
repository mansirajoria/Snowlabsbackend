import { BaseEntity } from '@utils/base.entity';
import {
  HelpQueryType,
  LeadsCategory,
  LeadsStatus,
  QueryCategory,
  QueryType,
} from '@utils/enum';
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LeadTrack } from './leads-track.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Student } from '@students/entities/student.entity';
import { Course } from '@courses/entities/course.entity';
import { Exclude } from 'class-transformer';

@Entity('leads')
export class Leads extends BaseEntity {
  @Column()
  queryId: string;

  @Column({ nullable: true })
  query: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @Column({ type: 'enum', enum: LeadsCategory })
  category: LeadsCategory;

  @Column({ enum: LeadsStatus, default: LeadsStatus.NEW })
  status: LeadsStatus;

  @OneToMany(() => LeadTrack, (track) => track.lead, {
    cascade: ['insert', 'update'],
  })
  statusTrack: LeadTrack[];

  @Column({ default: false })
  isOpened: boolean;

  @ManyToOne(() => Course)
  course: Course;
}
