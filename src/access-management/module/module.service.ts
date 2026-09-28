import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateModuleDto } from '@access/dtos/create-module.dto';
import { ModuleEntity } from '@access/module/module.entity';

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(ModuleEntity)
    private moduleRepo: Repository<ModuleEntity>,
  ) {}

  async create(createModuleDto: CreateModuleDto) {
    const createModule = this.moduleRepo.create(createModuleDto);
    const saveModule = await this.moduleRepo.save(createModule);
    return saveModule;
  }

  async findAll() {
    return this.moduleRepo.find();
  }

  findOne(id: string) {
    return this.moduleRepo.findOne({ where: { id } });
  }

  // update(id: number, updateModuleDto: UpdateModuleDto) {
  //   return `This action updates a #${id} module`;
  // }
  // remove(id: number) {
  //   return `This action removes a #${id} module`;
  // }
}
