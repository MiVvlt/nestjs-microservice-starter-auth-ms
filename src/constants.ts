export const constants = {
	accessTokenSecret    : process.env.ACCESS_TOKEN_SECRET,
	accessTokenExpiresIn : '120s',
	refreshTokenSecret   : process.env.REFRESH_TOKEN_SECRET,
	refreshTokenExpiresIn: '7d',
	resetPasswordUrl     : process.env.FORGOT_PASSWORD_CHANGE_URL,
	verifyEmailUrl       : process.env.VERIFY_EMAIL_URL,
	db                   : {
		url: process.env.MONGO_URL,
	},
	mail                 : {
		host  : process.env.MAIL_HOST,
		port  : 465,
		secure: true,
		user  : process.env.MAIL_USER,
		pass  : process.env.MAIL_PASSWORD,
	},
};
