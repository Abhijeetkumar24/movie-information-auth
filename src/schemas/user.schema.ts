
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/interfaces/enum';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  role: Role[]
}

export const UserSchema = SchemaFactory.createForClass(User);