import { Test, TestingModule } from '@nestjs/testing';
import { CarAgentService } from './car-agent.service.js';

describe('CarAgentService', () => {
  let service: CarAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarAgentService],
    }).compile();

    service = module.get<CarAgentService>(CarAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
