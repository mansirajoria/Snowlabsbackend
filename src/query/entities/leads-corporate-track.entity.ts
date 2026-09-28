import { SkillCategory } from '@skills/entities/skill-category.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import {
  LeadTrainerStatus,
  LeadsStatus,
  TechCallEnum,
  TrainerCostType,
} from '@utils/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CorporateLead } from './leads-corporate.entity';

@Entity('lead-corporate-track')
export class CorporateTrack {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => CorporateLead)
  lead: CorporateLead;

  @Column({ type: 'enum', enum: LeadsStatus })
  status: LeadsStatus;

  @Column({ nullable: true })
  comments: string;

  @CreateDateColumn()
  createdDate: string;

  @Column({
    type: 'enum',
    enum: LeadTrainerStatus,
    nullable: true,
  })
  trainerStatus: LeadTrainerStatus;

  @ManyToOne(() => SkillCategory, { nullable: true })
  requiredSkillCategory: SkillCategory;

  @ManyToOne(() => Trainer, { nullable: true })
  trainer: Trainer;

  @Column({ nullable: true })
  trainerCost: number;

  @Column({ type: 'enum', enum: TrainerCostType, nullable: true })
  trainerCostType: TrainerCostType;

  @Column({ nullable: true })
  trainerCostToClient: number;

  @Column({ type: 'enum', enum: TrainerCostType, nullable: true })
  trainerCostTypeClient: TrainerCostType;

  @Column({ type: 'enum', enum: TechCallEnum, nullable: true })
  techCall: TechCallEnum;
}
