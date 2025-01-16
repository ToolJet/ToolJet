export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const onboardingSelectors = {
  emailLabel: "[data-cy='email-label']",
  emailInput: "[data-cy='email-input-input']",
  signupEmailInput: "[data-cy='email-input']",
  loginEmailInput: "[data-cy='email-input']",
  passwordLabel: "[data-cy='password-label']",
  passwordInput: "[data-cy='password-input-input']",
  loginPasswordInput: "[data-cy='password-input']",
  signInButton: "[data-cy='sign-in-button']",
  passwordError: "[data-cy='password-error']",
  nameInput: "[data-cy='name-input']",
  nameLabel: '[data-cy="name-input-label"]',
  signupNameLabel: '[data-cy="name-label"]',
  forgotEmailInput: '[data-cy="email-input-field-input"]',
  createAnAccountLink: '[data-cy="create-an-account-link"]',
} 