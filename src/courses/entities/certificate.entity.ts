import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Course } from './course.entity';
import { AuthEntity } from '@auth/entities/auth.entity';

@Entity('certificate')
export class Certificate extends BaseEntity {
  @Column()
  certificateId: string;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => AuthEntity)
  auth: AuthEntity;
}
