import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CourseCategory } from './course-category.entity';

@Entity('category-stats')
export class CategoryStats extends BaseEntity {
  @ManyToOne(() => CourseCategory)
  category: CourseCategory;

  @Column()
  index: number;

  @Column()
  stat: string;

  @Column()
  statement: string;
}
