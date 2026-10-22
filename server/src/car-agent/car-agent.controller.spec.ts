import { Test, TestingModule } from '@nestjs/testing';
import { CarAgentController } from './car-agent.controller.js';

describe('CarAgentController', () => {
  let controller: CarAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarAgentController],
    }).compile();

    controller = module.get<CarAgentController>(CarAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
