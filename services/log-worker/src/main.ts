import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const port = Number(process.env.LOG_WORKER_PORT ?? 3002);
  await app.listen(port, '0.0.0.0');
  Logger.log(`log-worker listening on :${port}`, 'Bootstrap');
}

bootstrap();
