
import { Controller } from '@nestjs/common';
import { GrpcMethod,  } from '@nestjs/microservices';
import { Credentials, GuardResponse, LogoutRequest, LogoutResponse, SignupRequest, SignupResponse, Token, TokenResponse, VerificationRequest, VerificationResponse, } from 'src/interfaces/auth.interface';
import { AuthService } from './auth.service';



@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) { }


    @GrpcMethod('AuthService', 'Signup')
    async signup(payload: SignupRequest): Promise<SignupResponse> {
        return this.authService.signup(payload);
    }


    @GrpcMethod('AuthService', 'SignupVerification')
    async signupVerification(payload: VerificationRequest): Promise<VerificationResponse> {
        return this.authService.signupVerification(payload);
    }


    @GrpcMethod('AuthService', 'GetToken')
    async getToken(payload: Credentials): Promise<TokenResponse> {
        return this.authService.getToken(payload);
    }


    @GrpcMethod('AuthService', 'Guard')
    async guard(payload: Token): Promise<GuardResponse> {
        return this.authService.guard(payload);
    }

    @GrpcMethod('AuthService', 'Logout')
    async logout(payload: LogoutRequest): Promise<LogoutResponse> {
        return this.authService.logout(payload);
    }

}
