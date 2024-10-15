# Textarea Component

The **Textarea** component allows users to enter multi-line text input. It's similar to the [Text Input](/docs/widgets/text-input) component but is generally preferred for longer, multi-sentence inputs.

<div style={{paddingTop:'24px'}}>

## Properties

| Property | Description | Expected Value |
|----------|-------------|----------------|
| Default value | Sets the initial value on load. | Text (e.g., "John Doe") |
| Placeholder | Provides a hint for the expected input. | Instructional text (e.g., "Type name here") |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

| Action | Description | Usage |
|--------|-------------|-------|
| setText | Sets the text content | `await components.textarea1.setText('New text')` |
| clear | Clears the textarea content | `await components.textarea1.clear()` |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| Variable | Description | Access |
|----------|-------------|--------|
| value | Current content of the textarea | `{{components.textarea1.value}}` |

</div>

<div style={{paddingTop:'24px'}}>

## General Settings

### Tooltip
Enter text to display as a tooltip when users hover over the component.

</div>

<div style={{paddingTop:'24px'}}>

## Layout

| Setting | Description | Values |
|---------|-------------|--------|
| Show on desktop | Toggle desktop visibility | You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle mobile visibility | You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}` |

</div>

---

<div style={{paddingTop:'24px'}}>

## Styles

| Style | Description | Expected Value |
|-------|-------------|----------------|
| Visibility | Controls component visibility | Use the toggle button OR click on **fx** to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}` |
| Disable | Makes the component non-functional | Use the toggle button OR click on **fx** to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}` |
| Border radius | Adjusts corner roundness | Numeric value |

### Box Shadow

The **Box Shadow** property adds shadow effects around the component's frame. You can specify:

- Horizontal offset (X slider)
- Vertical offset (Y slider)
- Blur radius
- Spread radius
- Shadow color

Adjust these values to achieve the desired shadow effect.

</div>
