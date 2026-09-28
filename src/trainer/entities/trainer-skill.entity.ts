import { Column, Entity, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Skill } from '@skills/entities/skill.entity';
import { BaseEntity } from '@utils/base.entity';
import { Trainer } from './trainer.entity';

@Entity('trainer-skills')
export class TrainerSkills extends BaseEntity {
  @ManyToOne(() => Skill, (skillEntity) => skillEntity.id)
  skill: Skill;

  @ManyToOne(() => Trainer, (trainerEntity) => trainerEntity.trainerSkills)
  trainer: Trainer;

  @Column({ name: 'rating', nullable: true })
  rating: string;

  // @Column({ name: 'commerce', nullable: true })
  // commerce: string;

  @Column({ name: 'toc', nullable: true })
  toc: string;

  @Column({ name: 'isActive', default: false })
  isActive: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;
}
