import React from 'react';
import { AuthLayout } from '../AuthLayout';
import { AuthCenteredLayout } from '../AuthCenteredLayout';
import { ForgotPasswordForm } from '../ForgotPasswordForm';
import { ForgotPasswordInfoScreen } from '../ForgotPasswordInfoScreen';

export default {
  title: 'Auth/Flows/ForgotPassword',
  component: AuthLayout,
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
      description: 'Content to be displayed within the auth layout',
    },
  },
};

// Forgot Password Flow - Form
export const ForgotPasswordFlow = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <ForgotPasswordForm
        headerText="Forgot Password"
        signupText="New to ToolJet?"
        signupUrl="#"
        signupCTA="Create an account"
        showSignup={true}
        emailLabel="Email address"
        emailPlaceholder="Enter email address"
        buttonText="Send a reset link"
        adminContactText="Contact admin to reset your password"
        showAdminBanner={true}
      />
    ),
  },
};

// Forgot Password Flow - Info Screen
export const ForgotPasswordInfoFlow = {
  render: (args) => (
    <AuthCenteredLayout {...args}>
      <ForgotPasswordInfoScreen
        headerText="Check your mail"
        messageText="We've sent a password reset link to"
        email="user@example.com"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        buttonText="Back to login"
        showSeparator={true}
      />
    </AuthCenteredLayout>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
