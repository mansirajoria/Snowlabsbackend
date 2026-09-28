import { Module } from '@nestjs/common';
import { RoiController } from './roi.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '@payment/entities/payment.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Course } from '@courses/entities/course.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { RoiService } from './roi.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Webinar, Course, BatchEntity])],
  controllers: [RoiController],
  providers: [RoiService],
})
export class RoiModule {}
