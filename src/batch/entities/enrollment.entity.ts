import { BaseEntity } from '@utils/base.entity';
import { BatchEntity } from './batch.entity';
import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm';
import { Student } from '@students/entities/student.entity';

@Entity('enrollment')
export class Enrollment extends BaseEntity {
  @ManyToOne(() => BatchEntity, (batchEntity) => batchEntity.enroll)
  batch: BatchEntity;

  @ManyToOne(() => Student, (studentEntity) => studentEntity.enroll)
  student: Student;

  @Column({ default: true })
  accessStatus: boolean;

  @Column({ nullable: true })
  certificate: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
