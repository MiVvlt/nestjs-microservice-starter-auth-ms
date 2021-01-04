import {
	Controller,
	Logger,
} from '@nestjs/common';
import { AppService } from './app.service';
import {
	MessagePattern,
	RpcException,
} from '@nestjs/microservices';
import {
	IAuthenticateResponseDto,
	ILoginRequestDto,
	IMeResponseDto,
	IRegisterRequestDto,
	IResetPasswordRequestDto,
	ITokensResponseDto,
	IUpdatePasswordRequestDto,
	IUpdateProfileRequestDto,
	IUploadAvatarRequestDto,
} from './dto/auth.dto';
import { Types } from 'mongoose';


@Controller()
export class AppController {
	private logger = new Logger();

	constructor( private readonly appService: AppService ) {
	}

	@MessagePattern( 'login' )
	async login( credentials: ILoginRequestDto ): Promise<ITokensResponseDto> {
		return this.appService.login( credentials );
	}

	@MessagePattern( 'register' )
	async register( dto: IRegisterRequestDto ): Promise<{ id: Types.ObjectId } | RpcException> {
		try {
			const createdUser = await this.appService.createUser( dto );
			await this.appService.createEmailToken( createdUser.email );
			// TODO: await this.appService.saveUserConsent( newUser.email );
			const sent = await this.appService.sendEmailVerification( createdUser.email );
			if ( sent ) {
				return new RpcException( 'REGISTRATION.USER_REGISTERED_SUCCESSFULLY' );
			} else {
				return new RpcException( 'REGISTRATION.ERROR.MAIL_NOT_SENT' );
			}
		} catch ( error ) {
			this.logger.warn( error.message );
			return new RpcException( 'REGISTRATION.ERROR.GENERIC_ERROR' );
		}
	}

	@MessagePattern( 'verifyEmailToken' )
	public async verifyEmail( token: string ): Promise<boolean | RpcException> {
		try {
			return await this.appService.verifyEmail( token );
		} catch ( error ) {
			this.logger.warn( error.message );
			throw new RpcException( 'LOGIN.ERROR' );
		}
	}

	@MessagePattern( 'resendVerifyEmailToken' )
	public async sendEmailVerification( email: string ): Promise<boolean | RpcException> {
		try {
			await this.appService.createEmailToken( email );
			const isEmailSent = await this.appService.sendEmailVerification( email );
			if ( isEmailSent ) {
				return true;
			} else {
				return new RpcException( 'REGISTRATION.ERROR.MAIL_NOT_SENT' );
			}
		} catch ( error ) {
			this.logger.warn( error );
			return new RpcException( 'LOGIN.ERROR.SEND_EMAIL' );
		}
	}

	@MessagePattern( 'sendForgotPasswordEmail' )
	public async sendEmailForgotPassword( email: string ): Promise<boolean | RpcException> {
		try {
			const isEmailSent = await this.appService.sendEmailForgotPassword( email );
			if ( isEmailSent ) {
				return true;
			} else {
				return new RpcException( 'ERROR.AUTH.MAIL_NOT_SENT' );
			}
		} catch ( error ) {
			return new RpcException( error.message );
		}
	}

	@MessagePattern( 'refreshAccessToken' )
	async refreshAccessToken( refreshToken: string ): Promise<string> {
		return this.appService.refreshAccessToken( refreshToken );
	}

	@MessagePattern( 'authenticate' )
	async authenticate( token: string ): Promise<IAuthenticateResponseDto> {
		return this.appService.validateAccessToken( token );
	}

	@MessagePattern( 'me' )
	async me( token: string ): Promise<IMeResponseDto> {
		return this.appService.me( token );
	}

	@MessagePattern( 'updateAvatar' )
	async uploadAvatar( avatar: IUploadAvatarRequestDto ): Promise<string | RpcException> {
		return this.appService.uploadAvatar( avatar );
	}

	@MessagePattern( 'updatePassword' )
	async updatePassword( dto: IUpdatePasswordRequestDto ): Promise<string> {
		return this.appService.updatePassword( dto );
	}

	@MessagePattern( 'updateProfile' )
	async updateProfile( dto: IUpdateProfileRequestDto ): Promise<IMeResponseDto> {
		return this.appService.updateProfile( dto );
	}

	@MessagePattern( 'resetPassword' )
	async resetPassword( dto: IResetPasswordRequestDto ): Promise<boolean | RpcException> {
		return this.appService.resetPassword( dto );
	}


}
