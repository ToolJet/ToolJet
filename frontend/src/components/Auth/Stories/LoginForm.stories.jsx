import { LoginForm } from '../LoginForm';

export default {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    signinHeader: {
      control: 'text',
      description: 'The main heading text for the login form',
    },
    signUpText: {
      control: 'text',
      description: 'Text before the sign up link',
    },
    signUpUrl: {
      control: 'text',
      description: 'URL for the sign up link',
    },
    signUpCTA: {
      control: 'text',
      description: 'Call-to-action text for the sign up link',
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
    showForgotPassword: {
      control: 'boolean',
      description: 'Show or hide the forgot password link',
    },
    forgotPasswordUrl: {
      control: 'text',
      description: 'URL for the forgot password link',
    },
    forgotPasswordText: {
      control: 'text',
      description: 'Text for the forgot password link',
    },
    signinButtonText: {
      control: 'text',
      description: 'Text for the submit button',
    },
    orText: {
      control: 'text',
      description: 'Text for the OR separator',
    },
    showOrSeparator: {
      control: 'boolean',
      description: 'Show or hide the OR separator',
    },
    emailValue: {
      control: 'text',
      description: 'Controlled value for email input',
    },
    passwordValue: {
      control: 'text',
      description: 'Controlled value for password input',
    },
    emailError: {
      control: 'text',
      description: 'Error message for email field',
    },
    passwordError: {
      control: 'text',
      description: 'Error message for password field',
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
    onPasswordChange: {
      action: 'password changed',
      description: 'Password input change handler',
    },
  },
};

export const Default = {
  args: {
    signinHeader: 'Sign in',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Sign in',
    orText: 'OR',
    showOrSeparator: true,
  },
};

export const CustomHeader = {
  args: {
    signinHeader: 'Welcome Back',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Sign in',
    orText: 'OR',
    showOrSeparator: true,
  },
};

export const WithErrors = {
  args: {
    signinHeader: 'Sign in',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Sign in',
    orText: 'OR',
    showOrSeparator: true,
    emailValue: 'invalid-email',
    passwordValue: '123',
    emailError: 'Please enter a valid email address',
    passwordError: 'Password must be at least 8 characters',
  },
};

export const Loading = {
  args: {
    signinHeader: 'Sign in',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Signing in...',
    orText: 'OR',
    showOrSeparator: true,
    emailValue: 'user@example.com',
    passwordValue: 'password123',
    isLoading: true,
    disabled: true,
  },
};

export const CustomSeparator = {
  args: {
    signinHeader: 'Sign in',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Sign in',
    orText: 'OR CONTINUE WITH',
    showOrSeparator: true,
  },
};

export const NoSeparator = {
  args: {
    signinHeader: 'Sign in',
    signUpText: 'New to ToolJet?',
    signUpUrl: '#',
    signUpCTA: 'Create an account',
    emailLabel: 'Email',
    emailPlaceholder: 'm@example.com',
    passwordLabel: 'Password',
    showForgotPassword: true,
    forgotPasswordUrl: '/forgot-password',
    forgotPasswordText: 'Forgot?',
    signinButtonText: 'Sign in',
    orText: 'OR',
    showOrSeparator: false,
  },
};

export const Minimal = {
  args: {
    signinHeader: 'Login',
    signUpText: '',
    signUpUrl: '#',
    signUpCTA: '',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    showForgotPassword: false,
    signinButtonText: 'Login',
    orText: 'OR',
    showOrSeparator: false,
  },
};
