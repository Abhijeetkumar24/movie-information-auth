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