import { Module } from '@nestjs/common';
import { CarAgentController } from './car-agent.controller.js';
import { CarAgentService } from './car-agent.service.js';

@Module({
  controllers: [CarAgentController],
  providers: [CarAgentService]
})
export class CarAgentModule {}
