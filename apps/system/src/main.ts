import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SystemModule } from './system.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SystemModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.API_SERVER_URL,
        port: +process.env.PORT,
      },
    },
  );
  await app.listen();
}
bootstrap();
