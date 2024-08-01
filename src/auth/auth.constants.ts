export enum ResponseMessage {
  ACCOUNT_EXISTS = 'user with email or phone already exists',
  EMAIL_UNVERIFIED = 'email not verified',
  EMAIL_ALREADY_VERIFIED = 'email already verified',
  INCORRECT_CREDENTIALS = 'incorrect credentials',
  INVALID_OTP = 'invalid OTP',
  SIGNIN_SUCCESS = 'sign-in successful',
  SIGNUP_SUCCESS = 'user successfully created',
  USER_NOT_FOUND = 'user does not exist',
}
