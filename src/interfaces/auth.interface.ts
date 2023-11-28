export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    role: [string];
    notification: string;
}

export interface SignupResponse {
    message: string;
    status: string;
}

export interface VerificationRequest {
    otp: string;
}

export interface VerificationResponse{
    message: string;
    status: string;
}
export interface Credentials {
    email: string
    password: string;
    deviceId: string;
}

export interface TokenResponse {
    message: string;
    status: string;
    token: string;
}

export interface Token {
    token: string;
}

export interface GuardResponse {
    valid: boolean;
    userId: string;
    role: string
}

export interface LogoutRequest {
    token: string;
}

export interface LogoutResponse {
    message: string;
    status: string;
}
