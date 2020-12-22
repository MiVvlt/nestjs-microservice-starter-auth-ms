import {
	Prop,
	Schema,
	SchemaFactory,
} from '@nestjs/mongoose';
import {
	Document,
	Types,
} from 'mongoose';
import { Role } from '../enums/role.enum';

export type UsersDocument = Users & Document;
import { isEmail } from 'class-validator';

@Schema()
export class Users {
	@Prop() firstname: string;

	@Prop() lastname: string;

	@Prop( {
		       required   : false,
		       data       : Buffer,
		       contentType: String,
		       maxlength  : 2000,
	       } ) avatar: string;

	@Prop( {
		       index   : true,
		       required: 'Email address is required',
		       validate: [ isEmail, 'invalid email' ],
		       unique  : true,
	       } ) email: string;

	@Prop( {
		       required: true,
	       } ) password: string;

	@Prop( {
		       default: [ Role.User ],
		       type   : [ String ],
	       } ) roles?: Role[];

	@Prop( {
		       default: Date.now,
		       type   : Date,
	       } ) dateCreated?: Date;

}

export const UsersSchema = SchemaFactory.createForClass( Users );
