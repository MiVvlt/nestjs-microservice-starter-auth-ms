import {Controller, Get, Logger} from '@nestjs/common';
import {AppService} from './app.service';
import {MessagePattern} from '@nestjs/microservices';

export interface ILoginRequestDto {
    email: string,
    password: string
}

export interface ILoginResponseDto {
    token: string,
    refreshToken: string
}

export interface IRegisterRequestDto {
    token: string,
    refreshToken: string
}

@Controller()
export class AppController {
    private logger = new Logger();

    constructor(private readonly appService: AppService) {
    }

    @MessagePattern('login')
    async login(credentials: ILoginRequestDto): Promise<ILoginResponseDto> {
        this.logger.log('Logging in ')
        return this.appService.login(credentials);
    }

}
