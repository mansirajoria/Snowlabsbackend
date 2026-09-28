import { Module } from '@nestjs/common';
import { MicrosoftTeamService } from './microsoft-team.service';
import { MicrosoftTeamController } from './microsoft-team.controller';
import { HttpModule } from '@nestjs/axios';
import { UploadsModule } from 'uploads/uploads.module';
import { Trainer } from '@trainer/entities/trainer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '@auth/entities/auth.entity';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { SessionEntity } from '@session/entities/session.entity';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { CredentialModule } from 'credential/credential.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trainer,
      AuthEntity,
      CredentialEntity,
      Webinar,
      SessionEntity,
      ResourceEntity,
      BatchEntity,
    ]),
    UploadsModule,
    HttpModule,
    CredentialModule,
  ],
  controllers: [MicrosoftTeamController],
  providers: [MicrosoftTeamService],
  exports: [MicrosoftTeamService],
})
export class MicrosoftTeamModule {}
