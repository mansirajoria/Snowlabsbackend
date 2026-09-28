import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { CoursesModule } from '@courses/courses.module';
import { BlogCategory } from './entities/blog-category.entity';
import { Course } from '@courses/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, BlogCategory, Course]),
    CoursesModule,
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
