import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialEntity } from 'credential/entities/credential.entity';
import * as fs from 'fs';
import { Repository } from 'typeorm';

@Injectable()
export class SequentialIdGenerator {
  private lastId: number;

  constructor() {}

  async generateUniqueId(
    credentialRepo: Repository<CredentialEntity>,
  ): Promise<string> {
    const credential = await credentialRepo.findOne({
      where: { type: 'lastid' },
    });
    this.lastId = credential.value;
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const id = `${year}${month}${++this.lastId}`; // Increment lastId and append year and month
    credential.value = this.lastId;
    await credentialRepo.save(credential);
    return id;
  }
}
