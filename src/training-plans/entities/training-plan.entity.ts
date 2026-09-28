import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';

@Entity('training-plan')
export class TrainingPlan extends BaseEntity {
  @ManyToOne(() => Course, (courseEntity) => courseEntity.trainingPlans)
  course: Course;

  @Index()
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  inrAmount: number;

  @Column({ nullable: true })
  dollorAmount: number;

  @OneToMany(() => BatchEntity, (batchEntity) => batchEntity.plans)
  batches: BatchEntity[];

  @Column('varchar', { array: true, nullable: true })
  features: string[];

  @Column({ type: Boolean, nullable: true, default: false })
  publish: boolean;
}
