import React from 'react';
import { AuthLayout } from '../AuthLayout';
import { LoginForm } from '../LoginForm';
import { SetupAdminForm } from '../SetupAdminForm';

export default {
  title: 'Auth/AuthLayout',
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

// Login Form Examples
export const WithLoginForm = {
  args: {
    children: (
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName=""
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

export const WithLoginFormLoading = {
  args: {
    children: (
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName=""
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Enter password"
        showForgotPassword={true}
        forgotPasswordUrl="/forgot-password"
        forgotPasswordText="Forgot?"
        signinButtonText="Signing in..."
        orText="OR"
        showOrSeparator={true}
        emailValue="user@example.com"
        passwordValue="password123"
        isLoading={true}
        disabled={true}
      />
    ),
  },
};

// Signup Form Examples (using SetupAdminForm)
export const WithSignupForm = {
  args: {
    children: (
      <SetupAdminForm
        headerText="Create your account"
        nameLabel="Full Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create a password"
        buttonText="Create account"
        termsText="By creating an account, you agree to our Terms of Service and Privacy Policy"
        showTerms={true}
      />
    ),
  },
};

export const WithSignupFormLoading = {
  args: {
    children: (
      <SetupAdminForm
        headerText="Create your account"
        nameLabel="Full Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create a password"
        buttonText="Creating account..."
        termsText="By creating an account, you agree to our Terms of Service and Privacy Policy"
        showTerms={true}
        nameValue="John Doe"
        emailValue="john@example.com"
        passwordValue="password123"
        isLoading={true}
        disabled={true}
      />
    ),
  },
};

// Form with Validation Examples
export const WithLoginFormValidation = {
  args: {
    children: (
      <LoginForm
        signinHeader="Sign in"
        signUpText="New to ToolJet?"
        signUpUrl="#"
        signUpCTA="Create an account"
        showSignup={true}
        organizationName=""
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
        emailValue="invalid-email"
        passwordValue="123"
        emailValidationMessage={{
          valid: false,
          message: 'Please enter a valid email address',
        }}
        passwordValidationMessage={{
          valid: false,
          message: 'Password must be at least 8 characters',
        }}
      />
    ),
  },
};

export const WithSignupFormValidation = {
  args: {
    children: (
      <SetupAdminForm
        headerText="Create your account"
        nameLabel="Full Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create a password"
        buttonText="Create account"
        termsText="By creating an account, you agree to our Terms of Service and Privacy Policy"
        showTerms={true}
        nameValue=""
        emailValue="invalid-email"
        passwordValue="123"
        nameValidationMessage={{
          valid: false,
          message: 'Name is required',
        }}
        emailValidationMessage={{
          valid: false,
          message: 'Please enter a valid email address',
        }}
        passwordValidationMessage={{
          valid: false,
          message: 'Password must be at least 8 characters',
        }}
      />
    ),
  },
};

// Empty State Example
export const WithEmptyState = {
  args: {
    children: (
      <div className="tw-flex tw-flex-col tw-gap-6 tw-items-center tw-text-center">
        <div className="tw-flex tw-flex-col tw-gap-2">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0">Getting Started</h1>
          <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0">Welcome to your new workspace</p>
        </div>
        <div className="tw-w-full tw-max-w-xs">
          <button
            type="button"
            className="tw-w-full tw-px-4 tw-py-3 tw-bg-button-primary tw-text-button-primary-text tw-rounded-md tw-text-sm tw-font-medium hover:tw-bg-button-primary-hover"
          >
            Get Started
          </button>
        </div>
      </div>
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

// Responsive Signup Examples
export const DesktopSignupView = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <SetupAdminForm
        headerText="Create your account"
        nameLabel="Full Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create a password"
        buttonText="Create account"
        termsText="By creating an account, you agree to our Terms of Service and Privacy Policy"
        showTerms={true}
      />
    ),
  },
};

export const TabletSignupView = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    children: (
      <SetupAdminForm
        headerText="Create your account"
        nameLabel="Full Name"
        namePlaceholder="Enter your full name"
        emailLabel="Email"
        emailPlaceholder="Enter your work email"
        passwordLabel="Password"
        passwordPlaceholder="Create a password"
        buttonText="Create account"
        termsText="By creating an account, you agree to our Terms of Service and Privacy Policy"
        showTerms={true}
      />
    ),
  },
};
