import React from 'react';
import { ForgotPasswordInfoScreen } from '../ForgotPasswordInfoScreen';

export default {
  title: 'Auth/ForgotPasswordInfoScreen',
  component: ForgotPasswordInfoScreen,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    headerText: {
      control: 'text',
      description: 'The main heading text for the info screen',
    },
    messageText: {
      control: 'text',
      description: 'Main message text',
    },
    email: {
      control: 'text',
      description: 'Email address to display in the message',
    },
    infoText: {
      control: 'text',
      description: 'Additional info text',
    },
    showInfo: {
      control: 'boolean',
      description: 'Show or hide the info text',
    },
    buttonText: {
      control: 'text',
      description: 'Text for the back to login button',
    },
    onBackToLogin: {
      action: 'back to login clicked',
      description: 'Back to login button handler',
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
    messageText: "We've sent a password reset link to",
    email: 'user@example.com',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};

export const CustomHeader = {
  args: {
    headerText: 'Password Reset Sent',
    messageText: "We've sent a password reset link to",
    email: 'user@example.com',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};

export const LongEmail = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a password reset link to",
    email: 'very.long.email.address@verylongdomainname.com',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};

export const NoEmail = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a password reset link to your registered email address",
    email: '',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};

export const NoInfo = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a password reset link to",
    email: 'user@example.com',
    infoText: '',
    showInfo: false,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};

export const NoSeparator = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a password reset link to",
    email: 'user@example.com',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: false,
  },
};

export const CustomMessage = {
  args: {
    headerText: 'Check your mail',
    messageText: 'A password reset link has been sent to your email address',
    email: 'user@example.com',
    infoText: 'Please check your inbox and follow the instructions to reset your password',
    showInfo: true,
    buttonText: 'Return to login',
    showSeparator: true,
  },
};

export const Minimal = {
  args: {
    headerText: 'Email Sent',
    messageText: 'Check your email for reset instructions',
    email: '',
    infoText: '',
    showInfo: false,
    buttonText: 'Back',
    showSeparator: false,
  },
};

export const CustomButtonText = {
  args: {
    headerText: 'Check your mail',
    messageText: "We've sent a password reset link to",
    email: 'user@example.com',
    infoText: 'Did not receive an email? Check your spam folder!',
    showInfo: true,
    buttonText: 'Return to sign in',
    showSeparator: true,
  },
};

export const LongMessage = {
  args: {
    headerText: 'Check your mail',
    messageText:
      "We've sent a password reset link to your registered email address. Please check your inbox and click the link to reset your password",
    email: 'user@example.com',
    infoText:
      'Did not receive an email? Please check your spam folder or contact support if you continue to have issues',
    showInfo: true,
    buttonText: 'Back to login',
    showSeparator: true,
  },
};
