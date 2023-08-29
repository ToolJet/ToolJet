---
id: canvas
title: Canvas
---

Canvas is the center area of the ToolJet app builder where the application is built. You arrange the **components** by dragging them from the Components library(right-sidebar).

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/canvas/canvasnew.png" alt="App Builder: Canvas"/>

</div>
<br/>

:::info
- The Canvas height and width can be adjusted from the [Global Settings](/docs/app-builder/left-sidebar#global-settings).
- When the [Pages drawer](/docs/tutorial/pages) on the left is opened or pinned, the canvas becomes horizontally scrollable.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/canvas/scrollnew.gif" alt="App Builder: Canvas"/>

</div>
:::

### Arrange Components

All the components are fully interactive in editor mode - to prevent interaction you can **click and hold** the **Component Handle** to change component's position.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/canvas/handlenew.png" alt="App Builder: Canvas"/>

</div>

### Resize Components

Components on the canvas can be resized from the edges.

You can precisely set the position of selected components using keyboard arrow keys after clicking the component handle.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/canvas/resize.gif" alt="App Builder: Canvas"/>

</div>

### Group Components

ToolJet comes with flexible components to group other components together, such as **[Container](/docs/widgets/container/)** and **[Form](/docs/widgets/form/)**. When you drag and drop components in containers/forms they create a group of nested components. All components can be nested in this way.

### Hide or Disable Components

Hide or Disable a component by setting its **Visibility** or **Disabled** property to `true`. Click on the component handle to open **config inspector** on right side. These values can also evaluate to true based on a truthy value. For example, you can use the property of one component to toggle the Visibility property of another component dynamically, you just need to write a conditional statement. 

For example: We want to disable a button when a checkbox is checked so we can simple use `{{components.checkbox1.value}}` in **Disable** property of the button. `{{components.checkbox1.value}}` evaluates to `true` when the checkbox is checked, and false when unchecked.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/canvas/hide.gif" alt="App Builder: Canvas"/>

</div>

### Clone Components

You can clone existing components on the canvas by **cmd/ctrl + d**. Check other **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)**.

