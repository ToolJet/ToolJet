---
id: styling-components
title: Styling Components in App-Builder
---

The best way to give a customized appearance to ToolJet applications is by making changes to the text and color styling of the components.

To modify the appearance of an individual component on the canvas, select the component and navigate to the **Styles** tab in the configuration panel. Here, we'll see various styling options like font weight, font style, color, background color and border radius, which may vary based on the type of component we've selected.

In this guide, we'll take a simple UI and transform it by adding style to it. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/preview.png" alt="Preview" width="100%" />
</div>

The UI contains an **[Icon](/docs/widgets/icon)** component next to a **[Text](/docs/widgets/text)** component as the header, a **[Form](/docs/widgets/form)** component at the center and a **[Steps](/docs/widgets/steps)** component at the bottom.

We'll pick colors from the below color scheme to update our UI. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/color-palette.png" alt="Color Palette" width="100%" />
</div>

## Change Text and Colors 

Click on the **Global Settings** icon in the left side-bar, click on the hex code next to the **Canvas background** property and a window will open up. We can now select the color by:
- adjusting the color picker and transparency slider,
- entering hex codes or RGB values OR
- picking a color from the color palette at the bottom.

We will use hex codes in this guide. Enter the `F4E9CD` (hex code for parchment color) in the **Hex** property. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-canvas-color.gif" alt="Canvas Color Change" width="100%" />
</div>

The background of our application has been set to parchment color from our color scheme. 

We will change the color of the **Icon** and the **Text** component next to it to rich black. Click on the **Icon** component, go to the **Styles** tab and change the **Icon Color** to `031926`(hex code for rich black color).

Similarly, click on the **Text** component in the header, go to the **Styles** tab and change the Text color to `031926` and Text Size to `25`.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-header.png" alt="Updated Header" width="100%" />
</div>

There will be a very subtle change in the color since the default color was already a different shade of black for both components. The font size of the **Text** component has become bigger and it is now looking much better next to the icon. 

We'll now change the **Form** component's color scheme. Select the **Form** component, go to the **Styles** tab and change the **Background Color** to `9DBEBB` (ash gray) and **Border Color** to `468189` (teal).


Let's also change the **Box Shadow** properties. Box Shadow allows us to add shadows to a component. 

Change the color of the Box Shadow to `9B9B9B`(medium grey) and change the rest of the values according to the below table:

| Property  | Value | Explanation                                               |
|:----------|:------|:---------------------------------------------------------|
| X  | 3px  | Horizontal offset of the shadow; negative value moves it to the left.  |
| Y  | 3px  | Vertical offset of the shadow; negative value moves it upwards.        |
| Blur      | 1     | Amount of blur applied to the shadow.                               |
| Spread    | 1     | Size of the shadow; positive value increases it, negative value decreases it. |

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-form.png" alt="Updated Form" width="100%" />
</div>

The Form component looks much better now with the new color scheme while the box shadow has added some depth to it. 

The **Name** and **Age** labels need a bit of work. For both the components, change the Font Weight to **Bold**, Font Style to **Italic** and Word Spacing to **1**. 

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-labels.png" alt="Updated Labels" width="100%" />
</div>

Lastly, change the submit button's **Background Color** and **Border color** to `031926`(rich black).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-submit-button.png" alt="Updated Submit Button" width="100%" />
</div>


The overall appearance has improved significantly, but a final refinement can add some more polish to the UI. Let's adjust the Border Radius to **10** for the Form component and **5** for the two input fields and button.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-border-radius.png" alt="Updated Border Radius" width="100%" />
</div>

Updating the Border Radius property has created rounded corners for our components that look a bit more elegant compared to earlier.

## Use FX To Programmatically Set Values

We are now left with changing the **Steps** component at the bottom. Let's see how we can set values programmatically for it.

To customize the color of the Steps component in ToolJet App-Builder, let's select it, navigate to the **Styles** tab and look for the **Color** property. Next to it, we can see an **fx** button — click on it. An input field will appear where we can enter custom JavaScript code. Enter the below code in the input field:

```js
{{components.steps.currentStepId === 2 ? "#031926" : "#ffffff"}}
```
<i>We need to use double curly braces to input custom JavaScript code or to access queries, component-related values and other variables.</i>

<br/>
<br/>

The **currentStepId** key of the Steps component stores the ID of the active step. The JavaScript code above will change the color to `#031926` (rich black) if the currentStepId is set to 2. If it's not 2, the color will default to `#ffffff` (white).

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/updated-steps.gif" alt="Updated Steps" width="100%" />
</div>

Let's continue using **fx** to enable or disable the submit button based on the user input. 

Click on the **Button** component in the form, navigate to the **Styles** tab and look for the **Disable** property. Click on the **fx** button next to it, and enter the below code in the input field:

```js
{{components.userDetailsForm.data.ageInput.value > 18 ? false : true}}
```

<i>For configuration settings with toggle buttons, the code we enter should return a boolean value(true or false) to enable or disable the related functionality or style. </i> 

<br/>
<br/>

The above code snippet is checking the value of the input field named *ageInput*. Specifically, it's evaluating whether the age entered is greater than 18. If the age is over 18, the code will return false, meaning the button will remain active. If the age is 18 or less, the code will return true, the button will be disabled.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/styling-components/disable-condition-on-button
.gif" alt="Disable Condition On Button" width="100%" />
</div>

In this last section of the guide, we've successfully set up a condition that enables or disables a button based on end-user input.

With that, we've gone through some basics of styling components in ToolJet App-Builder. While the covered topics are enough for revamping the UI, there are plenty of other customization options that we can use in ToolJet App-Builder to fine-tune the applications. 