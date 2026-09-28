import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Forum } from './entities/forum.entity';
import { ForumComment } from './entities/forum-comment.entity';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { AuthEntity } from '@auth/entities/auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Forum,
      CourseCategory,
      BatchEntity,
      AuthEntity,
      ForumComment,
      Enrollment,
    ]),
  ],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
