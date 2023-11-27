import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Credentials, GuardResponse, LogoutRequest, LogoutResponse, SignupRequest, SignupResponse, Token, TokenResponse, VerificationRequest, VerificationResponse } from 'src/interfaces/auth.interface';
import { ExceptionMessage, HttpStatusMessage, MSG, SuccessMessage } from 'src/interfaces/enum';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { Session } from 'src/schemas/session.schema';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        @InjectModel(User.name) private readonly UserModel: Model<User>,
        @InjectModel(Session.name) private SessionModel: Model<Session>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly mailerService: MailerService,
    ) { }


    async signup(payload: SignupRequest): Promise<SignupResponse> {
        try {
            const existingUser = await this.UserModel.findOne({ email: payload.email });

            if (existingUser) {
                return { message: ExceptionMessage.USER_ALREADY_EXIST, status: HttpStatusMessage.CONFLICT };
            }

            const OTP = Math.floor(1000 + Math.random() * 9000);

            await this.cacheManager.set(`${OTP}`, payload.email, 300000);

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

            this.mailerService.sendMail(mailOptions);

            return { message: SuccessMessage.USER_REGISTRATION_MAIL, status: HttpStatusMessage.OK };
        } catch (error) {
            throw error;
        }
    }


    async signupVerification(payload: VerificationRequest): Promise<VerificationResponse> {
        try {
            const email = await this.cacheManager.get(payload.otp);

            if (email == null) {
                return { message: ExceptionMessage.INCORRECT_OTP, status: HttpStatusMessage.BAD_REQUEST };
            }

            const userData = await this.cacheManager.get(`${email}+${payload.otp}`);
            userData['password'] = await bcrypt.hash(userData['password'], 10);

            const createdUser = new this.UserModel(userData);
            await createdUser.save();

            return { message: SuccessMessage.USER_SIGNUP_SUCCESS, status: HttpStatusMessage.CREATED };
        } catch (error) {
            throw error;
        }
    }


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
                    let dataSession = await this.SessionModel.findOne({
                        userId: user._id,
                        isActive: true,
                        deviceId: payload.deviceId,
                    });

                    if (dataSession != null) {
                        await this.cacheManager.set(`${user._id}`, `${payload.deviceId}`);
                    } else {
                        await this.SessionModel.updateMany(
                            { userId: user._id, isActive: true },
                            { $set: { isActive: false } }
                        );

                        new this.SessionModel({
                            userId: user._id,
                            isActive: true,
                            deviceId: payload.deviceId,
                        }).save();

                        await this.cacheManager.set(`${user._id}`, `${payload.deviceId}`);
                    }
                } else if (redisSession != payload.deviceId) {
                    await this.SessionModel.updateMany(
                        { userId: user._id, isActive: true },
                        { $set: { isActive: false } }
                    );

                    new this.SessionModel({
                        userId: user._id,
                        isActive: true,
                        deviceId: payload.deviceId,
                    }).save();

                    await this.cacheManager.set(`${user._id}`, `${payload.deviceId}`);
                }

                const jwtPayload = { sub: user._id, email: user.email, deviceId: payload.deviceId, role: user.role };
                const access_token = await this.jwtService.signAsync(jwtPayload);

                return {
                    message: SuccessMessage.USER_LOGIN_SUCCESS,
                    status: HttpStatusMessage.OK,
                    token: access_token,
                };
            } else {
                return { message: ExceptionMessage.EMAIL_NOT_EXISTS, status: HttpStatusMessage.BAD_REQUEST, token: "" };
            }
        } catch (error) {
            throw error;
        }
    }


    public async guard(payload: Token): Promise<GuardResponse> {
        try {
            const token = payload.token;
            const decodeData = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            let redisSessionData = await this.cacheManager.get(decodeData.sub);

            if (redisSessionData == decodeData.deviceId) {
                return { valid: true, userId: decodeData.sub, role: decodeData.role };
            } else {
                let sessionData = await this.SessionModel.findOne(
                    {
                        deviceId: decodeData.deviceId,
                        userId: decodeData.sub,
                        isActive: true,
                    },
                    { _id: 1 }
                );

                if (sessionData) {
                    await this.cacheManager.set(decodeData.sub, decodeData.deviceId);
                    return { valid: true, userId: decodeData.sub, role: decodeData.role };
                } else {
                    return { valid: false, userId: null, role: null };
                }
            }
        } catch (error) {
            return { valid: false, userId: null, role: null };
        }
    }


    async logout(payload: LogoutRequest): Promise<LogoutResponse> {
        try {

            const token = payload.token;
            const decodeData = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            const data = await this.SessionModel.updateOne(
                {
                    userId: decodeData.sub,
                    isActive: true,
                },
                {
                    isActive: false,
                },
                {}
            );
            await this.cacheManager.del(decodeData.sub);

            return { message: SuccessMessage.USER_LOGOUT_SUCCESS, status: HttpStatusMessage.OK };
        } catch (error) {
            return { message: ExceptionMessage.USER_LOGOUT_ERROR, status: HttpStatusMessage.BAD_REQUEST };
        }
    }
}
