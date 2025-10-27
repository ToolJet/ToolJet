import React from 'react';
import { AuthLayout } from '../AuthLayout';
import { AuthCenteredLayout } from '../AuthCenteredLayout';
import { SignupFormWithSSO } from '../SignupFormWithSSO';
import { SignupSuccessInfo } from '../SignupSuccessInfo';

export default {
  title: 'Auth/Flows/Signup',
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

// Signup Flow - Step 1: Signup Form with SSO
export const SignupFormFlow = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <SignupFormWithSSO
        signupHeader="Sign up"
        signinText="Already have an account?"
        signinUrl="/login"
        signinCTA="Sign in"
        showSignin={true}
        organizationName=""
        nameLabel="Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create password"
        signupButtonText="Sign up"
        orText="OR"
        showOrSeparator={true}
        showSSOButtons={true}
        googleButtonText="Sign up with"
        githubButtonText="Sign up with"
        onGoogleSignup={() => console.log('Google signup clicked')}
        onGitHubSignup={() => console.log('GitHub signup clicked')}
      />
    ),
  },
};

// Signup Flow - Step 1: With Organization
export const SignupFormWithOrganizationFlow = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <SignupFormWithSSO
        signupHeader="Sign up"
        signinText="Already have an account?"
        signinUrl="/login"
        signinCTA="Sign in"
        showSignin={true}
        organizationName="Acme Corporation"
        nameLabel="Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create password"
        signupButtonText="Sign up"
        orText="OR"
        showOrSeparator={true}
        showSSOButtons={true}
        googleButtonText="Sign up with"
        githubButtonText="Sign up with"
        onGoogleSignup={() => console.log('Google signup clicked')}
        onGitHubSignup={() => console.log('GitHub signup clicked')}
      />
    ),
  },
};

// Signup Flow - Step 2: Signup Confirmation
export const SignupConfirmationFlow = {
  render: (args) => (
    <AuthCenteredLayout {...args}>
      <SignupSuccessInfo
        headerText="Check your mail"
        messageText="We've sent a verification email to"
        email="user@example.com"
        name="John Doe"
        infoText="Did not receive an email? Check your spam folder!"
        showInfo={true}
        resendButtonText="Resend verification email"
        resendCountdownText="Resend verification email in"
        showResendButton={true}
        resendDisabled={false}
        resendCountdown={0}
        onResendEmail={() => console.log('Resend email clicked')}
        backButtonText="Back to sign up"
        onBackToSignup={() => console.log('Back to signup clicked')}
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
