import { Test, TestingModule } from '@nestjs/testing';
import { LeadsquareService } from './leadsquare.service';

describe('LeadsquareService', () => {
  let service: LeadsquareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadsquareService],
    }).compile();

    service = module.get<LeadsquareService>(LeadsquareService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
