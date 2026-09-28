import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '@students/entities/student.entity';
import { Course } from '@courses/entities/course.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { Blog } from '@blogs/entities/blog.entity';
import { MockTest } from 'mockTest/entities/mock-test.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { AnalyticsModule } from 'analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Course,
      Trainer,
      BatchEntity,
      Webinar,
      Blog,
      MockTest,
      Enrollment,
    ]),
    AnalyticsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
