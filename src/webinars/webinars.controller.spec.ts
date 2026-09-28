import { Test, TestingModule } from '@nestjs/testing';
import { WebinarsController } from './webinars.controller';
import { WebinarsService } from './webinars.service';

describe('WebinarsController', () => {
  let controller: WebinarsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebinarsController],
      providers: [WebinarsService],
    }).compile();

    controller = module.get<WebinarsController>(WebinarsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
