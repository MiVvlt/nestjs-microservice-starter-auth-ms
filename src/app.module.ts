import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
	Users,
	UsersSchema,
} from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';

@Module( {
	         imports    : [ MongooseModule.forRoot( 'mongodb://localhost/auth' ),
	                        MongooseModule.forFeature( [ {
		                        name: Users.name,
		                        schema: UsersSchema,
	                        },
	                                                   ] ),
	                        JwtModule.register( {} ),
	         ],
	         controllers: [ AppController ],
	         providers  : [ AppService ],
         } )
export class AppModule {
}
