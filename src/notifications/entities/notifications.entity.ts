import { Announcement } from '@announcement/entities/announcement.entity';
import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import {
  HelpQueryType,
  LeadsCategory,
  LeadsStatus,
  QueryCategory,
  QueryType,
} from '@utils/enum';
import { uuid } from 'aws-sdk/clients/customerprofiles';
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn
} from 'typeorm';



@Entity('notifications')
export class Notifications extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  courseId: string;

 @ManyToOne(() => Announcement,{ nullable: true })
  @JoinColumn({ name: 'announcementId', referencedColumnName: 'id' }) // Foreign key column in Notifications table referencing id in Announcement table
  announcementId: string;

  @Column()
  receiverType: string;



  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId', referencedColumnName: 'id' })
  studentId: string;

  @ManyToOne(() => Trainer, { nullable: true })
  @JoinColumn({ name: 'trainerId', referencedColumnName: 'id' })
  trainerId: string;

}
