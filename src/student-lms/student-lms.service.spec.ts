import { Test, TestingModule } from '@nestjs/testing';
import { StudentLmsService } from './student-lms.service';

describe('StudentLmsService', () => {
  let service: StudentLmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentLmsService],
    }).compile();

    service = module.get<StudentLmsService>(StudentLmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
