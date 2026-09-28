import { Test, TestingModule } from '@nestjs/testing';
import { WebinarsService } from './webinars.service';

describe('WebinarsService', () => {
  let service: WebinarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebinarsService],
    }).compile();

    service = module.get<WebinarsService>(WebinarsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
