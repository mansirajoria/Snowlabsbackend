import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { FAQ } from '@faq/entities/faq.entity';
import { BatchEntity } from 'batch/entities/batch.entity';
import { Forum } from '@forum/entities/forum.entity';
import { Exclude } from 'class-transformer';
import { IndustryTrends } from './industry-trends.entity';
import { CategoryStats } from './category-stats.entity';

@Entity('course-category')
@Index('ix_name_unique', ['name'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
@Index('ix_slugName_unique', ['slugName'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
export class CourseCategory {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Index()
  @Column()
  name: string;

  @Column()
  slugName: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'about', nullable: true })
  about: string;

  @Column({ name: 'preRequisites', nullable: true })
  preRequisites: string;

  @Column('varchar', { array: true, nullable: true })
  whoCanTake: string[];

  @UpdateDateColumn({ nullable: true })
  lastModifiedDate: Date;

  @OneToMany(() => FAQ, (faq) => faq.courseCategory)
  faqs?: FAQ[];

  @OneToMany(() => Course, (courseEntity) => courseEntity.courseCategory)
  course: Course[];

  @OneToMany(() => BatchEntity, (batchEntity) => batchEntity.courseCategory)
  batch?: BatchEntity[];

  @Column({ type: Boolean, nullable: true, default: false })
  publish: boolean;

  // Forum
  @OneToMany(() => Forum, (forumEntity) => forumEntity.courseCategory)
  forum: Forum[];

  @DeleteDateColumn()
  deletedAt: string;

  @OneToMany(() => IndustryTrends, (industry) => industry.category)
  trends: IndustryTrends[];

  @OneToMany(() => CategoryStats, (stats) => stats.category)
  stats: CategoryStats[];

  @Column({ nullable: true })
  aboutImage: string;

  @Column({ nullable: true })
  averageRating: string;
}
