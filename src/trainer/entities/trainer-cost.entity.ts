import { Column, Entity, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Skill } from '@skills/entities/skill.entity';
import { BaseEntity } from '@utils/base.entity';
import { Trainer } from './trainer.entity';
import { TrainerCostType } from '@utils/enum';

@Entity('trainer-cost')
export class TrainerCost extends BaseEntity {
  @ManyToOne(() => Trainer, (trainerEntity) => trainerEntity.cost)
  trainer: Trainer;

  @Column({ type: 'float' })
  inrAmount: number;

  @Column({ type: 'float' })
  dollorAmount: number;

  @Column({ enum: TrainerCostType })
  feesType: TrainerCostType;

  @DeleteDateColumn()
  deletedAt?: Date;
}
