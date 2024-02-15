---
id: text
title: Text
---
# Text

The **Text** component can be used to create headers, sub-headers, add labels next to various input fields and more. In this document, we'll go through all the configuration options for the **Text** component. 

## Data

| Data Type | Description | 
|:----------|:----------|
| **Plain text** | Simple text without any formatting. Ideal for straightforward messages where no emphasis or special layout is needed. | 
| **Markdown** | Allows for easy formatting of text with elements like headers, bold, italics, links, and lists, making it suitable for writing content that requires basic styling. | 
| **HTML** | Used to create formatted text and various elements on web pages. | 

## Events

|  <div style={{ width:"100px"}}> Event </div>     | <div style={{ width:"100%"}}> Description </div>  |
|:----------|:--------------------------------------|
| On click  | Triggers whenever the user clicks on the component. |
| On hover  | Triggers whenever the user hovers over the component.               |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of the **Text** component can be controlled using Component-Specific Actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setText()      | Sets the value of the input field.    | Employ a RunJS query (for e.g.,  <br/> `await components.text1.setText('this is input text')`) or trigger it using an event. |
| clear()        | Clears the entered text in the input field.      | Employ a RunJS query (for e.g.,  <br/> `await components.text1.clear()`) or trigger it using an event. |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.text1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.text1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.text1.setDisable(true)`) or trigger it using an event. |

:::info
Check the **component specific actions** available for this component **[here](/docs/actions/control-component)**.
:::

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|: ---------- | :---------- | :------------ |
| text       | Holds the value of the component's label. | Accessible dynamically with JS (for e.g., `{{components.text1.text}}`). |
| isLoading   | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.text1.isLoading}}`). |
| isVisible   | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.text1.isVisible}}`). |
| isDisabled  | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.text1.isDisabled}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Enter your name here.` ).                       |

## Devices

**Show on desktop**

Makes the component visible in desktop view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.

**Show on mobile**

Makes the component visible in mobile view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.

---
# Styles

## Text 

| Text Property          | Description                           | Configuration Options |
|:--------------------|:--------------------------------------|:---------------|
| Size         | Dimensions of the characters in a font. | Enter any number between `1-100` or dynamically configure it using `fx`. |
| Weight       | Determines how bold or light your text will appear. | Select from `light`, `regular`, `semi-bold` or `bold` or dynamically configure it using `fx`. |
| Style        | Allows you to apply styles like italic or normal, altering the overall look of the text content. | Select from `normal`, `italic` or `oblique` or dynamically configure it using `fx`. |
| Color        | Sets the color of the text. | Choose a color using the color picker or dynamically configure it using `fx`. |
| Scroll        | Creates a scroll bar if the text exceeds the component's dimensions. | Choose between `enable` or `disable` or dynamically configure it using `fx`. |
| Line Height       | Determines the vertical space between lines of text within an element. | Enter a number as the value (example: `1.5`) or dynamically configure it using `fx`.|
| Text Indent       | Commonly used to create an indentation effect. | Enter a number as the value (example: `10`) or dynamically configure it using `fx`.|
| Alignment        | Sets the alignment of the text. | Select the available options to align the text vertically or horizontally or dynamically configure it using `fx`.|
| Text Decoration   | Adds an underline, overline, line-through, or a combination of lines to selected text. | Select one of the available options - `none(default)`, `underline`, `overline`, and `strike-through` or dynamically configure it using `fx`. |
| Transformation | Dictates the capitalization of text. | Select one of the available options - `none (default)`, `uppercase`, `lowercase`, `capitalize` or dynamically configure it using `fx`.|
| Letter spacing | Determines the space between each letter. | Enter a number as the value (example: `15`) or dynamically configure it using `fx`.|
| Word spacing | Determines the space between each word. | Enter a number as the value (example: `15`) or dynamically configure it using `fx`.|
| Font variant | Adjusts the text appearance by applying font variations. | Select one of the available options - `normal`, `inherit`, `small-caps`, `initial` or dynamically configure it using `fx`.|



## Container

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border    | Sets the border color of the component.                                                       | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on `fx` and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or programmatically set it using `fx`.                                            
| Padding      | Adds padding to the component | Select `None` for no padding and `Default` for standard padding.      

