import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { JobStatus } from '@utils/enum';
import { Career } from './career.entity';

@Entity('applicant')
export class Applicant extends BaseEntity {
  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  countryCode: string;

  @Column({ type: 'varchar', length: '10', nullable: true })
  phoneNumber: string;

  @Column({ name: 'linkedIn', nullable: true })
  linkedIn: string;

  @Column('varchar', { array: true, nullable: true })
  skills: string[];

  @Column({ name: 'resume', nullable: true })
  resume: string;

  @Column({ name: 'status', enum: JobStatus, default: JobStatus.NEW })
  status: JobStatus;

  @ManyToOne(() => Career, (careerEntity) => careerEntity.applicant)
  career: Career;
}
