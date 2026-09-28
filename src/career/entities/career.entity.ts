import { BaseEntity } from '@utils/base.entity';
import { JobType, PositionStatus } from '@utils/enum';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CareerCategory } from '@career/entities/career-category.entity';
import { Applicant } from './applicant.entity';

@Entity('career')
export class Career extends BaseEntity {
  @Column({ name: 'name', nullable: false, unique: true })
  name: string;

  @Column({ name: 'description', nullable: false })
  description: string;

  @Column({ name: 'location', nullable: false })
  location: string;

  @Column({ name: 'jobType', enum: JobType, nullable: false })
  jobType: JobType;

  @ManyToOne(() => CareerCategory, (categoryEntity) => categoryEntity.career)
  careerCategory: CareerCategory;

  @OneToMany(() => Applicant, (applicantEntity) => applicantEntity.career)
  applicant: Applicant;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PositionStatus,
    default: PositionStatus.OPEN,
  })
  status: PositionStatus;
}
