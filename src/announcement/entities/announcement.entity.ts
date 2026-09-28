import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { AnnouncementTo } from '@utils/enum';
import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm';

@Entity('announcement')
export class Announcement extends BaseEntity {
  @Column({ type: 'enum', enum: AnnouncementTo })
  userBase: AnnouncementTo;

  @ManyToOne(() => Course, (courseEntity) => courseEntity.batch)
  course: Course;

  @ManyToOne(() => BatchEntity, (batchEntity) => batchEntity.announcement)
  batch: BatchEntity;

  @Column()
  annocuncement: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
