import { Test, TestingModule } from '@nestjs/testing';
import { TrainingPlansController } from './training-plans.controller';
import { TrainingPlansService } from './training-plans.service';

describe('TrainingPlansController', () => {
  let controller: TrainingPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingPlansController],
      providers: [TrainingPlansService],
    }).compile();

    controller = module.get<TrainingPlansController>(TrainingPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
