---
id: modal
title: Modal
---
# Modal

Modal widget renders in front of a backdrop, and it blocks interaction with the rest of the application until the modal is closed. It can be used to add dialog boxes to your app for lightboxes, user notifications, forms, etc.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Modal](/img/widgets/modal/modal1.gif)

</div>

## Add widgets to Modal

To add widgets to the Modals please refer to **[Tutorial - Adding widgets to a modal](/docs/tutorial/adding-widget#adding-widgets-to-modal)**

## Properties

### Title

Title that should be shown on the header of the modal. 

### Modal size

Size of the modal. Options are `medium`, `small` and `large`. The default is `small`. You can also programmatically configure the value by clicking on the `Fx` and set the value to `sm`, `md` or `lg`.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::