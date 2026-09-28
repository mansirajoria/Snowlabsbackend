import { Test, TestingModule } from '@nestjs/testing';
import { StudentLmsController } from './student-lms.controller';
import { StudentLmsService } from './student-lms.service';

describe('StudentLmsController', () => {
  let controller: StudentLmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentLmsController],
      providers: [StudentLmsService],
    }).compile();

    controller = module.get<StudentLmsController>(StudentLmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
