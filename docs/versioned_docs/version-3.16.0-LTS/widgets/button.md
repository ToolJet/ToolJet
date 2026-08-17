---
id: button
title: Button
---

The **Button** component can be used to trigger an action — such as submitting a form, navigating to another page, or running a query. In this document, we'll go through all the configuration options for the **Button** component.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label | Text to display on the button. | String (e.g., `Submit`). |

## Events

| Event | Description |
| :---- | :---------- |
| On click | Triggers whenever the user clicks the button. |
| On hover | Triggers whenever the user moves the mouse cursor over the button. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the Button component can be controlled using the component-specific actions (CSA). You can trigger them using an event or a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| click() | Programmatically triggers a button click. | `components.button1.click()` |
| setText() | Sets the label displayed on the button. | `components.button1.setText('Update')` |
| setVisibility() | Sets the visibility of the component. | `components.button1.setVisibility(false)` |
| setLoading() | Sets the loading state of the component. | `components.button1.setLoading(true)` |
| setDisable() | Enables or disables the component. | `components.button1.setDisable(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | How To Access |
| :--------------------------------------------- | :------------------------------------------------ | :------------ |
| buttonText | Holds the text currently displayed on the button. | `{{components.button1.buttonText}}` |
| isLoading | Indicates if the component is in a loading state. | `{{components.button1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.button1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.button1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when hidden, so surrounding components fill the space. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Displays an informational tooltip when the user hovers over the component. | String (e.g., `Button to Submit Form`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

---

## Styles

### Button

| <div style={{ width:"130px"}}> Button Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Type | Sets the fill style of the button. | Select `Solid` for a filled button or `Outline` for a transparent button with a border. |
| Background | Sets the background color of the button. Only available for `Solid` type. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text color | Sets the color of the button label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Font size | Sets the font size of the button label. | Enter a number (in pixels) or click on **fx** and enter a code that programmatically returns a numeric value. |
| Font weight | Sets the weight (thickness) of the button label text. | Select from `Normal`, `Medium`, `Bold`, `Lighter`, or `Bolder`. |
| Border color | Sets the border color of the button. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Loader color | Sets the color of the loading spinner shown during the loading state. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Content alignment | Sets the horizontal alignment of the button's label and icon. | Select `Left`, `Center`, or `Right` using the alignment buttons. |
| Icon | Adds an icon alongside the button label. | Enable icon visibility, then select an icon and set the icon color. |
| Icon color | Sets the color of the icon. Visible only when an icon is enabled. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon direction | Sets whether the icon appears to the left or right of the label. | Select **Left** or **Right** using the icon toggles. |
| Border radius | Rounds the corners of the button. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow of the button. Only available for `Solid` type. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Container

| <div style={{ width:"130px"}}> Container Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Hover background | Controls the background color when the button is hovered. Only available for `Solid` type. | Select `Auto` to derive the hover color automatically, or `Manual` to set a custom color using the color picker or **fx**. |
| Padding | Controls the padding around the button. | Select `Default` to maintain standard padding or `None` to remove all padding. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
