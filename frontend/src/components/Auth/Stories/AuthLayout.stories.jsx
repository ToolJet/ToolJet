import React from 'react';
import { AuthLayout } from '../AuthLayout';
import { LoginForm } from '../LoginForm';
import { SetupAdminForm } from '../SetupAdminForm';

export default {
  title: 'Auth/Blocks/AuthLayout',
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

export const WithLoginFormOrganization = {
  args: {
    children: (
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName="Acme Corporation"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Enter password"
        showForgotPassword={true}
        forgotPasswordUrl="/forgot-password"
        forgotPasswordText="Forgot?"
        signinButtonText="Sign in"
        orText="OR"
        showOrSeparator={true}
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
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName="Acme Corporation"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Enter password"
        showForgotPassword={true}
        forgotPasswordUrl="/forgot-password"
        forgotPasswordText="Forgot?"
        signinButtonText="Sign in"
        orText="OR"
        showOrSeparator={true}
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
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName="Acme Corporation"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Enter password"
        showForgotPassword={true}
        forgotPasswordUrl="/forgot-password"
        forgotPasswordText="Forgot?"
        signinButtonText="Sign in"
        orText="OR"
        showOrSeparator={true}
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
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName="Acme Corporation"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Enter password"
        showForgotPassword={true}
        forgotPasswordUrl="/forgot-password"
        forgotPasswordText="Forgot?"
        signinButtonText="Sign in"
        orText="OR"
        showOrSeparator={true}
      />
    ),
  },
};
