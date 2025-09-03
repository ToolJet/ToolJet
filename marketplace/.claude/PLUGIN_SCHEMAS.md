# ToolJet Plugin Schema Documentation

## Overview
This document provides comprehensive schemas for creating ToolJet plugins. These schemas define the structure for `manifest.json` (connection configuration) and `operations.json` (query operations) that are rendered by the DynamicForm components.

## Schema Types

### 1. Legacy Schema Format
Used by older plugins and DynamicForm (v1) component.

### 2. Modern Schema Format  
Used by newer plugins with `tj:version` property and DynamicFormV2 component.

## Manifest.json Schema

### Purpose
Defines the data source connection configuration - authentication, connection parameters, and form fields.

### Legacy Format Structure
```json
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/plugins/schemas/manifest.schema.json",
  "title": "Plugin Name",
  "description": "Plugin description",
  "type": "api|database|cloud-storage",
  "source": {
    "name": "Display Name",
    "kind": "unique_identifier",
    "exposedVariables": {
      "isLoading": false,
      "data": {},
      "rawData": {}
    },
    "options": {
      "field_name": {
        "type": "string|number|boolean",
        "encrypted": true // for sensitive fields
      }
    }
  },
  "defaults": {},
  "properties": {
    "field_name": {
      "label": "Field Label",
      "key": "field_name",
      "type": "widget_type",
      "description": "Field description",
      "helpText": "HTML help text",
      "encrypted": true, // for sensitive fields
      "placeholder": "Placeholder text"
    }
  },
  "required": ["field1", "field2"]
}
```

### Modern Format Structure (tj:version)
```json
{
  "tj:version": "1.0.0",
  "tj:source": {
    "name": "Display Name",
    "kind": "unique_identifier",
    "type": "api|database|cloud-storage"
  },
  "tj:ui:properties": {
    "field_name": {
      "widget": "widget_type",
      "label": "Field Label",
      "description": "Field description",
      "default": "default_value",
      "required": true,
      "encrypted": true
    }
  },
  "properties": {
    "field_name": {
      "type": "string|number|boolean",
      "title": "Field Title",
      "description": "JSON Schema description",
      "default": "default_value"
    }
  },
  "required": ["field1", "field2"],
  "allOf": [
    {
      "if": {
        "properties": {
          "field_name": { "const": "value" }
        }
      },
      "then": {
        "required": ["conditional_field"]
      }
    }
  ]
}
```

## Operations.json Schema

### Purpose
Defines query operations and their form interfaces - what operations users can perform and their parameters.

### Structure
```json
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/plugins/schemas/operations.schema.json",
  "title": "Plugin Operations",
  "description": "Operations schema",
  "type": "api",
  "defaults": {
    "operation": "default_operation",
    "parameter": "default_value"
  },
  "properties": {
    "operation": {
      "label": "Operation",
      "key": "operation", 
      "type": "dropdown-component-flip",
      "description": "Select operation",
      "list": [
        { "value": "operation1", "name": "Operation 1" },
        { "value": "operation2", "name": "Operation 2" }
      ]
    },
    "operation1": {
      "parameter1": {
        "label": "Parameter Label",
        "key": "parameter1",
        "type": "widget_type",
        "description": "Parameter description",
        "placeholder": "Enter value",
        "height": "150px",
        "width": "320px",
        "mandatory": true,
        "tooltip": "Helpful tooltip"
      }
    },
    "operation2": {
      "parameter2": {
        "label": "Another Parameter",
        "key": "parameter2", 
        "type": "widget_type",
        "description": "Parameter description"
      }
    }
  }
}
```

## Widget Types Reference

### Text Input Widgets
- `text` - Basic text input
- `text-v3` - Enhanced text input with validation
- `password` - Password input (masked)
- `password-v3` - Enhanced password input
- `password-v3-textarea` - Multi-line password input
- `textarea` - Multi-line text input

### Selection Widgets
- `dropdown` - Simple dropdown selection
- `dropdown-component-flip` - Dropdown that shows/hides form sections
- `toggle` - Boolean toggle switch
- `checkbox` - Single checkbox
- `checkbox-group` - Multiple checkboxes

### Advanced Widgets
- `codehinter` - Code editor with syntax highlighting and `{{variable}}` support
- `react-component-headers` - HTTP headers editor
- `react-component-oauth-authentication` - OAuth configuration
- `react-component-google-sheets` - Google Sheets integration
- `tooljetdb-operations` - ToolJet database operations

