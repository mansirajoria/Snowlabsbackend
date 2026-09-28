import { Module } from '@nestjs/common';
import { TrainerLmsService } from './trainer-lms.service';
import { TrainerLmsController } from './trainer-lms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from '@trainer/entities/trainer.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { MailModule } from '@mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrainerQuery } from '@trainer_lms/entities/trainer-query.entity';
import { TrainerQueryTrack } from '@trainer_lms/entities/trainer-query-track.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { TrainerInvoice } from './entities/trainer-invoice.entity';
import { TrainerInvoiceTrack } from './entities/trainer-invoice-track.entity';
import { TrainerModule } from '@trainer/trainer.module';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Course } from '@courses/entities/course.entity';
import { BatchModule } from '@batch/batch.module';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';
import { SessionModule } from 'session/session.module';
import { ResourcesModule } from 'resources/resources.module';
import { AssignmentModule } from 'assignment-submission/assignment.module';
import { NotificationsModule } from 'notifications/notifications.module';
import { SessionEntity } from '@session/entities/session.entity';
import { Payment } from '@payment/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthEntity,
      Trainer,
      TrainerQuery,
      TrainerQueryTrack,
      Webinar,
      TrainerInvoice,
      TrainerInvoiceTrack,
      BatchEntity,
      Course,
      WebinarEnrollment,
      SessionEntity,
      Payment,
    ]),
    MailModule,
    TrainerModule,
    BatchModule,
    SessionModule,
    ResourcesModule,
    AssignmentModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
  ],
  controllers: [TrainerLmsController],
  providers: [TrainerLmsService],
})
export class TrainerLmsModule {}
