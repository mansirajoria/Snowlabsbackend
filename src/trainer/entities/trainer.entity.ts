import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { TrainerSkills } from '@trainer/entities/trainer-skill.entity';
import { EarningType } from '@utils/enum';
import { BatchEntity } from '@batch/entities/batch.entity';
import { TrainerQuery } from '@trainer_lms/entities/trainer-query.entity';
import { TrainerInvoice } from '@trainer_lms/entities/trainer-invoice.entity';
import { TrainerCost } from './trainer-cost.entity';

@Entity('trainer')
export class Trainer extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', default: 'DLA-TRAINER-0001' })
  trainerId: string;

  @OneToOne(() => AuthEntity)
  @JoinColumn()
  auth: AuthEntity;

  @Column({ name: 'newUser', default: true })
  newUser: boolean;

  @Column({ name: 'workExp', nullable: true })
  workExp: string;

  @Column({ name: 'trainingExp', nullable: true })
  trainingExp: string;

  @Column({ type: 'varchar', nullable: true })
  qualification: string;

  @Column({ name: 'earnings', nullable: true })
  earnings: string;

  @Column({ name: 'facebookProfile', nullable: true })
  facebookProfile: string;

  @Column({ name: 'linkedInProfile', nullable: true })
  linkedInProfile: string;

  @Column({ name: 'instragramProfile', nullable: true })
  instragramProfile: string;

  @Column({ name: 'profilePhoto', nullable: true })
  profilePhoto?: string;

  @Column({ name: 'address', nullable: true })
  address?: string;

  @Column({ name: 'resume', nullable: true })
  resume: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @OneToMany(
    () => TrainerSkills,
    (trainerSkillEntity) => trainerSkillEntity.trainer,
  )
  trainerSkills: TrainerSkills[];

  @OneToMany(() => TrainerCost, (trainerCost) => trainerCost.trainer)
  cost: TrainerCost[];

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => BatchEntity, (batchEntity) => batchEntity.trainer)
  batch: BatchEntity[];

  @OneToMany(() => TrainerQuery, (trainerQuery) => trainerQuery.trainer)
  trainerQuery: TrainerQuery[];

  @OneToMany(() => TrainerInvoice, (trainerInvoice) => trainerInvoice.trainer)
  trainerInvoice: TrainerQuery[];

  @Column({ nullable: true })
  gstNumber: string;
}
