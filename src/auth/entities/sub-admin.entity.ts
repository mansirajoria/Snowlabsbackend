import { BaseEntity } from '@utils/base.entity';
import {
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { Level } from '@access/level/entites/level.entity';

@Entity('sub-admin')
export class SubAdmin extends BaseEntity {
  @OneToOne(() => AuthEntity)
  @JoinColumn()
  auth: AuthEntity;

  @ManyToOne(() => Level, (levelEntity) => levelEntity.id)
  level: Level;

  @DeleteDateColumn()
  deletedAt?: Date;
}
