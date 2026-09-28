import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('currilculum')
export class Currilculum extends BaseEntity {
  @ManyToOne(() => Course, (courseEntity) => courseEntity.currilculum)
  course: Course;

  @Column({ nullable: true })
  moduleNo: number;

  @Column()
  heading: string;

  @Column()
  content: string;
}