## Widget Properties

### Common Properties
```json
{
  "label": "Display label",
  "key": "field_key", 
  "type": "widget_type",
  "description": "Field description",
  "placeholder": "Placeholder text",
  "width": "320px",
  "height": "150px",
  "required": true,
  "encrypted": true,
  "disabled": false,
  "default": "default_value"
}
```

### Dropdown Properties
```json
{
  "type": "dropdown",
  "list": [
    { "value": "val1", "name": "Display Name 1" },
    { "value": "val2", "name": "Display Name 2" }
  ]
}
```

### CodeHinter Properties
```json
{
  "type": "codehinter",
  "height": "150px",
  "placeholder": "Enter code or {{variable}}"
}
```

### Operations-specific Properties
```json
{
  "mandatory": true,
  "tooltip": "Helpful tooltip text",
  "helpText": "HTML help text with <a> links"
}
```

## Dynamic Form Rendering

### dropdown-component-flip Pattern
This widget type enables cascading forms where selecting a value shows/hides related form sections:

```json
{
  "operation": {
    "type": "dropdown-component-flip",
    "list": [
      { "value": "create", "name": "Create Record" },
      { "value": "update", "name": "Update Record" }
    ]
  },
  "create": {
    "name": {
      "label": "Record Name",
      "type": "text"
    }
  },
  "update": {
    "id": {
      "label": "Record ID", 
      "type": "text"
    },
    "name": {
      "label": "New Name",
      "type": "text"
    }
  }
}
```

### Conditional Requirements (Modern Schema)
Use `allOf` conditions for dynamic required fields:

```json
{
  "allOf": [
    {
      "if": {
        "properties": {
          "auth_type": { "const": "oauth" }
        }
      },
      "then": {
        "required": ["client_id", "client_secret"]
      }
    }
  ]
}
```

## Component Selection Logic

### DynamicForm vs DynamicFormV2
```javascript
// Component selection in ToolJet
if (schema['tj:version']) {
  return <DynamicFormV2 schema={schema} {...props} />;
}
return <DynamicForm schema={schema} {...props} />;
```

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
    // ... more mappings
  }
};
```

## Best Practices

### 1. Field Naming
- Use snake_case for field keys
- Use descriptive names: `api_key` not `key`
- Match backend parameter names

### 2. Sensitive Data
- Always mark credentials as `encrypted: true`
- Use `password` type for secrets
- Add security warnings in descriptions

### 3. User Experience
- Provide clear labels and descriptions
- Include helpful placeholders
- Add tooltips for complex fields
- Use appropriate widget types

### 4. Validation
- Mark required fields in `required` array
- Use conditional requirements for complex logic
- Provide clear error messages

### 5. Dynamic Forms
- Use `dropdown-component-flip` for operation selection
- Group related parameters under operation sections
- Provide sensible defaults

## Example Plugin Patterns

### API Key Authentication
```json
{
  "properties": {
    "api_key": {
      "label": "API Key",
      "key": "api_key",
      "type": "password",
      "description": "Enter your API key",
      "encrypted": true
    }
  },
  "required": ["api_key"]
}
```

### OAuth Authentication
```json
{
  "properties": {
    "client_id": {
      "label": "Client ID",
      "key": "client_id", 
      "type": "text"
    },
    "client_secret": {
      "label": "Client Secret",
      "key": "client_secret",
      "type": "password",
      "encrypted": true
    }
  },
  "required": ["client_id", "client_secret"]
}
```

### Database Connection
```json
{
  "properties": {
    "host": {
      "label": "Host",
      "key": "host",
      "type": "text",
      "default": "localhost"
    },
    "port": {
      "label": "Port", 
      "key": "port",
      "type": "text",
      "default": "5432"
    },
    "database": {
      "label": "Database Name",
      "key": "database",
      "type": "text"
    }
  },
  "required": ["host", "database"]
}
```

## Testing Your Schema

### Validation
1. Ensure JSON is valid
2. Check all required fields are present
3. Test dropdown-component-flip cascading
4. Verify widget types are supported
5. Test with both DynamicForm components

### Manual Testing
1. Create plugin with schema
2. Test connection form rendering
3. Test operation form rendering
4. Verify field validation
5. Test with different data types

This schema documentation provides the foundation for creating robust ToolJet plugins with proper form interfaces.