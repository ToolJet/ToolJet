// eslint-disable-next-line no-unused-vars
import * as React from 'react';
import InputComponent from './Index';
import EditableTitleInput from './EditableTitleInput/Index';
import { ValidationMessage } from './InputUtils/InputUtils';

// Storybook configuration
export default {
  title: 'Components/Input',
  component: InputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      options: ['text', 'number', 'password', 'email'],
      control: {
        type: 'select',
      },
    },
    value: {
      control: 'text',
    },
    onChange: {
      control: 'function',
    },
    placeholder: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: {
        type: 'select',
      },
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      if: { arg: 'disabled' },
      control: 'text',
    },
    validation: {
      control: 'function',
    },
    label: {
      control: 'text',
    },
    'aria-label': {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    leadingIcon: {
      control: 'text',
    },
    trailingAction: {
      options: ['clear', 'loading'],
      control: 'radio',
    },
    trailingActionDisabled: {
      if: { arg: 'trailingAction', eq: 'clear' },
      control: 'boolean',
    },
    helperText: {
      control: 'text',
    },
  },
};

const Template = (args) => <InputComponent {...args} />;

// Size Variants
export const SizeVariants = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Small (28px height, 12px/18px text)</h3>
      <InputComponent size="small" placeholder="Small input" label="Small Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Medium (32px height, 12px/18px text)</h3>
      <InputComponent size="medium" placeholder="Medium input" label="Medium Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Large (40px height, 14px/20px text)</h3>
      <InputComponent size="large" placeholder="Large input" label="Large Input" />
    </div>
  </div>
);

// Input Types
export const InputTypes = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Text Input</h3>
      <InputComponent type="text" placeholder="Enter text" label="Text Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Number Input</h3>
      <InputComponent type="number" placeholder="00.00" label="Number Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Password Input</h3>
      <InputComponent type="password" placeholder="Enter password" label="Password Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Email Input</h3>
      <InputComponent type="email" placeholder="Enter email" label="Email Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Editable Title</h3>
      <EditableTitleInput placeholder="Editable title" label="Editable Title" />
    </div>
  </div>
);

// States
export const InputStates = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Default</h3>
      <InputComponent placeholder="Default state" label="Default Input" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Disabled</h3>
      <InputComponent placeholder="Disabled state" label="Disabled Input" disabled />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Required</h3>
      <InputComponent placeholder="Required field" label="Required Input" required />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Helper Text</h3>
      <InputComponent placeholder="With helper text" label="Input with Helper" helperText="This is helper text" />
    </div>
  </div>
);

// Validation States
export const ValidationStates = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Default (No Validation)</h3>
      <InputComponent placeholder="Default state" label="Default Input" response={null} />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Success State</h3>
      <InputComponent placeholder="Valid input" label="Success Input" response={true} helperText="Input is valid" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Error State</h3>
      <InputComponent
        placeholder="Invalid input"
        label="Error Input"
        response={false}
        helperText="Input has an error"
      />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Success with Icon</h3>
      <InputComponent
        placeholder="Valid email"
        label="Email Input"
        leadingIcon="mail"
        response={true}
        helperText="Email format is correct"
      />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Error with Icon</h3>
      <InputComponent
        placeholder="Invalid email"
        label="Email Input"
        leadingIcon="mail"
        response={false}
        helperText="Please enter a valid email"
      />
    </div>
  </div>
);

// Validation States - All Sizes
export const ValidationStatesSizes = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Small Size Validation States</h3>
      <div className="tw-space-y-3">
        <InputComponent size="small" placeholder="Default" label="Default" response={null} />
        <InputComponent size="small" placeholder="Success" label="Success" response={true} helperText="Valid input" />
        <InputComponent size="small" placeholder="Error" label="Error" response={false} helperText="Invalid input" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Medium Size Validation States</h3>
      <div className="tw-space-y-3">
        <InputComponent size="medium" placeholder="Default" label="Default" response={null} />
        <InputComponent size="medium" placeholder="Success" label="Success" response={true} helperText="Valid input" />
        <InputComponent size="medium" placeholder="Error" label="Error" response={false} helperText="Invalid input" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Large Size Validation States</h3>
      <div className="tw-space-y-3">
        <InputComponent size="large" placeholder="Default" label="Default" response={null} />
        <InputComponent size="large" placeholder="Success" label="Success" response={true} helperText="Valid input" />
        <InputComponent size="large" placeholder="Error" label="Error" response={false} helperText="Invalid input" />
      </div>
    </div>
  </div>
);

