import { AuthEntity } from '@auth/entities/auth.entity';
import { BaseEntity } from '@utils/base.entity';
import {
  LearningObjectiveEnum,
  TrainingFundedEnum,
  enrollmentType,
} from '@utils/enum';
import { Enrollment } from 'batch/entities/enrollment.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { StudentWorkExperience } from './student-work-experience.entity';
import { StudentEducation } from './student-education.entity';
import { Forum } from '@forum/entities/forum.entity';
import { Exclude } from 'class-transformer';

@Entity('student')
export class Student extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', default: 'DLA-STUDENT-0001' })
  studentId: string;

  @OneToOne(() => AuthEntity)
  @JoinColumn()
  auth: AuthEntity;

  @Column({ name: 'country', nullable: true })
  country?: string;

  @Column({ nullable: true })
  countryShortCode?: string;

  @Column({
    type: 'enum',
    default: enrollmentType.NOT_ENROLLED,
    enum: enrollmentType,
  })
  enrollmentType: enrollmentType;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @OneToMany(() => Enrollment, (enrollmentEntity) => enrollmentEntity.student)
  enroll: Enrollment;

  @Column({ nullable: true })
  linkedInUri: string;

  @Column({ nullable: true })
  facebookUri: string;

  @Column({ nullable: true })
  githubUri: string;

  @Column({ nullable: true })
  profilePicUri: string;

  @Column({
    nullable: true,
    enum: LearningObjectiveEnum,
    default: LearningObjectiveEnum.LEARNING,
  })
  learningObjective: LearningObjectiveEnum;

  @Column({ type: 'varchar', array: true, nullable: true })
  interests: string[];

  @Column({ nullable: true, default: true })
  newUser: boolean;

  @Column({ nullable: true, enum: TrainingFundedEnum })
  trainingFundedBy: TrainingFundedEnum;

  @OneToMany(() => StudentWorkExperience, (work) => work.student)
  workExperience: StudentWorkExperience[];

  @OneToMany(() => StudentEducation, (edu) => edu.student)
  education: StudentEducation[];

  @Column({ nullable: true })
  countryFlag: string;
}
