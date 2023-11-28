import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Session, SessionSchema } from 'src/schemas/session.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [

    ConfigModule.forRoot({}),
    
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Session.name, schema: SessionSchema }
      ]
    ),

    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.NODEMAILER_HOST,
          auth: {
            
            user: process.env.GMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,

          },
        },
      }),
    }),

  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
