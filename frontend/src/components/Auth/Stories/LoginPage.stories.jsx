import React from "react";
import { AuthLayout } from "../AuthLayout";
import { LoginForm } from "../LoginForm";
import { GoogleSigninButton } from "../GoogleSigninButton";
import { GitHubSigninButton } from "../GitHubSigninButton";

export default {
  title: "Auth/LoginPage",
  component: AuthLayout,
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: {
        desktop: {
          name: "Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        mobile: {
          name: "Mobile",
          styles: {
            width: "375px",
            height: "667px",
          },
        },
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Content to be displayed within the auth layout",
    },
  },
};

// Complete Login Page with SSO
export const CompleteLoginPage = {
  args: {
    children: (
      <div className="tw-flex tw-flex-col tw-gap-6 tw-w-full">
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
          emailValue=""
          passwordValue=""
          onEmailChange={() => {}}
          onPasswordChange={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          disabled={false}
        />

        {/* SSO Buttons */}
        <div className="tw-flex tw-flex-col tw-gap-3">
          <GoogleSigninButton
            onClick={() => console.log("Google sign in clicked")}
            text="Continue with"
            dataCy="google-signin-button"
          />
          <GitHubSigninButton
            onClick={() => console.log("GitHub sign in clicked")}
            text="Continue with"
            dataCy="github-signin-button"
          />
        </div>
      </div>
    ),
  },
};

// Login Page with Organization
export const LoginPageWithOrganization = {
  args: {
    children: (
      <div className="tw-flex tw-flex-col tw-gap-6 tw-w-full">
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
          emailValue=""
          passwordValue=""
          onEmailChange={() => {}}
          onPasswordChange={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          disabled={false}
        />

        {/* SSO Buttons */}
        <div className="tw-flex tw-flex-col tw-gap-3">
          <GoogleSigninButton
            onClick={() => console.log("Google sign in clicked")}
            text="Continue with"
            dataCy="google-signin-button"
          />
          <GitHubSigninButton
            onClick={() => console.log("GitHub sign in clicked")}
            text="Continue with"
            dataCy="github-signin-button"
          />
        </div>
      </div>
    ),
  },
};

// Login Page without SSO
export const LoginPageWithoutSSO = {
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
        showOrSeparator={false}
        emailValue=""
        passwordValue=""
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={() => {}}
        isLoading={false}
        disabled={false}
      />
    ),
  },
};
