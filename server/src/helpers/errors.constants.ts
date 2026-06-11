export const SIGNUP_ERRORS = {
  INCORRECT_INVITED_EMAIL: {
    type: 'INCORRECT_INVITED_EMAIL',
    inputError: 'Incorrect email address',
    message: 'Invalid Email: Please use the email address provided in the invitation.',
  },
  PROVIDER_EMAIL_MISSING: {
    type: 'PROVIDER_EMAIL_MISSING',
    inputError: 'Email not found',
    message: 'Authentication failed: Unable to retrieve email from provider.',
  },
};
