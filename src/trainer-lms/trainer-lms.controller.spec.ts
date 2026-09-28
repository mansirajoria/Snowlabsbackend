import { Test, TestingModule } from '@nestjs/testing';
import { TrainerLmsController } from './trainer-lms.controller';
import { TrainerLmsService } from './trainer-lms.service';

describe('TrainerLmsController', () => {
  let controller: TrainerLmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainerLmsController],
      providers: [TrainerLmsService],
    }).compile();

    controller = module.get<TrainerLmsController>(TrainerLmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
