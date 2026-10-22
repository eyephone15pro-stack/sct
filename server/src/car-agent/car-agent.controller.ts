import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { CarAgentService } from './car-agent.service.js';

@Controller('agent')
export class CarAgentController {
  constructor(private readonly agent: CarAgentService) {}

  @Post('chat')
  chat(@Body() body: { message: string; threadId?: string }) {
    if (!body?.message?.trim()) throw new BadRequestException('message is required');
    return this.agent.chat(body.message, body.threadId);
  }

  @Post('predict')
  predict(@Body() car: any) {
    return this.agent.predict(car);
  }
}