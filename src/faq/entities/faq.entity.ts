import { CourseCategory } from '@courses/entities/course-category.entity';
import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { FaqType } from '@utils/enum';
import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm';

@Entity('faq')
export class FAQ extends BaseEntity {
  @ManyToOne(() => Course)
  course?: Course;

  @ManyToOne(
    () => CourseCategory,
    (courseCategoryEntity) => courseCategoryEntity.faqs,
  )
  courseCategory: CourseCategory;

  @Column({ nullable: true })
  questionNo: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ nullable: true, type: 'enum', enum: FaqType })
  type: FaqType;

  @Column({ nullable: true, type: 'boolean' })
  isActive: boolean;

  @DeleteDateColumn()
  deletedAt: Date;
}
