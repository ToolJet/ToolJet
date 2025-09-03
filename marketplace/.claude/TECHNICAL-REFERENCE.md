# ToolJet Plugin Technical Reference

## Overview
This technical reference provides comprehensive information about ToolJet's plugin architecture, schema integration, validation systems, and component rendering. It serves as the definitive guide for understanding how plugins work under the hood.

## Schema Architecture

### Two Schema Systems

#### 1. Legacy Schema (DynamicForm v1)
- **Used by**: `operations.json` files and older `manifest.json` files
- **Component**: `DynamicForm` (frontend/src/_components/DynamicForm.jsx)
- **Schema**: `marketplace/schemas/dynamicform-v1-schema.json`
- **Validation**: Basic validation, no formal schema validation
- **Purpose**: Query operations rendering in Query Manager

#### 2. Modern Schema (DynamicFormV2)
- **Used by**: New `manifest.json` files with `tj:version` field
- **Component**: `DynamicFormV2` (frontend/src/_components/DynamicFormV2.jsx)
- **Schema**: `marketplace/schemas/dynamicform-v2-schema.json`
- **Validation**: AJV 2020-12 with real-time validation
- **Purpose**: Datasource connection forms rendering

### Component Selection Logic

#### Automatic Component Selection
```javascript
// From DataSourceComponents/index.js
if (schema['tj:version']) {
  return <DynamicFormV2 schema={schema} isGDS={true} {...props} />;
}
return <DynamicForm schema={schema} isGDS={true} {...props} />;
```

#### Selection Rules
- **DynamicForm**: Used when schema lacks `tj:version` field
- **DynamicFormV2**: Used when schema contains `tj:version` field

## Schema Integration Points

### 1. Manifest.json Integration (Datasource Connection)

#### Purpose
Renders datasource connection forms in the data source management interface.

#### Integration Flow
1. **Schema Loading**: Schemas loaded via `@tooljet/plugins/client` from `allManifests` object
2. **Component Creation**: `DataSourceComponents/index.js` creates form components
3. **Form Rendering**: `DynamicFormV2` renders connection forms
4. **Validation**: `DataSourceSchemaManager` validates inputs in real-time
5. **Persistence**: Validated data saved with encryption for sensitive fields

#### Key Files
- **Schema Loader**: `plugins/client.js`
- **Component Factory**: `frontend/src/modules/common/components/DataSourceComponents/index.js`
- **Form Renderer**: `frontend/src/_components/DynamicFormV2.jsx`
- **Validation**: `frontend/src/_helpers/dataSourceSchemaManager.js`

#### Example Integration
```javascript
// DataSourceComponents/index.js
export const SourceComponents = Object.keys(allManifests).reduce((acc, key) => {
  acc[key] = (props) => {
    const schema = allManifests[key];
    if (schema['tj:version']) {
      return <DynamicFormV2 schema={schema} isGDS={true} {...props} />;
    }
    return <DynamicForm schema={schema} isGDS={true} {...props} />;
  };
  return acc;
}, {});
```

### 2. Operations.json Integration (Query Operations)

#### Purpose
Renders query operation forms in the Query Manager interface.

#### Integration Flow
1. **Schema Loading**: Schemas loaded via `@tooljet/plugins/client` from `allOperations` object
2. **Component Creation**: `QueryEditors/index.js` creates operation components
3. **Form Rendering**: `DynamicForm` renders operation forms
4. **Query Building**: Form data used to construct queries
5. **Execution**: Query executed with collected parameters

#### Key Files
- **Schema Loader**: `plugins/client.js`
- **Component Factory**: `frontend/src/AppBuilder/QueryManager/QueryEditors/index.js`
- **Form Renderer**: `frontend/src/_components/DynamicForm.jsx`
- **Query Manager**: `frontend/src/AppBuilder/QueryManager/QueryManager.jsx`

#### Example Integration
```javascript
// QueryEditors/index.js
export const allSources = {
  ...Object.keys(allOperations).reduce((acc, key) => {
    acc[key] = (props) => (
      <DynamicForm 
        schema={allOperations[key]} 
        {...props} 
        layout="horizontal" 
      />
    );
    return acc;
  }, {})
};
```

## Schema Structure Analysis

