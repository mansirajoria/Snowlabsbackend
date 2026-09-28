import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity('student-education')
export class StudentEducation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  qualification: string;

  @Column()
  institutionName: string;

  @Column()
  studentFromDate: Date;

  @Column({ nullable: true })
  studentTillDate: Date;

  @Column()
  currentlyStudent: boolean;

  @ManyToOne(() => Student, (student) => student.education)
  student: Student;
}
