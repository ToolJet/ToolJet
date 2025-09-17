import { LoginForm } from "../LoginForm";

export default {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    signinHeader: {
      control: "text",
      description: "The main heading text for the login form",
    },
    signUpText: {
      control: "text",
      description: "Text before the sign up link",
    },
    signUpUrl: {
      control: "text",
      description: "URL for the sign up link",
    },
    signUpCTA: {
      control: "text",
      description: "Call-to-action text for the sign up link",
    },
    showSignup: {
      control: "boolean",
      description: "Show or hide the signup section",
    },
    organizationName: {
      control: "text",
      description: "Organization name to display in the header",
    },
    emailLabel: {
      control: "text",
      description: "Label for the email input field",
    },
    emailPlaceholder: {
      control: "text",
      description: "Placeholder text for the email input",
    },
    passwordLabel: {
      control: "text",
      description: "Label for the password input field",
    },
    passwordPlaceholder: {
      control: "text",
      description: "Placeholder text for the password input",
    },
    showForgotPassword: {
      control: "boolean",
      description: "Show or hide the forgot password link",
    },
    forgotPasswordUrl: {
      control: "text",
      description: "URL for the forgot password link",
    },
    forgotPasswordText: {
      control: "text",
      description: "Text for the forgot password link",
    },
    signinButtonText: {
      control: "text",
      description: "Text for the submit button",
    },
    orText: {
      control: "text",
      description: "Text for the OR separator",
    },
    showOrSeparator: {
      control: "boolean",
      description: "Show or hide the OR separator",
    },
    emailValue: {
      control: "text",
      description: "Controlled value for email input",
    },
    passwordValue: {
      control: "text",
      description: "Controlled value for password input",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state for the form",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state for the form",
    },
    onSubmit: {
      action: "submitted",
      description: "Form submission handler",
    },
    onEmailChange: {
      action: "email changed",
      description: "Email input change handler",
    },
    onPasswordChange: {
      action: "password changed",
      description: "Password input change handler",
    },
    emailValidation: {
      control: false,
      description: "Email validation function",
    },
    passwordValidation: {
      control: false,
      description: "Password validation function",
    },
    emailValidationMessage: {
      control: "object",
      description: "External email validation message object",
    },
    passwordValidationMessage: {
      control: "object",
      description: "External password validation message object",
    },
  },
};

export const Default = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const CustomHeader = {
  args: {
    signinHeader: "Welcome Back",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const WithOrganization = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "Acme Corporation",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const OrganizationOnly = {
  args: {
    signinHeader: "Sign in",
    signUpText: "",
    signUpUrl: "#",
    signUpCTA: "",
    showSignup: false,
    organizationName: "TechCorp Inc.",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const LongOrganizationName = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "Very Long Organization Name That Might Wrap",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const OrganizationWithSpecialChars = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "Acme & Co. (Ltd.)",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const EmptyOrganizationName = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    showSignup: true,
    organizationName: "",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const NoOrganizationNoSignup = {
  args: {
    signinHeader: "Sign in",
    signUpText: "",
    signUpUrl: "#",
    signUpCTA: "",
    showSignup: false,
    organizationName: "",
    emailLabel: "Email",
    emailPlaceholder: "Enter your work email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
  },
};

export const WithErrors = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
    emailValue: "invalid-email",
    passwordValue: "123",
    emailValidationMessage: {
      valid: false,
      message: "Please enter a valid email address",
    },
    passwordValidationMessage: {
      valid: false,
      message: "Password must be at least 8 characters",
    },
  },
};

export const Loading = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Signing in...",
    orText: "OR",
    showOrSeparator: true,
    emailValue: "user@example.com",
    passwordValue: "password123",
    isLoading: true,
    disabled: true,
  },
};

export const CustomSeparator = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR CONTINUE WITH",
    showOrSeparator: true,
  },
};

export const NoSeparator = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: false,
  },
};

export const Minimal = {
  args: {
    signinHeader: "Login",
    signUpText: "",
    signUpUrl: "#",
    signUpCTA: "",
    showSignup: false,
    organizationName: "",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    showForgotPassword: false,
    signinButtonText: "Login",
    orText: "OR",
    showOrSeparator: false,
  },
};

export const WithValidation = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
    emailValidation: (e) => {
      const value = e.target.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!value) {
        return { valid: false, message: "Email is required" };
      }

      if (!emailRegex.test(value)) {
        return { valid: false, message: "Please enter a valid email address" };
      }

      return { valid: true, message: "Email looks good!" };
    },
    passwordValidation: (e) => {
      const value = e.target.value;

      if (!value) {
        return { valid: false, message: "Password is required" };
      }

      if (value.length < 8) {
        return {
          valid: false,
          message: "Password must be at least 8 characters",
        };
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return {
          valid: false,
          message: "Password must contain uppercase, lowercase, and number",
        };
      }

      return { valid: true, message: "Password is strong!" };
    },
  },
};

export const WithExternalValidation = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
    emailValue: "user@example.com",
    passwordValue: "password123",
    emailValidationMessage: {
      valid: true,
      message: "Email is valid and available",
    },
    passwordValidationMessage: {
      valid: true,
      message: "Password meets all requirements",
    },
  },
};

export const WithValidationErrors = {
  args: {
    signinHeader: "Sign in",
    signUpText: "New to ToolJet?",
    signUpUrl: "#",
    signUpCTA: "Create an account",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    passwordLabel: "Password",
    showForgotPassword: true,
    forgotPasswordUrl: "/forgot-password",
    forgotPasswordText: "Forgot?",
    signinButtonText: "Sign in",
    orText: "OR",
    showOrSeparator: true,
    emailValue: "invalid-email",
    passwordValue: "123",
    emailValidationMessage: {
      valid: false,
      message: "Please enter a valid email address",
    },
    passwordValidationMessage: {
      valid: false,
      message: "Password must be at least 8 characters",
    },
  },
};