### Legacy Schema (operations.json)
```json
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/marketplace/schemas/dynamicform-v1-schema.json",
  "title": "Plugin Operations",
  "description": "Operations for plugin",
  "type": "api",
  "defaults": {
    "operation": "default_operation"
  },
  "properties": {
    "operation": {
      "label": "Operation",           // UI: Label text
      "key": "operation",             // UI: Field identifier
      "type": "dropdown-component-flip", // UI: Widget type
      "list": [                       // UI: Dropdown options
        { "value": "create", "name": "Create" },
        { "value": "read", "name": "Read" }
      ]
    },
    "create": {
      "data": {
        "label": "Data",              // UI: Display label
        "key": "data",                // UI: Field key
        "type": "codehinter",         // UI: Widget + Data type
        "mandatory": true             // UI: Required + Validation
      }
    }
  }
}
```

**Key Point**: In v1, `properties` combines UI definition and data validation in a single field structure.

### Modern Schema (manifest.json)
```json
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/marketplace/schemas/dynamicform-v2-schema.json",
  "title": "Plugin Manifest",
  "description": "Plugin connection schema",
  "tj:version": "1.0.0",
  "tj:source": {
    "name": "Plugin Name",
    "kind": "plugin_kind",
    "type": "api"
  },
  "tj:encrypted": ["api_key"],
  
  // JSON Schema standard - defines data structure & validation
  "properties": {
    "api_key": {
      "type": "string",                    // Data: Type validation
      "title": "API Key",                  // Data: Schema title
      "description": "Your API key",       // Data: Schema description
      "minLength": 8,                      // Data: Validation rule
      "pattern": "^[A-Za-z0-9]+$"         // Data: Format validation
    }
  },
  "required": ["api_key"],                 // Data: Required fields
  
  // ToolJet extension - defines UI rendering
  "tj:ui:properties": {
    "api_key": {
      "widget": "password-v3",            // UI: Component type
      "key": "api_key",                   // UI: Field identifier
      "label": "API Key",                 // UI: Display label
      "placeholder": "Enter key",         // UI: Placeholder text
      "encrypted": true,                  // UI: Encryption flag
      "required": true                    // UI: Required indicator
    }
  }
}
```

**Key Point**: In v2, `properties` defines JSON Schema validation rules while `tj:ui:properties` defines UI rendering behavior.

## Properties vs UI:Properties Technical Details

### Historical Context
- **v1 (Legacy)**: Used `properties` field for both UI rendering and data structure
- **v2 (Modern)**: Separated concerns for better standards compliance

### Why the Separation?

#### 1. JSON Schema Standards Compliance
In v2, `properties` follows standard JSON Schema specification:
- Enables proper AJV validation
- Compatible with industry-standard JSON Schema tools
- Allows for type checking and data validation
- Supports conditional validation with `allOf`

#### 2. UI Extension Flexibility
`tj:ui:properties` is a custom extension for UI rendering:
- Defines how fields are displayed (widgets, labels, etc.)
- Handles UI-specific concerns (placeholder text, help text)
- Not part of JSON Schema standard, hence the `tj:` prefix
- Allows for ToolJet-specific UI enhancements

### Properties Field (Standard JSON Schema)
```json
"properties": {
  "api_key": {
    "type": "string",           // Data type for validation
    "title": "API Key",         // Schema title
    "description": "Your key",   // Schema description
    "minLength": 10,            // Validation rule
    "pattern": "^[A-Z0-9]+$"    // Validation pattern
  }
}
```
- **Purpose**: Define data structure and validation rules
- **Standard**: Follows JSON Schema specification
- **Validation**: Used by AJV for schema validation
- **Compatibility**: Works with any JSON Schema validator

### UI:Properties Field (ToolJet Extension)
```json
"tj:ui:properties": {
  "api_key": {
    "widget": "password-v3",         // UI component type
    "key": "api_key",               // Field identifier
    "label": "API Key",             // UI label
    "placeholder": "Enter key",      // UI placeholder
    "helpText": "Find in settings",  // UI help text
    "required": true,               // UI required indicator
    "encrypted": true               // UI encryption flag
  }
}
```
- **Purpose**: Define UI rendering and behavior
- **Custom**: ToolJet-specific extension
- **Rendering**: Used by DynamicFormV2 for UI generation
- **Not standard**: Custom extension, not part of JSON Schema

## Validation Systems

### Legacy Validation (DynamicForm)
- **Type**: Basic field-level validation
- **Timing**: On change events
- **Error Handling**: Limited error feedback
- **Schema Support**: No JSON Schema validation

```javascript
// Basic validation example
const validateField = (value, type) => {
  if (type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  return true;
};
```

