import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity('student-work-experience')
export class StudentWorkExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  designation: string;

  @Column()
  companyName: string;

  @Column()
  workingFromDate: Date;

  @Column({ nullable: true })
  workingTillDate: Date;

  @Column()
  currentlyWorking: boolean;

  @ManyToOne(() => Student, (student) => student.workExperience)
  student: Student;
}
