import { Module } from '@nestjs/common';
import { TrainingPlansService } from './training-plans.service';
import { TrainingPlansController } from './training-plans.controller';

@Module({
  controllers: [TrainingPlansController],
  providers: [TrainingPlansService]
})
export class TrainingPlansModule {}
