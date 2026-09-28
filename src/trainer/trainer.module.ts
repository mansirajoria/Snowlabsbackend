import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerService } from '@trainer/trainer.service';
import { TrainerController } from '@trainer/trainer.controller';
import { Trainer } from '@trainer/entities/trainer.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { TrainerSkills } from '@trainer/entities/trainer-skill.entity';
import { SkillsService } from '@skills/skills.service';
import { Skill } from '@skills/entities/skill.entity';
import { SkillCategory } from '@skills/entities/skill-category.entity';
import { MailModule } from '@mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Notifications } from '@notifications/entities/notifications.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { TrainerCost } from './entities/trainer-cost.entity';
import { TrainerInvoice } from '@trainer_lms/entities/trainer-invoice.entity';
import { Payment } from '@payment/entities/payment.entity';
import { Session } from 'inspector';
import { SessionEntity } from '@session/entities/session.entity';
import { Webinar } from '@webinars/entities/webinar.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trainer,
      AuthEntity,
      TrainerSkills,
      Skill,
      SkillCategory,
      Enrollment,
      BatchEntity,
      Notifications,
      TrainerCost,
      TrainerInvoice,
      Payment,
      SessionEntity,
      Webinar,
    ]),
    MailModule,
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
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [TrainerController],
  providers: [TrainerService, SkillsService],
  exports: [TrainerService],
})
export class TrainerModule {}
