import { Test, TestingModule } from '@nestjs/testing';
import { TrainerLmsService } from './trainer-lms.service';

describe('TrainerLmsService', () => {
  let service: TrainerLmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainerLmsService],
    }).compile();

    service = module.get<TrainerLmsService>(TrainerLmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
