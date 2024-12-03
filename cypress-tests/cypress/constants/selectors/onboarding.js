export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const onboardingSelectors = {
  emailLabel: "[data-cy='email-label']",
  emailInput: "[data-cy='email-input']",
  LoginEmailInput: "[data-cy='email-input']",
  passwordLabel: "[data-cy='password-label']",
  passwordInput: "[data-cy='password-input']",
  LoginPasswordInput: '[data-cy="password-input"]',
  signInButton: "[data-cy='sign-in-button']",
  passwordError: "[data-cy='password-error']",
  nameInput: "[data-cy='name-input']",
  nameLabel: '[data-cy="name-input-label"]'
}