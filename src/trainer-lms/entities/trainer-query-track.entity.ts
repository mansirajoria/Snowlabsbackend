import { TrainerQueryStatus } from '@utils/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainerQuery } from './trainer-query.entity';

@Entity('trainer-query-track')
export class TrainerQueryTrack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TrainerQueryStatus,
    default: TrainerQueryStatus.NEW,
  })
  status: TrainerQueryStatus;

  @Column({ nullable: true })
  comments: string;

  @ManyToOne(
    () => TrainerQuery,
    (trainerQuery) => trainerQuery.trainerQueryTrack,
  )
  trainerQuery: TrainerQuery;

  @CreateDateColumn()
  createdAt: string;
}
