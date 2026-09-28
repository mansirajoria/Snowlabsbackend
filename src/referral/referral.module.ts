import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { MailModule } from '@mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, AuthEntity]), MailModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
