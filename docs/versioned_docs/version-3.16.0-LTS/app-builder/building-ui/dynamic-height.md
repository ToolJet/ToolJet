---
id: dynamic-height
title: Dynamic Height
---

ToolJet now supports Dynamic Height for several components. This feature allows components to automatically adjust their height based on the content inside them, improving layout flexibility and responsiveness.

This is particularly useful for:
- Text-heavy components like Text Editor or Textarea.
- List-based components such as ListView, Table, where each record may have varying content size.
- Responsive UI designs where component size should adjust naturally to content changes.

## Behavior in Edit vs. Preview Mode

Dynamic Height behaves differently in Edit and Preview modes:

### Edit Mode

Components will display a default placeholder height to allow easy selection and positioning. The height may not exactly match content size.

### Preview Mode/ Released Application

Components will automatically adjust their height based on actual content. This ensures that users see the component at its true size during runtime.

## Absolute Height Behavior

If dynamic height is not enabled, components will maintain a fixed, absolute height:
- Content that overflows the fixed height will show scrollbars (if scrollable) or get clipped.
- This is useful for strict layout requirements, but reduces flexibility.

## How to Enable Dynamic Height

To enable dynamic height for a component:
1. Select the component in your canvas.
2. Navigate to the Dynamic height toggle in the component property panel.
3. Toggle Dynamic height ON.

Once enabled, the component will automatically adjust height based on its content during runtime.

## Components Supporting Dynamic Height

Currently, the following components support dynamic height:

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

- Listview
- Container
- Tabs
- Form
- Table

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Textarea
- Code Editor
- Text Editor
- Text

</div>

</div>

## Dynamic Height for Individual ListView Records

For ListView components, dynamic height is applied to each record individually. During runtime, each record will resize according to the content inside that specific record.