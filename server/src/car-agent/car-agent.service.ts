import { Injectable } from '@nestjs/common';
import { callPredict, Car } from '../utils/car-agent.tools.js';
import { runCarAgent } from '../utils/Car.agent.graph.js';

@Injectable()
export class CarAgentService {
  chat(message: string, threadId?: string) {
    return runCarAgent(message, threadId);
  }
  predict(car: Car) {
    return callPredict(car); // direct path for the form (no LLM)
  }
}