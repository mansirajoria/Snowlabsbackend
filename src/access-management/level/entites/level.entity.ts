import { LevelPermission } from '@access/level/entites/level-permission.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';

@Entity('level')
export class Level {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(
    () => LevelPermission,
    (levelPermissionEntity) => levelPermissionEntity.level,
  )
  levelPermission: LevelPermission[];

  @OneToMany(() => SubAdmin, (subAdminEntity) => subAdminEntity.level)
  subAdmin: SubAdmin[];
}
