import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from '@skills/skills.service';
import { SkillsController } from '@skills/skills.controller';
import { Skill } from '@skills/entities/skill.entity';
import { SkillCategory } from '@skills/entities/skill-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, SkillCategory]),
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
