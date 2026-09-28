import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { UploadsModule } from 'uploads/uploads.module';
import { Currilculum } from './entities/curriculum.entity';
import { FAQ } from '@faq/entities/faq.entity';
import { BatchEntity } from 'batch/entities/batch.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { TrainingPlan } from '@training-plans/entities/training-plan.entity';
import { Blog } from '@blogs/entities/blog.entity';
import { BlogCategory } from '@blogs/entities/blog-category.entity';
import { BatchModule } from '@batch/batch.module';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { IndustryTrends } from './entities/industry-trends.entity';
import { CategoryStats } from './entities/category-stats.entity';
import { SequentialIdGenerator } from '@utils/sequence-generator/id-generator.service';
import { Certificate } from './entities/certificate.entity';
import { CredentialEntity } from 'credential/entities/credential.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Student,
      CourseCategory,
      Currilculum,
      FAQ,
      TrainingPlan,
      BatchEntity,
      Trainer,
      Blog,
      BlogCategory,
      Enrollment,
      IndustryTrends,
      CategoryStats,
      Certificate,
      CredentialEntity,
    ]),
    UploadsModule,
    BatchModule,
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    {
      provide: SequentialIdGenerator,
      useValue: new SequentialIdGenerator(),
    },
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