### Modern Validation (DynamicFormV2)
- **Type**: AJV 2020-12 JSON Schema validation
- **Timing**: Real-time with 300ms debounce
- **Error Handling**: Comprehensive error messages
- **Schema Support**: Full JSON Schema with conditional validation

```javascript
// Modern validation example
const validateOptions = React.useCallback(async () => {
  try {
    const { valid, errors } = await dsm.validateData(options);
    const conditionallyRequiredFields = processAllOfConditions(schema, options);
    
    if (valid) {
      clearValidationMessages();
    } else {
      setValidationMessages(errors, schema, interactedFields);
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
}, [dsm, options, schema]);
```

## Widget Type Mapping

### Legacy Widgets (DynamicForm)
- `text` → Input component
- `password` → Password input
- `textarea` → Textarea component
- `dropdown` → Select component
- `toggle` → Toggle component
- `codehinter` → Code editor
- `checkbox` → Checkbox component
- `checkbox-group` → Multiple checkboxes
- `dropdown-component-flip` → Dynamic dropdown

### Modern Widgets (DynamicFormV2)
- `text-v3` → Enhanced Input component
- `password-v3` → Enhanced password input
- `password-v3-textarea` → Multi-line password
- `dropdown-component-flip` → Dynamic dropdown
- `toggle` → Toggle component
- `react-component-headers` → Headers editor
- `react-component-oauth-authentication` → OAuth configuration
- `react-component-google-sheets` → Google Sheets integration
- `tooljetdb-operations` → ToolJet database operations

### Widget Element Mapping
```javascript
const getElement = (type) => {
  switch (type) {
    case 'text':
    case 'password':
      return Input;
    case 'text-v3':
    case 'password-v3':
      return InputV3;
    case 'textarea':
      return Textarea;
    case 'dropdown':
      return Select;
    case 'toggle':
      return Toggle;
    case 'codehinter':
      return CodeHinter;
    case 'react-component-headers':
      return HeadersComponent;
    default:
      return Input;
  }
};
```

## Advanced Schema Features

### 1. Conditional Field Rendering
Modern schema supports conditional field display using `dropdown-component-flip`:

```json
{
  "tj:ui:properties": {
    "connection_type": {
      "widget": "dropdown-component-flip",
      "list": [
        { "value": "manual", "name": "Manual" },
        { "value": "string", "name": "Connection String" }
      ]
    },
    "manual": {
      "host": {
        "widget": "text-v3",
        "label": "Host"
      }
    },
    "string": {
      "connection_string": {
        "widget": "text-v3",
        "label": "Connection String"
      }
    }
  }
}
```

### 2. Conditional Validation
Modern schema supports conditional validation with `allOf`:

```json
{
  "allOf": [
    {
      "if": {
        "properties": {
          "connection_type": { "const": "manual" }
        }
      },
      "then": {
        "required": ["host", "port"]
      }
    },
    {
      "if": {
        "properties": {
          "connection_type": { "const": "string" }
        }
      },
      "then": {
        "required": ["connection_string"]
      }
    }
  ]
}
```

### 3. Field Encryption
Modern schema supports automatic field encryption:

```json
{
  "tj:encrypted": ["api_key", "password"],
  "tj:ui:properties": {
    "api_key": {
      "widget": "password-v3",
      "encrypted": true
    }
  }
}
```

## Dynamic Form Patterns for Complex UI

### When to Use Dynamic Forms

Dynamic forms are essential when:
- Fields should appear/disappear based on user selections
- Complex authentication flows (OAuth2, multi-step)
- Server-side discovery of options
- Nested or hierarchical configurations  
- Real-time validation requirements

### Pattern 1: Cascading Forms with dropdown-component-flip

The `dropdown-component-flip` widget creates conditional sections based on dropdown selection.

#### Structure Example:
```json
"tj:ui:properties": {
  "parent_dropdown": {
    "widget": "dropdown-component-flip",
    "label": "Select Type",
    "list": [
      { "value": "option1", "name": "Option 1" },
      { "value": "option2", "name": "Option 2" }
    ],
    "commonFields": {
      "common_field": {
        "widget": "text-v3",
        "label": "Always Visible"
      }
    }
  },
  "option1": {
    "option1_field": {
      "widget": "text-v3", 
      "label": "Option 1 Specific"
    }
  },
  "option2": {
    "option2_field": {
      "widget": "password-v3",
      "label": "Option 2 Specific"
    }
  }
}
```

