import {
	Injectable,
	Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transporter } from 'nodemailer';
import {
	EmailVerification,
	EmailVerificationDocument,
} from './schemas/email-verification.schema';
import {
	ForgottenPassword,
	ForgottenPasswordDocument,
} from './schemas/forgotten-password.schema';
import {
	Users,
	UsersDocument,
} from './schemas/user.schema';
import {
	Model,
	Types,
} from 'mongoose';
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
	TokenPayload,
} from './dto/auth.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { constants } from './constants';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AppService {
	private logger                            = new Logger( 'AppService' );
	private readonly transporter: Transporter = nodemailer.createTransport( {
		                                                                        host  : constants.mail.host,
		                                                                        port  : constants.mail.port,
		                                                                        secure: constants.mail.port === 465, // true
		                                                                                                             // for
		                                                                                                             // 465,
		                                                                        // false for other ports
		                                                                        auth  : {
			                                                                        user: constants.mail.user,
			                                                                        pass: constants.mail.pass,
		                                                                        },
	                                                                        } );

	private readonly refreshTokenConfig = {
		secret   : constants.refreshTokenSecret,
		expiresIn: constants.refreshTokenExpiresIn,
	};

	private readonly accessTokenConfig = {
		secret   : constants.accessTokenSecret,
		expiresIn: constants.accessTokenExpiresIn,
	};

	constructor( @InjectModel( Users.name ) private usersModel: Model<UsersDocument>,
	             @InjectModel( EmailVerification.name ) private emailVerificationModel: Model<EmailVerificationDocument>,
	             @InjectModel( ForgottenPassword.name ) private forgottenPasswordModel: Model<ForgottenPasswordDocument>,
	             private jwtService: JwtService,
	) {

	}

	async createUser( dto: IRegisterRequestDto ): Promise<{ id: Types.ObjectId, email: string }> {
		const user = ( await this.usersModel.create( {
			                                             email    : dto.email,
			                                             password : await bcrypt.hash( dto.password, 10 ),
			                                             firstname: dto.firstname,
			                                             lastname : dto.lastname,
			                                             avatar   : undefined,
		                                             } ) ).toJSON();
		return {
			id   : user._id,
			email: user.email,
		};
	}

	async login( credentials: ILoginRequestDto ): Promise<ITokensResponseDto> {
		const user                             = ( await this.validateUserPassword( credentials,
		                                                                            await this.findByEmail( credentials.email ),
		) ).toJSON();
		const accessTokenPayload: TokenPayload = {
			email: user.email,
			id   : user._id,
			roles: user.roles,
			sub  : user.id,
		};
		const accessToken                      = this.jwtService.sign( accessTokenPayload, this.accessTokenConfig );

		const refreshTokenPayload: TokenPayload = {
			email: user.email,
			id   : user._id,
			roles: user.roles,
			sub  : user.id,
		};
		const refreshToken                      = this.jwtService.sign( refreshTokenPayload, this.refreshTokenConfig );

		return {
			accessToken : accessToken,
			refreshToken: refreshToken,
		};
	}

	validateRefreshToken( token: string ): IAuthenticateResponseDto {
		try {
			const result = this.jwtService.verify( token, this.refreshTokenConfig );
			return {
				id   : result.id,
				email: result.email,
				roles: result.roles,
			};
		} catch ( err ) {
			return null;
		}

	}

	async uploadAvatar( dto: IUploadAvatarRequestDto ): Promise<string | RpcException> {
		try {
			const userFromDB  = await this.usersModel.findById( dto.id );
			userFromDB.avatar = dto.avatar;
			await userFromDB.save();
			return 'OK';
		} catch ( err ) {
			return new RpcException( 'UPLOAD_AVATAR.ERROR.GENERIC' );
		}
	}

	async validateAccessToken( token: string ): Promise<IAuthenticateResponseDto> {
		try {
			const result = this.jwtService.verify( token, this.accessTokenConfig );
			return {
				id   : result.id,
				email: result.email,
				roles: result.roles,
			};
		} catch ( err ) {
			return null;
		}

	}

	async updatePassword( dto: IUpdatePasswordRequestDto ): Promise<string> {
		let user;
		try {
			user = await this.usersModel.findById( dto.id );
		} catch ( err ) {
			throw new RpcException( 'User not found' );
		}

		try {
			await this.validateUserPassword( {
				                                 password: dto.old,
				                                 email   : '',
			                                 }, user );
		} catch ( err ) {
			throw new RpcException( 'Invalid password' );
		}
		let hashedPassword;
		try {
			hashedPassword = await bcrypt.hash( dto.new, 10 );
		} catch ( err ) {
			throw new RpcException( 'Unable to hash password' );
		}

		try {
			await this.usersModel.findByIdAndUpdate( user.id, { '$set': { password: hashedPassword } } );
			return 'OK';
		} catch ( err ) {
			throw new RpcException( 'Unable to update password' );
		}
	}

	async updateProfile( dto: IUpdateProfileRequestDto ): Promise<IMeResponseDto> {
		const user = ( await this.usersModel.findByIdAndUpdate( dto.id, {
			'$set': {
				email    : dto.email,
				bio      : dto.bio,
				firstname: dto.firstname,
				lastname : dto.lastname,
			},
		}, { new: true } ) ).toJSON();

		return {
			id         : user._id,
			firstname  : user.firstname,
			lastname   : user.lastname,
			email      : user.email,
			avatar     : user.avatar,
			roles      : user.roles,
			bio        : user.bio,
			dateCreated: user.dateCreated,
		};

	}

	async refreshAccessToken( refreshToken: string ): Promise<string> {
		let tokenValidationResult;
		try {
			tokenValidationResult = this.validateRefreshToken( refreshToken );
			if ( !tokenValidationResult ) {
				return null;
			}
		} catch ( err ) {
			return null;
		}


		try {
			const user = await this.findByEmail( tokenValidationResult.email );
			if ( !user ) {
				return null;
			}

			const accessTokenPayload: TokenPayload = {
				email: user.email,
				id   : user._id,
				roles: user.roles,
				sub  : user.id,
			};
			return this.jwtService.sign( accessTokenPayload, this.accessTokenConfig );

		} catch ( err ) {
			return null;
		}


	}

	async findByEmail( email: string ): Promise<UsersDocument> {
		return this.usersModel.findOne( { email } );
	}

	async validateUserPassword( credentials: ILoginRequestDto, user: UsersDocument ): Promise<UsersDocument> {
		const valid = await bcrypt.compare( credentials.password, user.password );
		if ( !user || !valid ) {
			throw new RpcException( 'Invalid credentials.' );
		} else {
			return user;
		}
	}

	async createEmailToken( email: string ): Promise<boolean | RpcException> {
		const emailVerification = await this.emailVerificationModel.findOne( { email: email } );
		if ( emailVerification && ( ( new Date().getTime() - emailVerification.timestamp.getTime() ) / 60000 < 15 ) ) {
			return new RpcException( 'LOGIN.EMAIL_SENDED_RECENTLY' );
		} else {
			const emailVerificationModel = await this.emailVerificationModel.findOneAndUpdate( { email: email }, {
				email     : email,
				emailToken: ( Math.floor( Math.random() * ( 9000000 ) ) + 1000000 ).toString(), // Generate 7 digits
				// number
				timestamp : new Date(),
			}, { upsert: true } );
			return true;
		}
	}

	/* async saveUserConsent( email: string ): Promise<ConsentRegistry> {
	 try {
	 var http = new HttpService();

	 var newConsent                 = new this.consentRegistryModel();
	 newConsent.email               = email;
	 newConsent.date                = new Date();
	 newConsent.registrationForm    = [ 'name', 'surname', 'email', 'birthday date', 'password' ];
	 newConsent.checkboxText        = 'I accept privacy policy';
	 var privacyPolicyResponse: any = await http.get( 'https://www.XXXXXX.com/api/privacy-policy' ).toPromise();
	 newConsent.privacyPolicy       = privacyPolicyResponse.data.content;
	 var cookiePolicyResponse: any  = await http.get( 'https://www.XXXXXX.com/api/privacy-policy' ).toPromise();
	 newConsent.cookiePolicy        = cookiePolicyResponse.data.content;
	 newConsent.acceptedPolicy      = 'Y';
	 return await newConsent.save();
	 } catch ( error ) {
	 console.error( error );
	 }
	 } */

	async createForgottenPasswordToken( email: string ): Promise<ForgottenPassword> {
		const forgottenPassword = await this.forgottenPasswordModel.findOne( { email: email } );
		if ( forgottenPassword && ( ( new Date().getTime() - forgottenPassword.timestamp.getTime() ) / 60000 < 15 ) ) {
			throw new RpcException( 'ERROR.AUTH.EMAIL_SENT_RECENTLY' );
		} else {
			const forgottenPasswordModel = await this.forgottenPasswordModel.findOneAndUpdate( { email: email }, {
				email           : email,
				newPasswordToken: ( Math.floor( Math.random() * ( 9000000 ) ) + 1000000 ).toString(), // Generate 7
			                                                                                          // digits number
				timestamp       : new Date(),
			}, {
				                                                                                   upsert: true,
				                                                                                   new   : true,
			                                                                                   } );
			if ( forgottenPasswordModel ) {
				return forgottenPasswordModel;
			} else {
				throw new RpcException( 'ERROR.GENERIC_ERROR' );
			}
		}
	}

	async verifyEmail( token: string ): Promise<boolean | RpcException> {
		console.log( token );
		var emailVerif = await this.emailVerificationModel.findOne( { emailToken: token } );
		if ( emailVerif && emailVerif.email ) {
			const userFromDb = await this.usersModel.findOne( { email: emailVerif.email } );
			if ( userFromDb ) {
				userFromDb.emailValidated = true;
				const savedUser           = await userFromDb.save();
				await emailVerif.remove();
				return !!savedUser;
			}
		} else {
			return new RpcException( 'LOGIN.EMAIL_CODE_NOT_VALID' );
		}
	}

	async getForgottenPasswordModel( newPasswordToken: string ): Promise<ForgottenPasswordDocument> {
		return await this.forgottenPasswordModel.findOne( { newPasswordToken: newPasswordToken } );
	}

	async resetPassword( dto: IResetPasswordRequestDto ): Promise<boolean | RpcException> {
		try {
			let isNewPasswordChanged: boolean = false;
			if ( dto.token ) {
				const forgottenPasswordModel = await this.getForgottenPasswordModel( dto.token );
				if ( !forgottenPasswordModel || !forgottenPasswordModel.email ) {
					return new RpcException( 'ERROR.RESET_PASSWORD.INVALID_TOKEN' );
				}
				isNewPasswordChanged = await this.setPassword( forgottenPasswordModel.email, dto.password );
				if ( isNewPasswordChanged ) await forgottenPasswordModel.remove();
			} else {
				return new RpcException( 'ERROR.RESET_PASSWORD.CHANGE_PASSWORD_ERROR' );
			}
			return true;
		} catch ( error ) {
			this.logger.warn( error.message );
			return new RpcException( 'ERROR.RESET_PASSWORD.CHANGE_PASSWORD_ERROR' );
		}

	}

	private async setPassword( email: string, password: string ): Promise<boolean> {
		let hashedPassword;
		try {
			hashedPassword = await bcrypt.hash( password, 10 );
		} catch ( err ) {
			throw new RpcException( 'Unable to hash password' );
		}

		try {
			await this.usersModel.findOneAndUpdate( {
				                                        email,
			                                        }, { '$set': { password: hashedPassword } } );
			return true;
		} catch ( err ) {
			throw new RpcException( 'Unable to update password' );
		}


	}

	async sendEmailVerification( email: string ): Promise<boolean | RpcException> {
		var model = await this.emailVerificationModel.findOne( { email: email } );

		if ( model && model.emailToken ) {

			const mailOptions = {
				from   : '"MicroservicesApp" <' + constants.mail.user + '>',
				to     : email, // list of receivers (separated by ,)
				subject: 'Verify Email',
				text   : 'Verify Email',
				html   : 'Hi! <br><br> Thanks for your registration<br><br>' + '<a href=' + constants.verifyEmailUrl + model.emailToken + '>' + 'Click here to activate your account' + '</a>',  // html body
			};

			return await new Promise<boolean>( async ( resolve, reject ) => {
				return await this.transporter.sendMail( mailOptions, async ( error, info ) => {
					if ( error ) {
						console.log( 'Message sent: %s', error );
						return reject( false );
					}
					console.log( 'Message sent: %s', info.messageId );
					resolve( true );
				} );
			} );

		} else {
			throw new RpcException( 'REGISTER.USER_NOT_REGISTERED' );
		}
	}

	async sendEmailForgotPassword( email: string ): Promise<boolean> {
		const userFromDb = await this.usersModel.findOne( { email: email } );
		if ( !userFromDb ) throw new RpcException( 'ERROR.AUTH.USER_NOT_FOUND' );

		const tokenModel = await this.createForgottenPasswordToken( email );

		if ( tokenModel && tokenModel.newPasswordToken ) {

			const mailOptions = {
				from   : '"Microservice App" <' + constants.mail.user + '>',
				to     : email, // list of receivers (separated by ,)
				subject: 'Forgotten Password',
				text   : 'Forgot Password',
				html   : 'Hi! <br><br> If you requested to reset your password<br><br>' + '<a href=' + constants.resetPasswordUrl + tokenModel.newPasswordToken + '>Click here</a>',  // html body
			};

			return await new Promise<boolean>( async ( resolve, reject ) => {
				return await this.transporter.sendMail( mailOptions, async ( error, info ) => {
					if ( error ) {
						console.log( 'Message sent: %s', error );
						return reject( false );
					}
					console.log( 'Message sent: %s', info.messageId );
					resolve( true );
				} );
			} );
		} else {
			throw new RpcException( 'ERROR.AUTH.USER_NOT_REGISTERED' );
		}
	}

	async me( token: string ): Promise<IMeResponseDto> {
		try {
			const result = await this.validateAccessToken( token );
			const user   = ( await this.usersModel.findById( result.id ) ).toJSON();
			return {
				id            : user._id,
				firstname     : user.firstname,
				lastname      : user.lastname,
				email         : user.email,
				avatar        : user.avatar,
				roles         : user.roles,
				emailValidated: user.emailValidated,
				bio           : user.bio,
				dateCreated   : user.dateCreated,
			};
		} catch ( err ) {
			throw err;
		}
	}
}
