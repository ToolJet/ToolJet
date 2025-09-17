import React from 'react';
import { ForgotPasswordForm } from '../ForgotPasswordForm';

export default {
  title: 'Auth/ForgotPasswordForm',
  component: ForgotPasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    headerText: {
      control: 'text',
      description: 'The main heading text for the forgot password form',
    },
    signupText: {
      control: 'text',
      description: 'Text before the sign up link',
    },
    signupUrl: {
      control: 'text',
      description: 'URL for the sign up link',
    },
    signupCTA: {
      control: 'text',
      description: 'Call-to-action text for the sign up link',
    },
    showSignup: {
      control: 'boolean',
      description: 'Show or hide the signup section',
    },
    emailLabel: {
      control: 'text',
      description: 'Label for the email input field',
    },
    emailPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the email input',
    },
    buttonText: {
      control: 'text',
      description: 'Text for the submit button',
    },
    adminContactText: {
      control: 'text',
      description: 'Text for the admin contact banner',
    },
    showAdminBanner: {
      control: 'boolean',
      description: 'Show or hide the admin contact banner',
    },
    emailValue: {
      control: 'text',
      description: 'Controlled value for email input',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for the form',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state for the form',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Form submission handler',
    },
    onEmailChange: {
      action: 'email changed',
      description: 'Email input change handler',
    },
    emailValidation: {
      control: false,
      description: 'Email validation function',
    },
    emailValidationMessage: {
      control: 'object',
      description: 'External email validation message object',
    },
  },
};

export const Default = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
  },
};

export const CustomHeader = {
  args: {
    headerText: 'Reset Your Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter your work email',
    buttonText: 'Send reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
  },
};

export const NoSignup = {
  args: {
    headerText: 'Forgot Password',
    signupText: '',
    signupUrl: '#',
    signupCTA: '',
    showSignup: false,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
  },
};

export const NoAdminBanner = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: false,
  },
};

export const WithEmailValue = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
    emailValue: 'user@example.com',
  },
};

export const WithValidationError = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
    emailValue: 'invalid-email',
    emailValidationMessage: {
      valid: false,
      message: 'Please enter a valid email address',
    },
  },
};

export const Loading = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Sending...',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
    emailValue: 'user@example.com',
    isLoading: true,
    disabled: true,
  },
};

export const Disabled = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
    disabled: true,
  },
};

export const WithValidation = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact admin to reset your password',
    showAdminBanner: true,
    emailValidation: (e) => {
      const value = e.target.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!value) {
        return { valid: false, message: 'Email is required' };
      }

      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Please enter a valid email address' };
      }

      return { valid: true, message: 'Email looks good!' };
    },
  },
};

export const Minimal = {
  args: {
    headerText: 'Reset Password',
    signupText: '',
    signupUrl: '#',
    signupCTA: '',
    showSignup: false,
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    buttonText: 'Reset',
    adminContactText: '',
    showAdminBanner: false,
  },
};

export const CustomAdminText = {
  args: {
    headerText: 'Forgot Password',
    signupText: 'New to ToolJet?',
    signupUrl: '#',
    signupCTA: 'Create an account',
    showSignup: true,
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email address',
    buttonText: 'Send a reset link',
    adminContactText: 'Contact your system administrator for password reset assistance',
    showAdminBanner: true,
  },
};
