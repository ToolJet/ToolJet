---
sidebar_position: 2
---

# Radio Button

Radio Buttons can be used for to select one option in a 
group of options.

<img class="screenshot-full" src="/img/widgets/radio-button/widget.gif" alt="ToolJet - Radio Button Widget" height="420"/>

:::tip
It is preferred to use radio buttons when list of options
are small (ideally six or fewer) and all the options can be 
displayed at once.
:::

:::info
For more than six options, consider using [Dropdown](/docs/widgets/dropdown) widget.
:::


## Event: onSelectionChange

This event is triggered when a option is clicked. 
Properties can be selected from `On select` option from
the inspect panel on the left sidebar. 

## Property : Label

This property specifies a label that identifies the control to the user.
Default Label: `Select`


## Property : Values (Array)

This property can be used to retrieve the value of the input it was called on.

## Property : Display Values (Array of strings)

This property can be used to display the options of the input


## Example
<img class="screenshot-full" src="/img/widgets/radio-button/property.gif" alt="ToolJet - Radio Button Widget Properties" height="420"/>