#### Real Example - Proto Source Selection:
```json
"proto_source": {
  "widget": "dropdown-component-flip",
  "label": "Proto Source",
  "list": [
    { "value": "server_reflection", "name": "Server Reflection" },
    { "value": "proto_url", "name": "Proto File URL" }
  ],
  "commonFields": {
    "url": {
      "widget": "text-v3",
      "label": "Server URL",
      "required": true
    }
  }
},
"proto_url": {
  "proto_url": {
    "widget": "text-v3",
    "label": "Proto File URL",
    "placeholder": "https://example.com/api.proto"
  }
},
"server_reflection": {}
```

### Pattern 2: Complex Widget Components

#### OAuth Authentication Component
Reuse from REST API plugin:
```json
"auth_type": {
  "widget": "react-component-oauth-authentication",
  "label": "Authentication", 
  "description": "Authentication method",
  "fields": {
    "oauth2": {
      "client_id": "client_id",
      "client_secret": "client_secret", 
      "access_token_url": "access_token_url",
      "auth_url": "auth_url",
      "scopes": "scopes"
    },
    "basic": {
      "username": "username",
      "password": "password"
    },
    "bearer": {
      "bearer_token": "bearer_token"
    }
  }
}
```

#### Headers Component for Key-Value Arrays
```json
"metadata": {
  "widget": "react-component-headers",
  "label": "Custom Headers",
  "description": "Key-value pairs for metadata",
  "width": "320px"
}
```

#### Array Field Schema
For array widgets, define proper item schema:
```json
"metadata": {
  "type": "array",
  "items": {
    "type": "array",
    "items": { "type": "string" },
    "minItems": 2,
    "maxItems": 2
  },
  "default": []
}
```

### Pattern 3: Nested Cascading Forms

For multiple levels of conditional fields:

```json
"tj:ui:properties": {
  "level1": {
    "widget": "dropdown-component-flip",
    "list": [
      { "value": "a", "name": "Option A" },
      { "value": "b", "name": "Option B" }
    ]
  },
  "a": {
    "level2_a": {
      "widget": "dropdown-component-flip", 
      "list": [
        { "value": "a1", "name": "Sub Option A1" },
        { "value": "a2", "name": "Sub Option A2" }
      ]
    }
  },
  "a1": {
    // Fields for nested selection a -> a1
  }
}
```

### Pattern 4: Custom UI Components

When standard widgets aren't sufficient:

1. **Minimal operations.json**:
```json
{
  "properties": {
    "custom_operation": {
      "type": "custom-component-name"
    }
  }
}
```

2. **Frontend Component Required**:
- Create React component in `frontend/src/AppBuilder/QueryManager/QueryEditors/`
- Register in `index.js`
- Handle dynamic behavior in JavaScript

### Dynamic Forms Best Practices

1. **Always validate schemas** after implementing dynamic forms
2. **Test all conditional paths** - each dropdown option, each auth type
3. **Provide defaults** for better UX
4. **Document the expected behavior** in architecture specs
5. **Screenshot each state** during testing for evidence

### Common Dynamic Forms Pitfalls

1. **Missing UI properties mapping** - All fields need widget definitions
2. **Incorrect conditional structure** - Option keys must match dropdown values
3. **Array fields without item schemas** - Causes initialization errors
4. **Missing required field conditions** - Use allOf patterns
5. **Widget version mismatches** - Use v3 widgets for V2 schemas

### Testing Dynamic Forms

Use Playwright to test all paths:
```javascript
// Test each dropdown option
for (const option of dropdownOptions) {
  await page.selectOption('[data-widget="dropdown-component-flip"]', option.value)
  
  // Verify correct fields appear
  for (const field of option.expectedFields) {
    await expect(page.locator(`[data-field="${field}"]`)).toBeVisible()
  }
  
  // Verify other fields hidden
  for (const field of option.hiddenFields) {
    await expect(page.locator(`[data-field="${field}"]`)).not.toBeVisible()
  }
}
```

## Validation Setup and Implementation

### AJV Configuration
```javascript
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({
  strict: false,
  allErrors: true,
  removeAdditional: false,
  validateSchema: false,
  coerceTypes: true
});

addFormats(ajv);

// Load schemas
const v1Schema = JSON.parse(fs.readFileSync('marketplace/schemas/dynamicform-v1-schema.json', 'utf8'));
const v2Schema = JSON.parse(fs.readFileSync('marketplace/schemas/dynamicform-v2-schema.json', 'utf8'));

// Compile validators
const validateV1 = ajv.compile(v1Schema);
const validateV2 = ajv.compile(v2Schema);
```

