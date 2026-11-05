import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { it } from 'node:test';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

function expect(service: AnalyticsService) {
  return {
    toBeDefined() {
      if (service === undefined || service === null) {
        throw new Error('Expected service to be defined.');
      }
    },
  };
}
