import React from 'react';
import { AuthCenteredLayout } from '../AuthCenteredLayout';
import { LoginForm } from '../LoginForm';
import { SignupSuccessInfo } from '../SignupSuccessInfo';
import { ForgotPasswordInfoScreen } from '../ForgotPasswordInfoScreen';

export default {
  title: 'Auth/AuthCenteredLayout',
  component: AuthCenteredLayout,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      viewports: {
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description: 'Content to be displayed within the centered auth layout',
    },
  },
};

// Signup Success Examples
export const WithSignupSuccess = {
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="john.doe@example.com"
        name="John"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={false}
        resendCountdown={0}
        backButtonText="Back to sign up"
        showSeparator={true}
      />
    ),
  },
};

export const WithSignupSuccessWithCountdown = {
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="jane.smith@example.com"
        name="Jane"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={true}
        resendCountdown={45}
        backButtonText="Back to sign up"
        showSeparator={true}
      />
    ),
  },
};

export const WithSignupSuccessMinimal = {
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Email sent"
        messageText="Verification email sent to"
        email="user@example.com"
        name=""
        infoText=""
        showInfo={false}
        resendButtonText=""
        resendCountdownText=""
        showResendButton={false}
        resendDisabled={false}
        resendCountdown={0}
        backButtonText="Back to sign up"
        showSeparator={false}
      />
    ),
  },
};

// Forgot Password Examples
export const WithForgotPasswordInfo = {
  args: {
    children: (
      <ForgotPasswordInfoScreen
        headerText="Check your mail"
        messageText="We've sent a password reset link to"
        email="user@example.com"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        buttonText="Back to login"
        showSeparator={true}
      />
    ),
  },
};

export const WithForgotPasswordInfoMinimal = {
  args: {
    children: (
      <ForgotPasswordInfoScreen
        headerText="Email sent"
        messageText="Password reset link sent to"
        email="user@example.com"
        infoText=""
        showInfo={false}
        buttonText="Back to login"
        showSeparator={false}
      />
    ),
  },
};

// Responsive Examples
export const DesktopView = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="john.doe@example.com"
        name="John"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={false}
        resendCountdown={0}
        backButtonText="Back to sign up"
        showSeparator={true}
      />
    ),
  },
};

export const TabletView = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="john.doe@example.com"
        name="John"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={false}
        resendCountdown={0}
        backButtonText="Back to sign up"
        showSeparator={true}
      />
    ),
  },
};

export const MobileView = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  args: {
    children: (
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="john.doe@example.com"
        name="John"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={false}
        resendCountdown={0}
        backButtonText="Back to sign up"
        showSeparator={true}
      />
    ),
  },
};

