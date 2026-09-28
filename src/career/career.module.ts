import { Module } from '@nestjs/common';
import { CareerService } from './career.service';
import { CareerController } from './career.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerCategory } from './entities/career-category.entity';
import { Career } from './entities/career.entity';
import { Applicant } from './entities/applicant.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CareerCategory, Career, Applicant, AuthEntity]),NotificationsModule
  ],
  controllers: [CareerController],
  providers: [CareerService],
})
export class CareerModule {}
