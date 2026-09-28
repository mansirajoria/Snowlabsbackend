import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { WebinarsService } from './webinars.service';
import { WebinarsController } from './webinars.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webinar } from './entities/webinar.entity';
import { WebinarEnrollment } from './entities/webinar-enrollments.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { Student } from '@students/entities/student.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { WebinarCategory } from './entities/webinar-category.entity';
import { MicrosoftTeamModule } from 'microsoft-team/microsoft-team.module';
import { CredentialEntity } from 'credential/entities/credential.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { MailModule } from '@mail/mail.module';
import { BatchEntity } from '@batch/entities/batch.entity';
import { SessionEntity } from '@session/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Webinar,
      WebinarEnrollment,
      Trainer,
      Student,
      AuthEntity,
      WebinarCategory,
      CredentialEntity,
      BatchEntity,
      SessionEntity,
    ]),
    MicrosoftTeamModule,
    NotificationsModule,
    MailModule,
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [WebinarsController],
  providers: [WebinarsService],
})
export class WebinarsModule {}
