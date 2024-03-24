---
id: customstyles
title: Custom Styles
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

Custom Styles feature enables the implementation of theming on ToolJet apps, allowing users to inject their own CSS styling to override the default app styling. This feature fulfills the requirement of allowing users to easily customize the appearance of their apps.

Custom Styles helps in maintaining consistent themes across the ToolJet apps, alleviating the repetitive burden of styling components whenever a new app is created. By enabling users to apply standardized styles, this feature ensures that each app adheres to a unified theme without the need to manually restyle the components from scratch. As a result, the ToolJet app development process becomes more efficient, and the visual coherence of the apps is preserved, providing users with a seamless experience across all applications.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/customcss-v2.gif" alt="Custom CSS" />

</div>

## Applying Custom Styles

To add Custom Styles to ToolJet apps, users should follow these steps:

1. Go to the **Custom Styles** Page, accessible under **Workspace Settings** from the ToolJet dashboard.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/settings-v2.png" alt="Custom CSS" />

 </div>

2. When creating a new app on ToolJet, the default button color is **blue**. If you wish to change the default button color to **red**, you must identify the class of the button component, which follows the format `_tooljet-<component>`.
 - The browser's inspector can also help you find the class of the component. Classes are added for both **pages** and **components**, and there are two types of selectors for classes: **Common** (`_tooljet-<component>`) and **Individual** (`_tooljet-<defaultComponentName>`).
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/selectors.png" alt="Custom CSS" />

 </div>

3. Once the class (**`_tooljet-Button`**) is identified, navigate to the Custom Styles page and apply the desired CSS changes for that class, as shown in the following CSS code:
 ```css
 ._tooljet-Button button {
     background: red !important;
 }
 ._tooljet-Button button:hover {
     background: green !important;
 }
 ```

4. By applying this custom styles, all future instances of the app will have buttons with a red default color, and they will turn green on hover. This eliminates the need for users to individually edit button properties, streamlining the customization process.
 :::info
 Custom Styles are injected at the workspace level, ensuring consistent theming across all apps within the workspace.
 :::

 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/app-builder/customcss/styledapp-v2.gif" alt="Custom CSS" />

 </div>