import { BaseEntity } from '@utils/base.entity';
import {
  HelpQueryType,
  LeadsCategory,
  QueryCategory,
  QueryType,
} from '@utils/enum';
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LeadTrack } from './leads-track.entity';
import { Student } from '@students/entities/student.entity';
import { HelpdeskTrack } from './helpdesk-track.entity';
import { Exclude } from 'class-transformer';

@Entity('helpdesks')
export class Helpdesk extends BaseEntity {
  @Column({ nullable: true })
  queryId: string;

  @Column({ nullable: true })
  query: string;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @Column({ type: 'enum', enum: QueryCategory, nullable: true })
  queryCategoryType: QueryCategory;

  @Column({ nullable: true })
  status: string;

  @OneToMany(() => HelpdeskTrack, (track) => track.helpdesk, {
    cascade: ['insert', 'update'],
  })
  statusTrack: HelpdeskTrack[];

  @ManyToOne(() => Student)
  student: Student;

  @Column({ default: false })
  isOpened: boolean;
}
