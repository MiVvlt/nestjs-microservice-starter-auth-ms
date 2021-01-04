import {
	Prop,
	Schema,
	SchemaFactory,
} from '@nestjs/mongoose';
import {
	Document,
} from 'mongoose';

export type ForgottenPasswordDocument = ForgottenPassword & Document;
import { isEmail } from 'class-validator';

@Schema()
export class ForgottenPassword {

	@Prop( {
		       index   : true,
		       required: 'Email address is required',
		       validate: [ isEmail, 'invalid email' ],
		       unique  : true,
	       } ) email: string;

	@Prop() newPasswordToken: string;

	@Prop() timestamp: Date;
}

export const ForgottenPasswordSchema = SchemaFactory.createForClass( ForgottenPassword );