// Validation States - All Input Types
export const ValidationStatesTypes = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Text Input Validation</h3>
      <div className="tw-space-y-3">
        <InputComponent type="text" placeholder="Default" label="Text Input" response={null} />
        <InputComponent
          type="text"
          placeholder="Valid text"
          label="Text Input"
          response={true}
          helperText="Text is valid"
        />
        <InputComponent
          type="text"
          placeholder="Invalid text"
          label="Text Input"
          response={false}
          helperText="Text is invalid"
        />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Number Input Validation</h3>
      <div className="tw-space-y-3">
        <InputComponent type="number" placeholder="00.00" label="Number Input" response={null} />
        <InputComponent
          type="number"
          placeholder="00.00"
          label="Number Input"
          response={true}
          helperText="Valid number"
        />
        <InputComponent
          type="number"
          placeholder="00.00"
          label="Number Input"
          response={false}
          helperText="Invalid number"
        />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Password Input Validation</h3>
      <div className="tw-space-y-3">
        <InputComponent type="password" placeholder="Enter password" label="Password" response={null} />
        <InputComponent
          type="password"
          placeholder="Enter password"
          label="Password"
          response={true}
          helperText="Strong password"
        />
        <InputComponent
          type="password"
          placeholder="Enter password"
          label="Password"
          response={false}
          helperText="Password too weak"
        />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Email Input Validation</h3>
      <div className="tw-space-y-3">
        <InputComponent type="email" placeholder="Enter email" label="Email" response={null} />
        <InputComponent
          type="email"
          placeholder="user@example.com"
          label="Email"
          response={true}
          helperText="Valid email format"
        />
        <InputComponent
          type="email"
          placeholder="invalid-email"
          label="Email"
          response={false}
          helperText="Invalid email format"
        />
      </div>
    </div>
  </div>
);

// Validation with ValidationMessage Component
export const WithValidationMessages = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Success Validation Messages</h3>
      <div className="tw-space-y-4">
        <div>
          <InputComponent type="text" size="small" placeholder="Enter username" label="Username" response={true} />
          <ValidationMessage response={true} validationMessage="Username is available" />
        </div>
        <div>
          <InputComponent type="email" size="medium" placeholder="Enter email" label="Email Address" response={true} />
          <ValidationMessage response={true} validationMessage="Email format is correct" />
        </div>
        <div>
          <InputComponent type="password" size="large" placeholder="Enter password" label="Password" response={true} />
          <ValidationMessage response={true} validationMessage="Strong password with special characters" />
        </div>
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Error Validation Messages</h3>
      <div className="tw-space-y-4">
        <div>
          <InputComponent type="text" size="small" placeholder="Enter username" label="Username" response={false} />
          <ValidationMessage response={false} validationMessage="Username already exists" />
        </div>
        <div>
          <InputComponent type="email" size="medium" placeholder="Enter email" label="Email Address" response={false} />
          <ValidationMessage response={false} validationMessage="Please enter a valid email address" />
        </div>
        <div>
          <InputComponent type="password" size="large" placeholder="Enter password" label="Password" response={false} />
          <ValidationMessage response={false} validationMessage="Password must be at least 8 characters" />
        </div>
      </div>
    </div>
  </div>
);

