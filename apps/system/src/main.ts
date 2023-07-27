import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SystemModule } from './system.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SystemModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