### Validation Function
```javascript
function validateSchema(data, schemaVersion) {
  const validator = schemaVersion === 'v1' ? validateV1 : validateV2;
  const valid = validator(data);
  
  if (!valid) {
    const errors = validator.errors.map(error => ({
      path: error.instancePath,
      message: error.message,
      keyword: error.keyword,
      params: error.params
    }));
    return { valid: false, errors };
  }
  
  return { valid: true, errors: [] };
}
```

## Error Handling

### Legacy Error Handling
- Basic UI error states
- Limited error messages
- No centralized error management

### Modern Error Handling
- Real-time validation feedback
- Field-specific error messages
- Centralized error state management
- User interaction tracking

```javascript
// Modern error handling
const setValidationMessages = (errors, schema, interactedFields) => {
  const errorMap = errors.reduce((acc, error) => {
    const property = error.keyword === 'required' 
      ? error.params.missingProperty
      : error.dataPath?.replace(/^[./]/, '');
    
    if (property && interactedFields.has(property)) {
      acc[property] = generateErrorMessage(error, schema.properties[property]);
    }
    return acc;
  }, {});
  
  setValidationMessages(errorMap);
};
```

## Security Considerations

### Field Encryption
- Sensitive fields marked in `tj:encrypted` array
- Automatic encryption/decryption handling
- Secure field display with masking

### Validation Security
- Schema validation prevents malicious input
- Type coercion for data safety
- Sanitization of user input

```javascript
// Security validation example
const sanitizeInput = (value, type) => {
  if (type === 'string') {
    return value.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
  return value;
};
```

## Migration Guide

### Legacy to Modern Schema Migration

#### Step 1: Add Required Fields
```json
{
  "tj:version": "1.0.0",
  "tj:source": {
    "name": "Plugin Name",
    "kind": "plugin_kind",
    "type": "api"
  }
}
```

#### Step 2: Separate Properties
```javascript
// Legacy
{
  "properties": {
    "api_key": {
      "label": "API Key",
      "type": "password"
    }
  }
}

// Modern
{
  "tj:ui:properties": {
    "api_key": {
      "widget": "password-v3",
      "label": "API Key",
      "encrypted": true
    }
  },
  "properties": {
    "api_key": {
      "type": "string",
      "title": "API Key"
    }
  }
}
```

#### Step 3: Update Widget Types
```javascript
// Legacy → Modern widget mapping
'text' → 'text-v3'
'password' → 'password-v3'
'textarea' → 'password-v3-textarea' (for multi-line passwords)
```

#### Step 4: Add Encryption
```json
{
  "tj:encrypted": ["api_key", "client_secret"],
  "tj:ui:properties": {
    "api_key": {
      "widget": "password-v3",
      "encrypted": true
    }
  }
}
```

## Performance Considerations

### Schema Loading
- Schemas loaded once at application start
- Compiled validators cached for reuse
- Minimal runtime overhead

### Validation Performance
- Debounced validation (300ms)
- Field-level validation caching
- Conditional validation optimization

### Memory Management
- Schema validators cached efficiently
- Error objects cleaned up after use
- Component state optimized

## Debugging and Troubleshooting

### Common Issues

#### Schema Validation Errors
```javascript
// Debug schema validation
const debugValidation = (data, schema) => {
  console.log('Validating data:', data);
  console.log('Against schema:', schema);
  
  const result = validator(data);
  if (!result) {
    console.log('Validation errors:', validator.errors);
  }
};
```

#### Component Rendering Issues
```javascript
// Debug component selection
const debugComponentSelection = (schema) => {
  console.log('Schema version:', schema['tj:version'] ? 'v2' : 'v1');
  console.log('Will use:', schema['tj:version'] ? 'DynamicFormV2' : 'DynamicForm');
};
```

### Development Tools

#### Schema Validator
```bash
# Validate schema file
node scripts/validate-schema.js <file-path> <v1|v2>
```

#### Component Inspector
```javascript
// React DevTools integration
const ComponentInspector = ({ schema }) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Schema:', schema);
      console.log('Component:', schema['tj:version'] ? 'DynamicFormV2' : 'DynamicForm');
    }
  }, [schema]);
};
```

This technical reference provides the complete understanding of ToolJet's plugin architecture, enabling developers to create robust, validated, and secure plugins.