import {Injectable} from '@nestjs/common';
import {ILoginRequestDto, ILoginResponseDto} from './app.controller';

@Injectable()
export class AppService {

    constructor() {

    }

    async login(credentials: ILoginRequestDto): Promise<ILoginResponseDto> {
        return {
            token: JSON.stringify(credentials),
            refreshToken: ''
        };
    }
}
