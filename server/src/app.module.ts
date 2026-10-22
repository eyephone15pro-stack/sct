import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CarAgentModule } from './car-agent/car-agent.module.js';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [ LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'debug',

        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
          },
        },
      },
    }),CarAgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
