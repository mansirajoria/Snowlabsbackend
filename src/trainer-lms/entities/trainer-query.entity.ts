import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import { TrainerQueryCategory } from '@utils/enum';
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TrainerQueryTrack } from './trainer-query-track.entity';
import { Exclude } from 'class-transformer';

@Entity('trainer-query')
export class TrainerQuery extends BaseEntity {
  @Column({ nullable: true })
  queryId: string;

  @Column({ nullable: true })
  query: string;

  @Column({ nullable: true })
  status: string; // show only for trainer lms

  @Column({ type: 'enum', enum: TrainerQueryCategory })
  queryCategory: TrainerQueryCategory; // query type

  @ManyToOne(() => Trainer, (trainer) => trainer.trainerQuery)
  trainer: Trainer;

  @OneToMany(
    () => TrainerQueryTrack,
    (trainerQueryTrack) => trainerQueryTrack.trainerQuery,
    { cascade: ['insert', 'update'] },
  )
  trainerQueryTrack: TrainerQueryTrack[];

  @Column({ type: 'boolean', default: false })
  isOpened: boolean;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;
}
