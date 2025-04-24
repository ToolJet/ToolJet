---
id: component-properties
title: Component Properties
---

ToolJet offers a variety of highly customizable components. Each component can be customized by setting its properties. The Properties Panel, which appears on the right side when a component is selected, includes two tabs:

- **Properties**: Used to configure the functional aspects of the component.
- **Styles**: Used to customize the appearance, such as colors, border radius, and other styling options.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/app-builder/properties/properties-panel.png" alt="App Builder: Properties Panel"/>

Each component has its own set of properties based on its functionality. This guide covers some of the commonly used properties across components.

## Properties

### Events

Events can be configured for each component to trigger actions such as running a query, showing an alert, and more, based on specific user interactions like clicks or hover events.
For more details, refer to the [Events and Logic](#) guide.

<img className="screenshot-full img-l" src="/img/app-builder/properties/events.png" alt="App Builder: Properties Panel"/>

### Additional Actions

#### Show Loading State

Displays a loading spinner when enabled. This can be toggled manually or configured dynamically by clicking **fx** and entering a logical expression.

<img className="screenshot-full img-l" src="/img/app-builder/properties/loading.png" alt="App Builder: Properties Panel"/>

#### Visibility

Controls the visibility of the component. When disabled, the component is hidden. This can be managed using the toggle button or configured dynamically using **fx** with a logical expression.

<img className="screenshot-full img-l" src="/img/app-builder/properties/visibility.png" alt="App Builder: Properties Panel"/>

#### Disable

Prevents user interaction with the component when enabled. This can be set using the toggle button or dynamically configured using **fx** with a logical expression.

<img className="screenshot-full img-l" src="/img/app-builder/properties/disable.png" alt="App Builder: Properties Panel"/>

#### Tooltip

Displays additional information when the component is hovered over.

<img className="screenshot-full img-l" src="/img/app-builder/properties/tooltip.png" alt="App Builder: Properties Panel"/>

### Devices

| Property |  Description | Expected Value |
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Colors

ToolJet allows customization of component colors. Colors can be set by entering a hex code or dynamically through the **fx** option.

### Border Radius

The border radius of a component can be configured from the Styles tab to control the roundness of its corners.

### Box Shadow

Adds shadow effects around the component to enhance its appearance. This setting is available under the Styles tab.
