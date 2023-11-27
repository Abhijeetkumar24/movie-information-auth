import { ExceptionMessage, HttpStatusCode, HttpStatusMessage } from '../interfaces/enum';
import { AcceptAny } from '../interfaces/type';

export class ExceptionHandler {
    protected code!: number;
    protected status!: string;
    protected data: AcceptAny;
    constructor() {}
    getError() {
        return {
            code:
                this.getStatusCode(<keyof typeof HttpStatusCode>this.status) ||
                HttpStatusCode.BAD_REQUEST,
            status: this.status || HttpStatusMessage.BAD_REQUEST,
            data: this.data,
        };
    }
    getStatusCode(code: keyof typeof HttpStatusCode): number {
        return HttpStatusCode[code];
    }
}
export class CustomException extends ExceptionHandler {
    constructor(message: ExceptionMessage, status?: HttpStatusMessage) {
        super();
        this.data = {
            message: message,
        };
        this.status = status || HttpStatusMessage.BAD_REQUEST;
    }
}