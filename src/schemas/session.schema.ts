
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema()
export class Session {

  @Prop()
  userId: string;

  @Prop()
  isActive: Boolean;

  @Prop()
  deviceId: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);