import { BatchEntity } from '@batch/entities/batch.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { Student } from '@students/entities/student.entity';
import { BaseEntity } from '@utils/base.entity';

import {
  Entity,
  Column,
  ManyToOne,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ForumComment } from './forum-comment.entity';
import { AuthEntity } from '@auth/entities/auth.entity';

@Entity('forum')
export class Forum extends BaseEntity {
  @ManyToOne(() => CourseCategory, (courseCategory) => courseCategory.forum)
  courseCategory: CourseCategory;

  @ManyToOne(() => BatchEntity, (batch) => batch.forum)
  batch: BatchEntity;

  @ManyToOne(() => AuthEntity)
  auth: AuthEntity;

  @Column()
  title: string;

  @Column()
  description: string;

  @OneToMany(() => ForumComment, (forumComment) => forumComment.forum)
  forumComment: ForumComment[];

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  lastModifiedBy?: string;
}
