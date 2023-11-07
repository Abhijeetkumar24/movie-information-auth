import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants/constant';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Session, SessionSchema } from 'src/schemas/session.schema';

@Module({
  imports: [

    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Session.name, schema: SessionSchema }
      ]
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
