import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Delete,
  Inject,
} from '@nestjs/common';
import { SkillsService } from '@skills/skills.service';
import { CACHE_MANAGER } from '@nestjs/common';
import { CreateSkillCategoryDto } from '@skills/dto/create-skill-category.dto';
import { CreateSkillDto } from '@skills/dto/create-skill.dto';
import ResponseHandler from '@utils/response.handler';
import { ApiTags } from '@nestjs/swagger';
import { Cache } from 'cache-manager';

@Controller('skills')
@ApiTags('Skills-Controller')
export class SkillsController extends ResponseHandler {
  constructor(
    private readonly skillsService: SkillsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  /*
   * Skill CRUD
   */

  @Post('')
  async createSkill(@Body() payload: CreateSkillDto) {
      const skill = await this.skillsService.createSkill(payload);
      return this.sendSuccessResponse(skill, 'Skill created');
  }

  @Get('skill/:id')
  async findSkill(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const cacheKey = `skill_${id}`;

      // Retrieve data from cache
      const cachedSkill = await this.cacheManager.get(cacheKey);
      if (cachedSkill) {
        return this.sendSuccessResponse(
          JSON.parse(cachedSkill as string),
          'Skill fetched from cache',
        );
      }
      const skill = await this.skillsService.findSkill(id);
      await this.cacheManager.set(cacheKey, JSON.stringify(skill));
      return this.sendSuccessResponse(skill, 'Skill fetched');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Get('')
  async findAllSkill() {
    try {
      const cacheKey = 'skill_all';
      const cachedSkill = await this.cacheManager.get(cacheKey);
      if (cachedSkill) {
        return this.sendSuccessResponse(
          cachedSkill,
          'Skill fetched from cache',
        );
      }
      const skills = await this.skillsService.findAllSkill();
      await this.cacheManager.set(cacheKey, skills);
      return this.sendSuccessResponse(skills, 'Skill  fetched');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Delete(':id')
  async removeSkill(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.skillsService.removeSkill(id);
      return this.sendSuccessResponse({}, 'Skill removed');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  /*
   * Skill-Category CRUD
   */

  @Post('category')
  async createSkillCategory(@Body() payload: CreateSkillCategoryDto) {
    try {
      const skillCategory = this.skillsService.createSkillCategory(payload);
      return this.sendSuccessResponse(skillCategory, 'Skill Category created');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Get('category')
  async findAllSkillCategory() {
    try {
      const cacheKey = 'skill_category_all';
      const cachedSkill = await this.cacheManager.get(cacheKey);
      if (cachedSkill) {
        return this.sendSuccessResponse(
          cachedSkill,
          'Skill categories fetched from cache',
        );
      }
      const skillCategories = await this.skillsService.findAllSkillCategory();
      await this.cacheManager.set(cacheKey, skillCategories);
      return this.sendSuccessResponse(
        skillCategories,
        'Skill categories fetched',
      );
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Get('category/:id')
  async findSkillCategory(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const skillCategory = await this.skillsService.findSkillCategory(id);
      return this.sendSuccessResponse(skillCategory, 'Skill category fetched');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  @Delete('category/:id')
  async removeSkillCategory(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.skillsService.removeSkillCategory(id);
      return this.sendSuccessResponse({}, 'Skill category removed');
    } catch (error) {
      return this.sendFailedResponse({ error }, 'Server Error');
    }
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
  //   return this.skillsService.update(+id, updateSkillDto);
  // }
}
