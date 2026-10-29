# Field — Rocket Design Spec
<!-- synced: 2026-03-16 -->

## Overview

Field is a composition wrapper for form controls. It provides label, description, error message, and layout (vertical/horizontal/responsive) around any Rocket input component.

Modular by design — Field wraps Input, Select, Textarea, DatePicker, etc. without duplicating label/validation logic.

## Sub-components

### Wrapped (token overrides)

| Sub-component | Purpose | Token override |
|---|---|---|
| `Field` | Layout container | `tw-gap-1.5` default spacing |
| `FieldLabel` | Label text | `tw-text-text-default tw-text-base tw-font-medium` |
| `FieldDescription` | Helper text | `tw-text-text-placeholder tw-text-sm` |
| `FieldError` | Validation message | `tw-text-text-danger tw-text-sm` |
| `FieldGroup` | Group container | Pass-through (structural) |

### Re-exported from shadcn (no token overrides needed)

`FieldContent`, `FieldSet`, `FieldLegend`, `FieldTitle`, `FieldSeparator`

## Props (Field)

| Prop | Type | Values | Default |
|---|---|---|---|
| orientation | string | vertical \| horizontal \| responsive | vertical |
| className | string | — | — |

All other props forwarded to underlying `div[role=group]`.

## Composition Patterns

### Basic field with input
```jsx
<Field>
  <FieldLabel>Email</FieldLabel>
  <Input type="email" placeholder="you@example.com" />
</Field>
```

### Field with description and error
```jsx
<Field data-invalid="true">
  <FieldLabel>Password</FieldLabel>
  <Input type="password" aria-invalid="true" />
  <FieldDescription>Must be at least 8 characters.</FieldDescription>
  <FieldError>Password is too short.</FieldError>
</Field>
```

### Field with InputGroup
```jsx
<Field>
  <FieldLabel>Website</FieldLabel>
  <InputGroup>
    <InputGroupAddon>
      <InputGroupText>https://</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput placeholder="example.com" />
  </InputGroup>
</Field>
```

### Horizontal layout
```jsx
<Field orientation="horizontal">
  <FieldLabel>Name</FieldLabel>
  <Input placeholder="John Doe" />
</Field>
```

## Notes

- `data-invalid="true"` on Field propagates error styling to children via `group-data-[invalid=true]`.
- `data-disabled="true"` on Field propagates disabled styling via `group-data-[disabled=true]`.
- FieldError accepts `errors` prop (array of `{ message }`) for multi-error display.
