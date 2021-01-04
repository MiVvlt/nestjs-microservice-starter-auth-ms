import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { Types } from 'mongoose';

export class ILoginRequestDto {
	@IsNotEmpty() @IsEmail() email: string;

	@IsNotEmpty() password: string;
}

export class IUploadAvatarRequestDto {
	@IsNotEmpty() @MaxLength( 2000 ) avatar: string;

	@IsNotEmpty() id: string;
}

export class IRegisterRequestDto {
	@IsNotEmpty() @IsEmail() email: string;

	@IsNotEmpty() password: string;

	@IsString() @MaxLength( 100 ) firstname: string;

	@IsString() @MaxLength( 100 ) lastname: string;
}

export class ITokensResponseDto {
	accessToken: string;
	refreshToken: string;
}

export class IAuthenticateResponseDto {
	id: string;
	roles: string[];
	email: string;
}

export class TokenPayload {
	email: string;
	id: string;
	roles: Role[];
	sub: Types.ObjectId;
}

export class IMeResponseDto {
	id: string;
	firstname?: string;
	lastname?: string;
	emailValidated?: boolean;
	avatar: string;
	bio?: string;
	email: string;
	roles?: Role[];
	dateCreated?: Date;
}

export class IUpdatePasswordRequestDto {
	@IsNotEmpty() id: string;
	@IsNotEmpty() old: string;
	@IsNotEmpty() new: string;
}

export class IResetPasswordRequestDto {
	@IsNotEmpty() token: string;
	@IsNotEmpty() password: string;
}

export class IUpdateProfileRequestDto {
	id: string;
	@MaxLength( 100 ) firstname?: string;
	@MaxLength( 100 ) lastname?: string;
	@MaxLength( 255 ) bio?: string;
	@IsNotEmpty() @IsEmail() email: string;
}

