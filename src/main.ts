import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join } from 'path';

async function bootstrap() {
  
  const httpApp = await NestFactory.create(AppModule);
  await httpApp.listen(process.env.PORT);
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:50051' ,
      package: ['auth'],
      protoPath:  [
        join(__dirname, '../../proto/auth.proto'),
      ],
    },
  });

  await app.listen();
}
bootstrap();
