---
id: customstyles
title: Custom Styles
---

<PlanBadge type="pro" />

The Custom Styles feature in ToolJet allows users to apply their own CSS, overriding the default app styles. This enables easy customization of app appearance and helps maintain consistent themes across all ToolJet apps in a workspace. By using standardized styles, users avoid the repetitive task of manually styling components for each new app, enhancing development efficiency and ensuring visual coherence for a seamless user experience.

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/customcss-v2.gif" alt="Custom CSS" /> 

There are three ways to target components from the **Custom Styles** page, in increasing order of specificity:

- **All components of a type** - using the component's auto-generated `_tooljet-<component>` class, to restyle every instance of that component across the workspace.
- **A single, individual component** - using the component's auto-generated `_tooljet-<component_name>` class, based on the name given to that specific instance.
- **A custom CSS class** - using a class name you define yourself on the component's **Style** tab, which lets you group and style any number of components, regardless of their type or name, with a single rule.

:::info
ToolJet's default component styles are applied with fairly high specificity, so most Custom Styles rules need `!important` to reliably override them, as shown in the examples below.
:::

## Applying Custom Styles To All Components

Follow these steps to apply custom styles in your ToolJet apps:

- Navigate to the **Custom Styles** page from **Workspace Settings** on the ToolJet dashboard

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/custom-styles.png" alt="Custom CSS" />

- To modify the default colors of components, use their class names, which follow the format `_tooljet-<component>`. 

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/component-class.png" alt="Component Class" />

- You'll need to identify the specific sub-class(or HTML tags) of each component to target particular attributes. The browser's inspector will allow you to easily find the sub-class(or HTML tags) of the specific 
properties. 

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/button-class-subclass.png" alt="Sub-Class" />

- After locating the specific sub-class(or HTML tag), refer it in the **Custom Styles** section and add styling to it. For instance, for the Button component above, the the below CSS will change the background color:

```css
._tooljet-Button button {
    background-color: #152A65 !important;
}
```

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/button-component-customcss.png" alt="Button Custom CSS" />

- Similarly, the code below can be used to change the background color of the Filter button on a Table component.

```css
._tooljet-Table .table-card-header button {
    background-color: #152A65 !important;
}
```

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/filter-button-customcss.png" alt="Filter Custom CSS" />

- The code below will change the font size and color of the Text Input and Number Input labels.

```css
._tooljet-TextInput p  {
	color: #152A65 !important;
    font-size: 16px !important;
    font-weight: bold !important;
}

._tooljet-NumberInput p  {
	color: #152A65 !important;
    font-size: 16px !important;
    font-weight: bold !important;
}
```
<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/input-fields-customcss.png" alt="Input Field Custom CSS" />

## Applying Custom Styles To Individual Components

To modify the colors of individual components, use their class names, which follow the format `_tooljet-<component_name>`. Here, the component name refers to the name of the component that is set in the application.

<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/individual-class.png" alt="Individual Class Custom CSS" />

- The color of the Button component above can be changed using the code below:

```css
._tooljet-addIncomeButton button {
    background-color: blue !important;
}
```
<img className="screenshot-full img-full" src="/img/v2-beta/app-builder/customcss/individual-customcss.png" alt="Individual Class Custom CSS" />

## Applying Custom Styles Using A Custom CSS Class

Targeting components by their auto-generated `_tooljet-<component_name>` class works well for a single component, but that class is tied to the component's name - if the component is ever renamed, the class (and any styles targeting it) changes too. It's also not reusable: to apply the same look to several components, you'd have to repeat the same CSS rule for every component name.

The **CSS class** field solves both of these problems by letting you assign your own, independent class name to a component, which you can then target from **Custom Styles** like any regular CSS class - reusable across any number of components, and unaffected by renames.

### Adding A CSS Class To A Component

- Select the component on the canvas and open the **Style** tab in the right-side panel.
- Scroll down to the **Advanced** accordion and expand it.
- Enter a class name in the **CSS class** field. To assign multiple classes to the same component, separate them with a space, for example `primary-action highlight`.

:::info
The **CSS class** field also supports dynamic values - click on the **fx** button next to it to set the class programmatically using a JS expression.
:::

### Targeting The Class From Custom Styles

Once a component has a custom class, navigate to the **Custom Styles** page from **Workspace Settings** and write CSS against that class name directly, the same way you would style any standard CSS class:

```css
.primary-action {
    background-color: #152A65 !important;
    border-radius: 8px !important;
}
```

This rule is applied to every component carrying the `primary-action` class, irrespective of the component's type or name - so you can, for instance, give a Button and a Link the exact same look by assigning both the same class.

:::caution
The **CSS class** field, like the rest of the Custom Styles feature, is only available on plans with **Custom Styles** enabled.
:::

## Conclusion

The Custom Styles feature lets you override ToolJet's default component styles with your own CSS. By providing the flexibility to target all components of a type, a single named component, or any group of components sharing a custom class, this feature enhances the visual coherence and branding of your apps while keeping the styling maintainable as your apps grow.