import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CourseCategory } from './course-category.entity';

@Entity('industry-trends')
export class IndustryTrends extends BaseEntity {
  @ManyToOne(() => CourseCategory)
  category: CourseCategory;

  @Column()
  index: number;

  @Column()
  year: number;

  @Column()
  percentage: number;
}
