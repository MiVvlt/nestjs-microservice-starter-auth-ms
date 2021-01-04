import {
	Prop,
	Schema,
	SchemaFactory,
} from '@nestjs/mongoose';
import {
	Document,
} from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;
import { isEmail } from 'class-validator';

@Schema()
export class EmailVerification {

	@Prop( {
		       index   : true,
		       required: 'Email address is required',
		       validate: [ isEmail, 'invalid email' ],
		       unique  : true,
	       } ) email: string;

	@Prop() emailToken: string;

	@Prop() timestamp: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass( EmailVerification );
