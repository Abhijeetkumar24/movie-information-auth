import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Mongoose } from 'mongoose';
import { Hero, HeroById } from 'src/interfaces/hero.interface';
import { Credentials, GuardResponse, Token, TokenResponse } from 'src/interfaces/auth.interface';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExceptionMessage, HttpStatusMessage, SuccessMessage } from '../interfaces/enum'
import { CustomException } from 'src/utils/exception.util';
import { Session } from 'src/schemas/session.schema';
import { jwtConstants } from 'src/constants/constant';
import { Types } from 'mongoose';


@Controller('auth')
export class AuthController {

    constructor(
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(Session.name) private SessionModel: Model<Session>,
    ) { }

    @GrpcMethod('HeroesService', 'FindOne')
    findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
        console.log("hii 2")
        const items = [
            { id: 1, name: 'John' },
            { id: 2, name: 'Doe' },
        ];
        return items.find(({ id }) => id === data.id);
    }


    @GrpcMethod('AuthService', 'GetToken')
    async getToken(payload: Credentials, metadata: Metadata, call: ServerUnaryCall<any, any>): Promise<TokenResponse> {
        try {
            const email = payload.email;

            const user = await this.UserModel.findOne({ email });
            console.log("id :", user._id)

            if (user) {
                const isMatch = await bcrypt.compare(payload.password, user.password);

                if (!isMatch) {
                    return { message: ExceptionMessage.INVALID_PASSWORD, status: HttpStatusMessage.BAD_GATEWAY, token: "" };
                }
                let redisSession = await this.cacheManager.get(`${user._id}`);
                console.log("red: ", redisSession)
                if (!redisSession) {
                    console.log("hii 11")
                    let dataSession = await this.SessionModel.findOne(
                        {
                            userId: user._id,
                            isActive: true,
                            deviceId: payload.deviceId,
                        },
                        {}
                    );
                    if (!(dataSession == null)) {
                        console.log("hii 22")

                        await this.cacheManager.set(
                            `${user._id}`,
                            `${payload.deviceId}`,
                        );
                    } else {
                        console.log("hii 33")
                        let deviceId = payload.deviceId;
                        await this.SessionModel.updateMany(
                            {
                                userId: user._id,
                                isActive: true,
                            },
                            {
                                $set: {
                                    isActive: false,
                                },
                            },
                            {}
                        );
                        new this.SessionModel({
                            userId: user._id,
                            isActive: true,
                            deviceId: payload.deviceId,
                        }).save();

                        await this.cacheManager.set(
                            `${user._id}`,
                            `${payload.deviceId}`,
                        );
                    }
                } else if (redisSession != payload.deviceId) {
                    console.log("hii 44")
                    let deviceId = payload.deviceId;
                    await this.SessionModel.updateMany(
                        {
                            userId: user._id,
                            isActive: true,
                        },
                        {
                            $set: {
                                isActive: false,
                            },
                        },
                        {}
                    );
                    new this.SessionModel({
                        userId: user._id,
                        isActive: true,
                        deviceId: payload.deviceId,
                    }).save();
                    await this.cacheManager.set(
                        `${user._id}`,
                        `${payload.deviceId}`,
                    );
                }
                const jwtPayload = { sub: user._id, email: user.email, deviceId: payload.deviceId, role: user.role };
                const access_token = await this.jwtService.signAsync(jwtPayload);
                return {
                    message: SuccessMessage.USER_LOGIN_SUCCESS,
                    status: HttpStatusMessage.OK,
                    token: access_token
                };
            } else {
                return { message: ExceptionMessage.EMAIL_NOT_EXISTS, status: HttpStatusMessage.BAD_REQUEST, token: "", };
            }
        } catch (error) {
            throw error;
        }
    }


    @GrpcMethod('AuthService', 'Guard')
    async guard(payload: Token, metadata: Metadata, call: ServerUnaryCall<any, any>): Promise<GuardResponse> {
        try {
            console.log("hii 1")
            const token = payload.token;
            const decodeData = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );
            console.log("dec: ", decodeData)

            let redisSessionData = await this.cacheManager.get(decodeData.sub)

            if (redisSessionData == decodeData.deviceId) {
                console.log("hii 2")

                return { valid: true, userId: decodeData.sub, role: decodeData.role };

            } else {
                let sessionData = await this.SessionModel.findOne({
                    deviceId: decodeData.deviceId,
                    userId: decodeData.sub,
                    isActive: true,
                }, { _id: 1 })
                if (sessionData) {
                    await this.cacheManager.set(decodeData.sub, decodeData.deviceId);
                    console.log("hii 3")

                    return { valid: true, userId: decodeData.sub, role: decodeData.role };

                } else {
                    console.log("hii 4")


                    return { valid: false, userId: null , role:null};
                    // throw new CustomException(ExceptionMessage.UNAUTHORIZED, HttpStatusMessage.UNAUTHORIZED)
                }

            }
        }
        catch (error) {
            console.log("hii 5")
            return { valid: false, userId: null, role: null };
        }
    }

}
