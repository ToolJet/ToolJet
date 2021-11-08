---
sidebar_position: 1
---

# Creating Widgets
These are some of the most useful properties and functions passed to the widget

### properties

The `properties` object will contain the configurable properties of a widget, initially obtained from its definition on `components.js`.
The values inside `properties` changes whenever the developer changes it from the inspector panel of ToolJet editor.

### exposedVariables

The `exposedVariables` object will contain the values of all exposed variables as configured in `components.js`.

### setExposedVariable('exposedVariableName', newValue)

This function allows you to update the value of an exposed variable to `newValue`.

### validate(value)

This function validates the `value` passed based on the validation settings configured on the inspector panel for the widget.
It returns an array `[isValid, validationError]`, which represents respectively, whether the `value` passed is valid,
and the error message if there is one.