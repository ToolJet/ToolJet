import React from 'react';
import { SignupSuccessInfo } from '../SignupSuccessInfo';

export default {
  title: 'Auth/SignupSuccessInfo',
  component: SignupSuccessInfo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    headerText: {
      control: 'text',
      description: 'The main heading text for the signup success screen',
    },
    messageText: {
      control: 'text',
      description: 'Main message text',
    },
    email: {
      control: 'text',
      description: 'Email address to display in the message',
    },
    name: {
      control: 'text',
      description: 'User name to display in the message',
    },
    infoText: {
      control: 'text',
      description: 'Additional info text',
    },
    showInfo: {
      control: 'boolean',
      description: 'Show or hide the info text',
    },
    resendButtonText: {
      control: 'text',
      description: 'Text for the resend verification email button',
    },
    resendCountdownText: {
      control: 'text',
      description: 'Text for the resend countdown',
    },
    showResendButton: {
      control: 'boolean',
      description: 'Show or hide the resend button',
    },
    resendDisabled: {
      control: 'boolean',
      description: 'Disabled state for the resend button',
    },
    resendCountdown: {
      control: 'number',
      description: 'Countdown value for resend button',
    },
    backButtonText: {
      control: 'text',
      description: 'Text for the back to signup button',
    },
    onBackToSignup: {
      action: 'back to signup clicked',
      description: 'Back to signup button handler',
    },
    showSeparator: {
      control: 'boolean',
      description: 'Show or hide the separator',
    },
  },
};

export const Default = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const CustomHeader = {
  args: {
    headerText: 'Account Created Successfully',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const WithEmailOnly = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: '',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const WithNameOnly = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to your registered email address",
    email: '',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const LongEmail = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'very.long.email.address@verylongdomainname.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const NoInfo = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: '',
    showInfo: false,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const NoResendButton = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: false,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const ResendDisabled = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: true,
    resendCountdown: 15,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};

export const NoSeparator = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: false,
  },
};

export const CustomMessage = {
  args: {
    headerText: 'Account Created',
    messageText: 'A verification email has been sent to your email address',
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Please check your inbox and follow the instructions to verify your account',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Return to signup',
    showSeparator: true,
  },
};

export const Minimal = {
  args: {
    headerText: 'Email Sent',
    messageText: 'Check your email for verification instructions',
    email: '',
    name: '',
    infoText: '',
    showInfo: false,
    resendButtonText: 'Resend',
    resendCountdownText: 'Resend in',
    showResendButton: false,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back',
    showSeparator: false,
  },
};

export const CustomButtonTexts = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a verification email to",
    email: 'user@example.com',
    name: 'John Doe',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    resendButtonText: 'Send another verification email',
    resendCountdownText: 'Send another email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Return to registration',
    showSeparator: true,
  },
};

export const LongMessage = {
  args: {
    headerText: 'Check your mail',
    messageText:
      "We've sent a verification email to your registered email address. Please check your inbox and click the link to verify your account and continue with the setup process",
    email: 'user@example.com',
    name: 'John Doe',
    infoText:
      'Did not receive an email? Please check your spam folder or contact support if you continue to have issues with email delivery',
    showInfo: true,
    resendButtonText: 'Resend verification email',
    resendCountdownText: 'Resend verification email in',
    showResendButton: true,
    resendDisabled: false,
    resendCountdown: 0,
    backButtonText: 'Back to sign up',
    showSeparator: true,
  },
};
