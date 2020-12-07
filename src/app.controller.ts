import {Controller, Logger} from '@nestjs/common';
import {AppService} from './app.service';
import {MessagePattern} from '@nestjs/microservices';
import {IAuthenticateResponseDto, ILoginRequestDto, IMeResponseDto, IRegisterRequestDto, ITokensResponseDto} from './dto/auth.dto';
import {Types} from 'mongoose';


@Controller()
export class AppController {
    private logger = new Logger();

    constructor(private readonly appService: AppService) {
    }

    @MessagePattern('login')
    async login(credentials: ILoginRequestDto): Promise<ITokensResponseDto> {
        return this.appService.login(credentials);
    }

    @MessagePattern('register')
    async register(dto: IRegisterRequestDto): Promise<{id: Types.ObjectId}> {
        return this.appService.register(dto);
    }

    @MessagePattern('refreshAccessToken')
    async refreshAccessToken(refreshToken: string): Promise<string> {
        return this.appService.refreshAccessToken(refreshToken);
    }

    @MessagePattern('authenticate')
    async authenticate(token: string): Promise<IAuthenticateResponseDto> {
        return this.appService.validateAccessToken(token);
    }

    @MessagePattern('me')
    async me(token: string): Promise<IMeResponseDto> {
        return this.appService.me(token);
    }

}
