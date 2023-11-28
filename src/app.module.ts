import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [

    ConfigModule.forRoot({}),

    AuthModule,

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL
      }),
    }),

    CacheModule.register({ isGlobal: true }),

    JwtModule.register({            
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
