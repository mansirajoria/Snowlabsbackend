import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '@skills/entities/skill.entity';
import { SkillCategory } from '@skills/entities/skill-category.entity';
import { CreateSkillDto } from '@skills/dto/create-skill.dto';
import { CreateSkillCategoryDto } from '@skills/dto/create-skill-category.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(SkillCategory)
    private skillCategoryRepo: Repository<SkillCategory>,
  ) {}

  /*
   * Skill CRUD
   */

  async createSkill(payload: CreateSkillDto) {
      const existingSkill = await this.skillRepo
          .createQueryBuilder('skill')
          .where('LOWER(skill.name) = LOWER(:name)', { name: payload.name })
          .andWhere('skill.skillCategoryId = :categoryId', { categoryId: payload.skillCategory })
          .getOne();
      if (existingSkill) {
        throw new HttpException('Skill already exists in this category', HttpStatus.BAD_REQUEST);
      }
      const skill = new Skill();
  
      skill.name = payload.name;
      skill.description = payload?.description;
  
      const findSkillCategory = await this.findSkillCategory(payload.skillCategory);
      skill.skillCategory = findSkillCategory;
  
      const skillCreate = this.skillRepo.create(skill);
      return await this.skillRepo.save(skillCreate);
  }

  async findSkill(id: string) {
    return await this.skillRepo.findOne({
      where: { id },
      relations: { skillCategory: true, trainerSkill: true },
    });
  }

  async findAllSkill() {
    return await this.skillRepo.find();
  }

  async removeSkill(id: string) {
    return await this.skillRepo.delete(id);
  }

  /*
   * Skill-Category CRUD
   */

  async createSkillCategory(payload: CreateSkillCategoryDto) {
    const skillCategory = this.skillCategoryRepo.create(payload);
    return await this.skillCategoryRepo.save(skillCategory);
  }

  async findSkillCategory(id: string) {
    return await this.skillCategoryRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id })
      .leftJoinAndMapMany(
        'qb.skill',
        Skill,
        'skill',
        'qb.id = skill.skillCategoryId',
      )
      .getOne();
  }

  async findAllSkillCategory() {
    return await this.skillCategoryRepo
      .createQueryBuilder('qb')
      .leftJoinAndMapMany(
        'qb.skill',
        Skill,
        'skill',
        'qb.id = skill.skillCategoryId',
      )
      .getMany();
  }

  async removeSkillCategory(id: string) {
    return await this.skillCategoryRepo.delete(id);
  }
}
