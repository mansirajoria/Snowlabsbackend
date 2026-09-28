import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from '@access/dtos/create-level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '@access/level/entites/level.entity';
import { LevelPermission } from '@access/level/entites/level-permission.entity';
import { ModuleEntity } from '@access/module/module.entity';
import { UpdateLevelDto } from '@access/dtos/update-level.dto';
import HttpException from '@utils/exceptions/HttpException';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(Level) private levelRepo: Repository<Level>,
    @InjectRepository(ModuleEntity)
    private moduleRepo: Repository<ModuleEntity>,
    @InjectRepository(LevelPermission)
    private levelPermissionRepo: Repository<LevelPermission>,
  ) {}

  /*
   * Create New level with come Access writes
   */

  async create(createLevelDto: CreateLevelDto) {
    const levelCheck = await this.levelRepo.findOne({
      where: { name: createLevelDto.name },
    });

    if (levelCheck) throw new HttpException(400, 'Level Already Exists');

    const level = new Level();
    level.name = createLevelDto.name;

    const levelCreated = await this.levelRepo.save(level);

    createLevelDto?.levelPermission.forEach(async (p) => {
      const findModule = await this.moduleRepo.findOne({
        where: { id: p.moduleId },
      });

      if (!findModule) throw new HttpException(404, `Module not found`);

      const levelPermission = new LevelPermission();

      levelPermission.level = levelCreated;
      levelPermission.module = findModule;
      levelPermission.read = p.read;
      levelPermission.write = p.write;

      await this.levelPermissionRepo.save(levelPermission);
    });

    return levelCreated;
  }

  async findAll() {
    return this.levelRepo.find();
  }

  async findAllWithAccess() {
    const resp = await this.levelRepo
      .createQueryBuilder('qb')
      .innerJoinAndSelect('qb.levelPermission', 'qblp')
      .innerJoinAndSelect('qblp.module', 'qblpm')
      .orderBy('qb.name', 'ASC')
      .getMany();

    function arrangeThings(arr: any) {
      const finalData = [];
      arr.map((el: any) => {
        const lp = [];
        el.levelPermission.forEach((i: any) => {
          lp.push({
            moduleId: i.module.id,
            moduleName: i.module.name,
            read: i.read,
            write: i.write,
          });
        });
        finalData.push({ id: el.id, name: el.name, levelPermission: lp });
      });
      const sortedData = finalData.sort(
        (a, b) => a.name.split(' ')[1] - b.name.split(' ')[1],
      );
      return sortedData;
    }

    const newResp = arrangeThings(resp);

    return newResp;
  }

  async findOne(id: string): Promise<Level> {
    return this.levelRepo.findOne({
      where: { id },
      relations: ['levelPermission', 'levelPermission.module'],
    });
  }

  /*
   *  Update level - access rights
   */

  async update(payload: UpdateLevelDto) {
    const findLevel = await this.levelRepo.findOne({
      where: { id: payload.levelId },
    });

    if (!findLevel) throw new HttpException(404, `Permission Level not found`);

    const findLevelPermisson = await this.levelPermissionRepo
      .createQueryBuilder('qb')
      .innerJoinAndSelect('qb.level', 'qbl')
      .andWhere('qbl.id = :lid', { lid: findLevel.id })
      .getMany();

    // now we need to delete all of the LP

    if (findLevelPermisson.length > 0) {
      findLevelPermisson.forEach(async (k) => {
        await this.levelPermissionRepo.delete(k.id);
      });
    }

    payload.levelPermission?.forEach(async (p) => {
      // now we need to all the new permission
      const findModule = await this.moduleRepo.findOne({
        where: { id: p.moduleId },
      });

      if (!findModule) throw new HttpException(404, `Module not found`);

      const levelPermission = new LevelPermission();

      levelPermission.level = findLevel;
      levelPermission.module = findModule;
      levelPermission.read = p.read;
      levelPermission.write = p.write;

      await this.levelPermissionRepo.save(levelPermission);
    });
    return true;
  }
}
