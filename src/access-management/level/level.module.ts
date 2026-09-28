import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { Level } from '@access/level/entites/level.entity';
import { ModuleEntity } from '@access/module/module.entity';
import { LevelPermission } from '@access/level/entites/level-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Level, ModuleEntity, LevelPermission])],
  controllers: [LevelController],
  providers: [LevelService],
})
export class LevelModule {}