// Validation Messages - Complex Examples
export const ValidationMessagesComplex = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Form Validation Example</h3>
      <div className="tw-space-y-4 tw-max-w-md">
        <div>
          <InputComponent type="text" placeholder="John Doe" label="Full Name" response={true} />
          <ValidationMessage response={true} validationMessage="Name looks good" />
        </div>
        <div>
          <InputComponent
            type="email"
            placeholder="john.doe@example.com"
            label="Email Address"
            leadingIcon="mail"
            response={true}
          />
          <ValidationMessage response={true} validationMessage="Valid email format" />
        </div>
        <div>
          <InputComponent type="number" placeholder="30" label="Age" response={false} />
          <ValidationMessage response={false} validationMessage="Age must be between 18 and 65" />
        </div>
        <div>
          <InputComponent type="password" placeholder="Enter password" label="Password" response={false} />
          <ValidationMessage
            response={false}
            validationMessage="Password must contain uppercase, lowercase, number and special character"
          />
        </div>
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Real-time Validation Example</h3>
      <div className="tw-space-y-4 tw-max-w-md">
        <div>
          <InputComponent
            type="text"
            placeholder="myusername"
            label="Username"
            leadingIcon="user"
            trailingAction="clear"
            response={true}
          />
          <ValidationMessage response={true} validationMessage="Username is available and meets requirements" />
        </div>
        <div>
          <InputComponent
            type="text"
            placeholder="abc"
            label="Username"
            leadingIcon="user"
            trailingAction="clear"
            response={false}
          />
          <ValidationMessage response={false} validationMessage="Username must be at least 5 characters long" />
        </div>
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Multiple Validation States</h3>
      <div className="tw-space-y-4 tw-max-w-md">
        <div>
          <InputComponent type="number" size="small" placeholder="100.00" label="Amount (USD)" response={true} />
          <ValidationMessage response={true} validationMessage="Amount within valid range" />
        </div>
        <div>
          <InputComponent type="number" size="small" placeholder="10000.00" label="Amount (USD)" response={false} />
          <ValidationMessage response={false} validationMessage="Amount exceeds maximum limit of $5,000" />
        </div>
        <div>
          <InputComponent
            type="text"
            size="medium"
            placeholder="https://example.com"
            label="Website URL"
            leadingIcon="link"
            response={true}
          />
          <ValidationMessage response={true} validationMessage="Valid URL format" />
        </div>
        <div>
          <InputComponent
            type="text"
            size="medium"
            placeholder="not-a-url"
            label="Website URL"
            leadingIcon="link"
            response={false}
          />
          <ValidationMessage
            response={false}
            validationMessage="Please enter a valid URL (e.g., https://example.com)"
          />
        </div>
      </div>
    </div>
  </div>
);

// With Icons and Actions
export const WithIconsAndActions = () => (
  <div className="tw-space-y-4">
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Leading Icon</h3>
      <InputComponent placeholder="Search..." label="Search Input" leadingIcon="search" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Clear Action</h3>
      <InputComponent placeholder="Clearable input" label="Clearable Input" trailingAction="clear" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Loading Action</h3>
      <InputComponent placeholder="Loading input" label="Loading Input" trailingAction="loading" />
    </div>
    <div>
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">With Both Icons</h3>
      <InputComponent
        placeholder="Search and clear"
        label="Full Featured Input"
        leadingIcon="search"
        trailingAction="clear"
      />
    </div>
  </div>
);

// Size Combinations
export const SizeCombinations = () => (
  <div className="tw-space-y-6">
    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Small Size Combinations</h3>
      <div className="tw-space-y-3">
        <InputComponent size="small" placeholder="Small text input" label="Small Text" />
        <InputComponent size="small" type="number" placeholder="00.00" label="Small Number" />
        <InputComponent size="small" type="password" placeholder="Small password" label="Small Password" />
        <InputComponent size="small" leadingIcon="search" placeholder="Small with icon" label="Small with Icon" />
        <InputComponent size="small" trailingAction="clear" placeholder="Small clearable" label="Small Clearable" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Medium Size Combinations</h3>
      <div className="tw-space-y-3">
        <InputComponent size="medium" placeholder="Medium text input" label="Medium Text" />
        <InputComponent size="medium" type="number" placeholder="00.00" label="Medium Number" />
        <InputComponent size="medium" type="password" placeholder="Medium password" label="Medium Password" />
        <InputComponent size="medium" leadingIcon="search" placeholder="Medium with icon" label="Medium with Icon" />
        <InputComponent size="medium" trailingAction="clear" placeholder="Medium clearable" label="Medium Clearable" />
      </div>
    </div>

    <div>
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Large Size Combinations (14px/20px text)</h3>
      <div className="tw-space-y-3">
        <InputComponent size="large" placeholder="Large text input" label="Large Text" />
        <InputComponent size="large" type="number" placeholder="00.00" label="Large Number" />
        <InputComponent size="large" type="password" placeholder="Large password" label="Large Password" />
        <InputComponent size="large" leadingIcon="search" placeholder="Large with icon" label="Large with Icon" />
        <InputComponent size="large" trailingAction="clear" placeholder="Large clearable" label="Large Clearable" />
        <EditableTitleInput size="large" placeholder="Large editable title" label="Large Editable Title" />
      </div>
    </div>
  </div>
);

