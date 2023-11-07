import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
// import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/constant';



@Module({
  imports: [
    AuthModule,

    MongooseModule.forRoot('mongodb+srv://Abhijeet:abhijeet@cluster0.dh4tila.mongodb.net/sample_mflix'),

    CacheModule.register({ isGlobal: true }),

    JwtModule.register({            // registering out jwt constants as global
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '30m' },
    }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
