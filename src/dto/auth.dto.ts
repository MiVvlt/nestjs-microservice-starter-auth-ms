import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';
import {Role} from '../enums/role.enum';
import {Types} from 'mongoose';

export class ILoginRequestDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}

export class IUploadAvatarRequestDto {
    @IsNotEmpty()
    @MaxLength(2000)
    avatar: string;

    @IsNotEmpty()
    id: string;
}

export class IRegisterRequestDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsString()
    firstname: string;

    @IsString()
    lastname: string;
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
    firstname: string;
    lastname: string;
    avatar: string;
    email: string;
    roles?: Role[];
    dateCreated?: Date;
}

