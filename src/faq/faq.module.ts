import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQ } from './entities/faq.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FAQ]),
    CacheModule.register(), // Import CacheModule
  ],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
