import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { constants } from './constants';
import {
	EmailVerification,
	EmailVerificationSchema,
} from './schemas/email-verification.schema';
import {
	ForgottenPassword,
	ForgottenPasswordSchema,
} from './schemas/forgotten-password.schema';
import {
	Users,
	UsersSchema,
} from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';

@Module( {
	         imports    : [ MongooseModule.forRoot( constants.db.url ),
	                        MongooseModule.forFeature( [ {
		                        name  : Users.name,
		                        schema: UsersSchema,
	                        },{
		                        name  : EmailVerification.name,
		                        schema: EmailVerificationSchema,
	                        },{
		                        name  : ForgottenPassword.name,
		                        schema: ForgottenPasswordSchema,
	                        },
	                                                   ] ),
	                        JwtModule.register( {} ),
	         ],
	         controllers: [ AppController ],
	         providers  : [ AppService ],
         } )
export class AppModule {
}
