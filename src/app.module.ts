import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/constant';



@Module({
  imports: [
    AuthModule,

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL
      }),
    }),

    CacheModule.register({ isGlobal: true }),

    JwtModule.register({            
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
