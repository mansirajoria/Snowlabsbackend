import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { MockTestController } from './mockTest.controller';
import { MockTestService } from './mockTest.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockTestCategory } from './entities/mock-test-category.entity';
import { MockTest } from './entities/mock-test.entity';
import { MockTestQuestionEntity } from './entities/mock-test-question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MockTest,
      MockTestCategory,

      MockTestQuestionEntity,
    ]),
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [MockTestController],
  providers: [MockTestService],
})
export class MockTestModule {}
