import { Test, TestingModule } from '@nestjs/testing';
import { TrainerService } from './trainer.service';

describe('TrainerService', () => {
  let service: TrainerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainerService],
    }).compile();

    service = module.get<TrainerService>(TrainerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
