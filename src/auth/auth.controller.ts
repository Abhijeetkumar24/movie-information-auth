import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Mongoose } from 'mongoose';
import { Credentials, GuardResponse, SignupRequest, SignupResponse, Token, TokenResponse, VerificationRequest, VerificationResponse, } from 'src/interfaces/auth.interface';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExceptionMessage, HttpStatusMessage, MSG, SuccessMessage } from '../interfaces/enum'
import { CustomException } from 'src/utils/exception.util';
import { Session } from 'src/schemas/session.schema';
import { jwtConstants } from 'src/constants/constant';
import { Types } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';


@Controller('auth')
export class AuthController {

    constructor(
        private jwtService: JwtService,
        private readonly mailerService: MailerService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(Session.name) private SessionModel: Model<Session>,
    ) { }


    @GrpcMethod('AuthService', 'Signup')
    async signup(payload: SignupRequest): Promise<SignupResponse> {
        try {
            const existingUser = await this.UserModel.findOne({ email: payload.email })
            if (existingUser) {
                return { message: ExceptionMessage.USER_ALREADY_EXIST, status: HttpStatusMessage.CONFLICT };
            }

            const OTP = Math.floor(1000 + Math.random() * 9000);

            await this.cacheManager.set(`${OTP}`, payload.email, 300000)

            await this.cacheManager.set(
                `${payload.email}+${OTP}`,
                payload,
                300000
            );

            const mailOptions = {
                to: payload.email,
                subject: MSG.VERIFICATION_OTP,
                text: MSG.USER_REGISTER + OTP,
            };

            await this.mailerService.sendMail(mailOptions);

            return { message: SuccessMessage.USER_REGISTRATION_MAIL, status: HttpStatusMessage.OK };

        } catch (error) {
            throw error;
        }
    }


    @GrpcMethod('AuthService', 'SignupVerification')
    async signupVerification(payload: VerificationRequest): Promise<VerificationResponse> {
        try {
            const email = await this.cacheManager.get(payload.otp);

            if (email == null) {
                return { message: ExceptionMessage.INCORRECT_OTP, status: HttpStatusMessage.BAD_REQUEST };

            }
            const userData = await this.cacheManager.get(`${email}+${payload.otp}`);

            userData['password'] = await bcrypt.hash(userData['password'], 10);
            const createdUser = new this.UserModel(userData);
            createdUser.save();

            return { message: SuccessMessage.USER_SIGNUP_SUCCESS, status: HttpStatusMessage.CREATED };


        } catch (error) {
            throw error;
        }
    }


    @GrpcMethod('AuthService', 'GetToken')
    async getToken(payload: Credentials): Promise<TokenResponse> {
        try {
            const email = payload.email;

            const user = await this.UserModel.findOne({ email });

            if (user) {
                const isMatch = await bcrypt.compare(payload.password, user.password);

                if (!isMatch) {
                    return { message: ExceptionMessage.INVALID_PASSWORD, status: HttpStatusMessage.BAD_GATEWAY, token: "" };
                }
                let redisSession = await this.cacheManager.get(`${user._id}`);

                if (!redisSession) {

                    let dataSession = await this.SessionModel.findOne(
                        {
                            userId: user._id,
                            isActive: true,
                            deviceId: payload.deviceId,
                        },
                        {}
                    );
                    if (!(dataSession == null)) {

                        await this.cacheManager.set(
                            `${user._id}`,
                            `${payload.deviceId}`,
                        );
                    } else {

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
    async guard(payload: Token): Promise<GuardResponse> {
        try {
            const token = payload.token;
            const decodeData = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );

            let redisSessionData = await this.cacheManager.get(decodeData.sub)

            if (redisSessionData == decodeData.deviceId) {

                return { valid: true, userId: decodeData.sub, role: decodeData.role };

            } else {
                let sessionData = await this.SessionModel.findOne({
                    deviceId: decodeData.deviceId,
                    userId: decodeData.sub,
                    isActive: true,
                }, { _id: 1 })
                if (sessionData) {
                    await this.cacheManager.set(decodeData.sub, decodeData.deviceId);

                    return { valid: true, userId: decodeData.sub, role: decodeData.role };

                } else {
                    return { valid: false, userId: null, role: null };
                }

            }
        }
        catch (error) {
            return { valid: false, userId: null, role: null };
        }
    }


}
