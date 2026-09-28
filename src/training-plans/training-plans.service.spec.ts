import { Test, TestingModule } from '@nestjs/testing';
import { TrainingPlansService } from './training-plans.service';

describe('TrainingPlansService', () => {
  let service: TrainingPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingPlansService],
    }).compile();

    service = module.get<TrainingPlansService>(TrainingPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
