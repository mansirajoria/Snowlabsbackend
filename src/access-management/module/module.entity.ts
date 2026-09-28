import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';
import { LevelPermission } from '@access/level/entites/level-permission.entity';

@Entity('module')
export class ModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'description' })
  description: string;

  @OneToMany(
    () => LevelPermission,
    (levelPermissionEntity) => levelPermissionEntity.id,
  )
  levelPermission: LevelPermission[];
}
