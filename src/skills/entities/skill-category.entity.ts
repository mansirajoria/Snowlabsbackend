import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Skill } from './skill.entity';

@Entity('skill-category')
export class SkillCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @OneToMany(() => Skill, (skillEntity) => skillEntity.id)
  skill: Skill[];
}
