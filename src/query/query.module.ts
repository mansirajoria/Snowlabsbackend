import { Module } from '@nestjs/common';
import { QueryService } from './query.service';
import { QueryController } from './query.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leads } from './entities/leads.entity';
import { LeadTrack } from './entities/leads-track.entity';
import { CorporateLead } from './entities/leads-corporate.entity';
import { CorporateTrack } from './entities/leads-corporate-track.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { LeadsquareModule } from 'leadsquare/leadsquare.module';
import { MailService } from '@mail/mail.service';
import { MailModule } from '@mail/mail.module';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from 'aws-sdk';
import { Student } from '@students/entities/student.entity';
import { Helpdesk } from './entities/helpdesk.entity';
import { HelpdeskTrack } from './entities/helpdesk-track.entity';
import { Course } from '@courses/entities/course.entity';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Leads,
      LeadTrack,
      CorporateLead,
      CorporateTrack,
      Course,
      Trainer,
      Student,
      Helpdesk,
      HelpdeskTrack,
    ]),
    LeadsquareModule,
    MailModule,
    HttpModule,
    ConfigModule,
    NotificationsModule
  ],
  controllers: [QueryController],
  providers: [QueryService, MailService],
  exports: [QueryService],
})
export class QueryModule {}
