import React from 'react';
import { SetupAdminForm } from '../SetupAdminForm';

export default {
  title: 'Auth/SetupAdminForm',
  component: SetupAdminForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    headerText: {
      control: 'text',
      description: 'The main heading text for the setup admin form',
    },
    nameLabel: {
      control: 'text',
      description: 'Label for the name input field',
    },
    namePlaceholder: {
      control: 'text',
      description: 'Placeholder text for the name input',
    },
    emailLabel: {
      control: 'text',
      description: 'Label for the email input field',
    },
    emailPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the email input',
    },
    passwordLabel: {
      control: 'text',
      description: 'Label for the password input field',
    },
    passwordPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the password input',
    },
    buttonText: {
      control: 'text',
      description: 'Text for the submit button',
    },
    termsText: {
      control: 'text',
      description: 'Text for the terms and privacy notice',
    },
    showTerms: {
      control: 'boolean',
      description: 'Show or hide the terms and privacy notice',
    },
    nameValue: {
      control: 'text',
      description: 'Controlled value for name input',
    },
    emailValue: {
      control: 'text',
      description: 'Controlled value for email input',
    },
    passwordValue: {
      control: 'text',
      description: 'Controlled value for password input',
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
    onNameChange: {
      action: 'name changed',
      description: 'Name input change handler',
    },
    onEmailChange: {
      action: 'email changed',
      description: 'Email input change handler',
    },
    onPasswordChange: {
      action: 'password changed',
      description: 'Password input change handler',
    },
    nameValidation: {
      control: false,
      description: 'Name validation function',
    },
    emailValidation: {
      control: false,
      description: 'Email validation function',
    },
    passwordValidation: {
      control: false,
      description: 'Password validation function',
    },
    nameValidationMessage: {
      control: 'object',
      description: 'External name validation message object',
    },
    emailValidationMessage: {
      control: 'object',
      description: 'External email validation message object',
    },
    passwordValidationMessage: {
      control: 'object',
      description: 'External password validation message object',
    },
  },
};

export const Default = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
  },
};

export const CustomHeader = {
  args: {
    headerText: 'Create Admin Account',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Work Email',
    emailPlaceholder: 'Enter your work email address',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a secure password',
    buttonText: 'Create Account',
    termsText: 'By creating an account, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
  },
};

export const WithValues = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
    nameValue: 'John Doe',
    emailValue: 'john.doe@company.com',
    passwordValue: 'SecurePassword123!',
  },
};

export const WithValidationErrors = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
    nameValue: '',
    emailValue: 'invalid-email',
    passwordValue: '123',
    nameValidationMessage: {
      valid: false,
      message: 'Name is required',
    },
    emailValidationMessage: {
      valid: false,
      message: 'Please enter a valid email address',
    },
    passwordValidationMessage: {
      valid: false,
      message: 'Password must be at least 8 characters',
    },
  },
};

export const Loading = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Creating Account...',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
    nameValue: 'John Doe',
    emailValue: 'john.doe@company.com',
    passwordValue: 'SecurePassword123!',
    isLoading: true,
    disabled: true,
  },
};

export const Disabled = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
    disabled: true,
  },
};

export const NoTerms = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: '',
    showTerms: false,
  },
};

export const WithValidation = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    showTerms: true,
    nameValidation: (e) => {
      const value = e.target.value;
      if (!value.trim()) {
        return { valid: false, message: 'Name is required' };
      }
      if (value.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
      }
      return { valid: true, message: 'Name looks good!' };
    },
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
    passwordValidation: (e) => {
      const value = e.target.value;
      if (!value) {
        return { valid: false, message: 'Password is required' };
      }
      if (value.length < 8) {
        return {
          valid: false,
          message: 'Password must be at least 8 characters',
        };
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return {
          valid: false,
          message: 'Password must contain uppercase, lowercase, and number',
        };
      }
      return { valid: true, message: 'Password is strong!' };
    },
  },
};

export const Minimal = {
  args: {
    headerText: 'Admin Setup',
    nameLabel: 'Name',
    namePlaceholder: 'Enter name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Setup',
    termsText: '',
    showTerms: false,
  },
};

export const CustomTerms = {
  args: {
    headerText: 'Set up your admin account',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your work email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    buttonText: 'Sign up',
    termsText:
      'By creating an admin account, you acknowledge that you have read and agree to our Terms of Service, Privacy Policy, and Data Processing Agreement.',
    showTerms: true,
  },
};
