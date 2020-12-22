import {
	Injectable,
	Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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


@Injectable()
export class AppService {

	private readonly refreshTokenConfig = {
		secret   : constants.refreshTokenSecret,
		expiresIn: constants.refreshTokenExpiresIn,
	};

	private readonly accessTokenConfig = {
		secret   : constants.accessTokenSecret,
		expiresIn: constants.accessTokenExpiresIn,
	};

	constructor( @InjectModel( Users.name ) private usersModel: Model<UsersDocument>, private jwtService: JwtService ) {

	}

	async register( dto: IRegisterRequestDto ): Promise<{ id: Types.ObjectId }> {
		const id = ( await this.usersModel.create( {
			                                           email    : dto.email,
			                                           password : await bcrypt.hash( dto.password, 10 ),
			                                           firstname: dto.firstname,
			                                           lastname : dto.lastname,
			                                           avatar   : undefined,
		                                           } ) ).toJSON()._id;
		return { id };
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

	async uploadAvatar( dto: IUploadAvatarRequestDto ): Promise<string> {
		await this.usersModel.findByIdAndUpdate( dto.id, { '$set': { avatar: dto.avatar } }, { new: true } );
		return 'OK';
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

	async me( token: string ): Promise<IMeResponseDto> {
		try {
			const result = await this.validateAccessToken( token );
			const user   = ( await this.usersModel.findById( result.id ) ).toJSON();
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
		} catch ( err ) {
			throw err;
		}
	}
}
