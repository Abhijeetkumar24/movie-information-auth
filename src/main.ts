import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices'


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: process.env.AUTH_GRPC_URL ,
      package: process.env.AUTH_PACKAGE,
      protoPath: process.env.AUTH_PROTO_PATH,
    },
  });
  
  await app.startAllMicroservices();
  await app.listen(process.env.PORT);
}
bootstrap();
