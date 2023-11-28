
import { Controller } from '@nestjs/common';
import { GrpcMethod, } from '@nestjs/microservices';
import { Credentials, GuardResponse, LogoutRequest, LogoutResponse, SignupRequest, SignupResponse, Token, TokenResponse, VerificationRequest, VerificationResponse, } from 'src/interfaces/auth.interface';
import { AuthService } from './auth.service';



@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) { }


    /**
    * Handles the gRPC method for user signup.
    *
    * @param {SignupRequest} payload - The request payload for user signup.
    * @returns {Promise<SignupResponse>} A Promise that resolves with the response from the user signup process.
    */
    @GrpcMethod('AuthService', 'Signup')
    async signup(payload: SignupRequest): Promise<SignupResponse> {
        return this.authService.signup(payload);
    }


    /**
     * Handles the gRPC method for user signup verification.
     *
     * @param {VerificationRequest} payload - The request payload for user signup verification.
     * @returns {Promise<VerificationResponse>} A Promise that resolves with the response from the user signup verification process.
     */
    @GrpcMethod('AuthService', 'SignupVerification')
    async signupVerification(payload: VerificationRequest): Promise<VerificationResponse> {
        return this.authService.signupVerification(payload);
    }


    /**
     * Handles the gRPC method for retrieving an authentication token.
     *
     * @param {Credentials} payload - The request payload containing user credentials.
     * @returns {Promise<TokenResponse>} A Promise that resolves with the response containing the authentication token.
     */
    @GrpcMethod('AuthService', 'GetToken')
    async getToken(payload: Credentials): Promise<TokenResponse> {
        return this.authService.getToken(payload);
    }

    /**
     * Handles the gRPC method for user authentication guard.
     *
     * @param {Token} payload - The request payload containing the authentication token.
     * @returns {Promise<GuardResponse>} A Promise that resolves with the response from the authentication guard process.
     */
    @GrpcMethod('AuthService', 'Guard')
    async guard(payload: Token): Promise<GuardResponse> {
        return this.authService.guard(payload);
    }


    /**
     * Handles the gRPC method for user logout.
     *
     * @param {LogoutRequest} payload - The request payload for user logout.
     * @returns {Promise<LogoutResponse>} A Promise that resolves with the response from the user logout process.
     */
    @GrpcMethod('AuthService', 'Logout')
    async logout(payload: LogoutRequest): Promise<LogoutResponse> {
        return this.authService.logout(payload);
    }

}