// Encrypted Field Examples
export const EncryptedFields = () => {
  const [isEditing1, setIsEditing1] = React.useState(false);
  const [isEditing2, setIsEditing2] = React.useState(false);
  const [isEditing3, setIsEditing3] = React.useState(false);

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Encrypted Password Fields</h3>
        <div className="tw-space-y-4 tw-max-w-md">
          <div>
            <InputComponent
              type="password"
              size="small"
              label="API Key"
              placeholder={isEditing1 ? 'Enter API key' : '**************'}
              encrypted={true}
              showEncryption={true}
              isEditing={isEditing1}
              propertyKey="api_key"
              handleEncryptedFieldsToggle={() => setIsEditing1(!isEditing1)}
              isDisabled={false}
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Database Password"
              placeholder={isEditing2 ? 'Enter password' : '**************'}
              encrypted={true}
              showEncryption={true}
              isEditing={isEditing2}
              propertyKey="db_password"
              handleEncryptedFieldsToggle={() => setIsEditing2(!isEditing2)}
              isDisabled={false}
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="large"
              label="Secret Token"
              placeholder={isEditing3 ? 'Enter token' : '**************'}
              encrypted={true}
              showEncryption={true}
              isEditing={isEditing3}
              propertyKey="secret_token"
              handleEncryptedFieldsToggle={() => setIsEditing3(!isEditing3)}
              isDisabled={false}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Encrypted Field - Disabled State</h3>
        <div className="tw-max-w-md">
          <InputComponent
            type="password"
            size="medium"
            label="Protected Secret"
            placeholder="**************"
            encrypted={true}
            showEncryption={true}
            isEditing={false}
            propertyKey="protected_secret"
            handleEncryptedFieldsToggle={() => {}}
            isDisabled={true}
          />
        </div>
      </div>
    </div>
  );
};

// Workspace Constants Examples
export const WorkspaceConstants = () => {
  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Workspace Constants (Auto-visible)</h3>
        <p className="tw-text-sm tw-text-text-weak tw-mb-4">
          Password inputs automatically show values when they contain workspace constants or secrets
        </p>
        <div className="tw-space-y-4 tw-max-w-md">
          <div>
            <InputComponent
              type="password"
              size="small"
              label="API Key (Constant)"
              placeholder="{{constants.API_KEY}}"
              helperText="Workspace constant - automatically visible"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Database Password (Secret)"
              placeholder="{{secrets.DB_PASSWORD}}"
              helperText="Workspace secret - automatically visible"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="large"
              label="Auth Token (Constant)"
              placeholder="{{constants.AUTH_TOKEN}}"
              helperText="Template variable - shown in plain text"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Mixed: Constants vs Regular Passwords</h3>
        <div className="tw-space-y-4 tw-max-w-md">
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Regular Password"
              placeholder="Enter your password"
              helperText="Normal password - hidden by default"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Workspace Constant"
              placeholder="{{constants.SECRET_KEY}}"
              helperText="Constant - visible by default"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Workspace Secret"
              placeholder="{{secrets.API_SECRET}}"
              helperText="Secret - visible by default"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Workspace Constants with Validation</h3>
        <div className="tw-space-y-4 tw-max-w-md">
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Valid Constant"
              placeholder="{{constants.VALID_KEY}}"
              response={true}
              helperText="Constant syntax is correct"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Invalid Constant"
              placeholder="{{constants.MISSING_KEY}}"
              response={false}
              helperText="This constant doesn't exist in workspace"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Encrypted Fields with Validation
export const EncryptedFieldsWithValidation = () => {
  const [isEditing1, setIsEditing1] = React.useState(false);
  const [isEditing2, setIsEditing2] = React.useState(false);

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Encrypted Fields with Validation States</h3>
        <div className="tw-space-y-4 tw-max-w-md">
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Valid Encrypted Password"
              placeholder={isEditing1 ? 'Enter password' : '**************'}
              encrypted={true}
              showEncryption={true}
              isEditing={isEditing1}
              propertyKey="valid_password"
              handleEncryptedFieldsToggle={() => setIsEditing1(!isEditing1)}
              isDisabled={false}
              response={true}
              helperText="Password meets security requirements"
            />
          </div>
          <div>
            <InputComponent
              type="password"
              size="medium"
              label="Invalid Encrypted Password"
              placeholder={isEditing2 ? 'Enter password' : '**************'}
              encrypted={true}
              showEncryption={true}
              isEditing={isEditing2}
              propertyKey="invalid_password"
              handleEncryptedFieldsToggle={() => setIsEditing2(!isEditing2)}
              isDisabled={false}
              response={false}
              helperText="Password must be at least 12 characters"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


// Interactive Playground
export const Playground = Template.bind({});
Playground.args = {
  type: 'text',
  placeholder: 'Interactive playground',
  name: 'playground',
  id: 'playground',
  size: 'medium',
  label: 'Playground Input',
  'aria-label': 'Interactive input playground',
  helperText: 'Use the controls below to test different combinations',
};
