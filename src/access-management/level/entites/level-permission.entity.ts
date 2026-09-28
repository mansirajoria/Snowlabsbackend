import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Level } from '@access/level/entites/level.entity';
import { ModuleEntity } from '@access/module/module.entity';

@Entity('level-permission')
export class LevelPermission {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => Level, (levelEntity) => levelEntity.id)
  level: Level;

  @ManyToOne(() => ModuleEntity, (moduleEntity) => moduleEntity.id)
  module: ModuleEntity;

  @Column({ type: Boolean })
  read: boolean;

  @Column({ type: Boolean })
  write: boolean;
}
