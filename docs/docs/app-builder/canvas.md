---
id: canvas
title: Canvas and Layout Systems
---

**Canvas** is the main playground in the ToolJet App Builder where the application is built and the user interface is designed. It also serves as the area for displaying data and results.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/canvas.png" alt="App Builder: Canvas"/>

## Customizing Canvas

Through Global Settings, you can costomize the following properties of the **Canvas**:

- **Max width of canvas**: Defines the maximum width of the canvas, which can be set in pixels or as a percentage of the screen size.
- **Canvas background**: Sets the background color of the canvas. This can also be controlled dynamically by clicking on **fx** and entering a logical expression.
- **App mode**:  Select between three theme modes:
    - **Auto**: Adapts to the browser's theme settings or allows the user to switch between light and dark modes.
    - **Light**: Keeps the app in light mode, user cannot switch to dark mode.
    - **Dark**: Keeps the app in dark mode, user cannot switch to light mode.

<img className="screenshot-full img-s" src="/img/app-builder/canvas/global-settings.png" alt="App Builder: Canvas"/>

## Building the User Interface

To build the user interface, components can be dragged from the [Component Library](#) on the right. The Component Handle can be used to reposition a component without affecting others. A component can be resized from any of its edges or corners.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/drag.gif" alt="App Builder: Canvas"/>

### Grid, Snapping and Markers

ToolJet's Canvas provides a grid background, smart snapping, and visual markers to support precise alignment and positioning of components. Components automatically snap to grid lines and nearby elements, reducing the need for manual adjustments. These features help streamline the layout process and ensure clean, well-aligned designs with minimal effort.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/snap.png" alt="App Builder: Canvas"/>

## Layout Components

In ToolJet, components related to the same feature can be grouped using a layout component such as a **[Container](#)** or a **[Form](#)**. Relevant components can be dragged and dropped into the layout component on the canvas to create a structured group.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/form.png" alt="App Builder: Canvas"/>

## Managing Components on Canvas

#### Select and Move Multiple Components

Multiple components on the canvas can be selected by either clicking and dragging the cursor to cover them or by selecting individual components while holding the Shift key. Once selected, all components can be moved together as a group.

***Select and Move Multiple Components GIF***

#### Copy Component

Components on the canvas can be copied using **Cmd/Ctrl + C**.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/copy.png" alt="App Builder: Canvas"/>

#### Paste Component

Copied components can be pasted onto the canvas using **Cmd/Ctrl + V**.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/paste.png" alt="App Builder: Canvas"/>

#### Clone Component

Components on the canvas can be cloned using **Cmd/Ctrl + D**.

<img className="screenshot-full img-full" src="/img/app-builder/canvas/clone.png" alt="App Builder: Canvas"/>

<br/><br/>

:::note
For additional shortcuts, refer to the [Keyboard Shortcuts Guide](/docs/tutorial/keyboard-shortcuts).
:::
