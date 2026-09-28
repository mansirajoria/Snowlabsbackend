import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { SkillCategory } from './skill-category.entity';
import { TrainerSkills } from '@trainer/entities/trainer-skill.entity';
// import { Course } from '@courses/entities/course.entity';

@Entity('skill')
export class Skill extends BaseEntity {
  @ManyToOne(
    () => SkillCategory,
    (skillCategoryEntity) => skillCategoryEntity.id,
  )
  skillCategory: SkillCategory;

  @OneToMany(
    () => TrainerSkills,
    (trainerSkillsEntity) => trainerSkillsEntity.skill,
  )
  trainerSkill: TrainerSkills[];

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @OneToOne(() => TrainerSkills)
  tariner: TrainerSkills;
}
