import { AuthEntity } from '@auth/entities/auth.entity';
import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('review')
export class Review extends BaseEntity {
  @ManyToOne(() => AuthEntity)
  user: AuthEntity;

  @Column()
  rating: number;

  @Column()
  feedback: string;

  @ManyToOne(() => Course)
  courseId: Course;
}
