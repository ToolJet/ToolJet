import React from 'react';
import { SignupFormWithSSO } from '../SignupFormWithSSO';

export default {
  title: 'Auth/Blocks/SignupFormWithSSO',
  component: SignupFormWithSSO,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    signupHeader: {
      control: 'text',
      description: 'The main heading text for the signup form',
    },
    signinText: {
      control: 'text',
      description: 'Text for the sign in link',
    },
    signinUrl: {
      control: 'text',
      description: 'URL for the sign in link',
    },
    signinCTA: {
      control: 'text',
      description: 'Call to action text for the sign in link',
    },
    showSignin: {
      control: 'boolean',
      description: 'Show or hide the sign in link',
    },
    organizationName: {
      control: 'text',
      description: 'Name of the organization to display',
    },
    nameLabel: {
      control: 'text',
      description: 'Label for the name input field',
    },
    namePlaceholder: {
      control: 'text',
      description: 'Placeholder text for the name input field',
    },
    emailLabel: {
      control: 'text',
      description: 'Label for the email input field',
    },
    emailPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the email input field',
    },
    passwordLabel: {
      control: 'text',
      description: 'Label for the password input field',
    },
    passwordPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the password input field',
    },
    signupButtonText: {
      control: 'text',
      description: 'Text for the signup button',
    },
    orText: {
      control: 'text',
      description: 'Text for the OR separator',
    },
    showOrSeparator: {
      control: 'boolean',
      description: 'Show or hide the OR separator',
    },
    showSSOButtons: {
      control: 'boolean',
      description: 'Show or hide the SSO buttons',
    },
    googleButtonText: {
      control: 'text',
      description: 'Text for the Google signup button',
    },
    githubButtonText: {
      control: 'text',
      description: 'Text for the GitHub signup button',
    },
    onGoogleSignup: {
      action: 'google signup clicked',
      description: 'Google signup button handler',
    },
    onGitHubSignup: {
      action: 'github signup clicked',
      description: 'GitHub signup button handler',
    },
    onSubmit: {
      action: 'form submitted',
      description: 'Form submission handler',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for the form',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state for the form',
    },
  },
};

export const Default = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: true,
    organizationName: '',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: false,
    disabled: false,
  },
};

export const WithOrganization = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: true,
    organizationName: 'Acme Corporation',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: false,
    disabled: false,
  },
};

export const WithoutSSO = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: true,
    organizationName: '',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: false,
    showSSOButtons: false,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: false,
    disabled: false,
  },
};

export const WithoutSigninLink = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: false,
    organizationName: '',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: false,
    disabled: false,
  },
};

export const Loading = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: true,
    organizationName: '',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: true,
    disabled: false,
  },
};

export const Disabled = {
  args: {
    signupHeader: 'Sign up',
    signinText: 'Already have an account?',
    signinUrl: '/login',
    signinCTA: 'Sign in',
    showSignin: true,
    organizationName: '',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create password',
    signupButtonText: 'Sign up',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Sign up with',
    githubButtonText: 'Sign up with',
    isLoading: false,
    disabled: true,
  },
};

export const CustomTexts = {
  args: {
    signupHeader: 'Create Account',
    signinText: 'Have an existing account?',
    signinUrl: '/login',
    signinCTA: 'Log in',
    showSignin: true,
    organizationName: 'TechCorp',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your complete name',
    emailLabel: 'Work Email',
    emailPlaceholder: 'Enter your company email',
    passwordLabel: 'Secure Password',
    passwordPlaceholder: 'Create a strong password',
    signupButtonText: 'Create Account',
    orText: 'OR',
    showOrSeparator: true,
    showSSOButtons: true,
    googleButtonText: 'Continue with',
    githubButtonText: 'Continue with',
    isLoading: false,
    disabled: false,
  },
};
