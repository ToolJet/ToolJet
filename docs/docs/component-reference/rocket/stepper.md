---
id: stepper
title: Stepper
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Stepper** component is a wizard container that splits a long task into steps, each with its own area to drop components into, and **Back**, **Next** and **Finish** buttons. Values entered in earlier steps are kept as the user moves between them.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Steps | Steps in order, each with an `id` and a `label`. Keep the ids the same, since components dropped into a step stay with its id. | Array |
| Start step | Id of the step shown. It updates as the user moves between steps. | Text. Default: `account` |
| Finish button | Text on the button shown on the last step. | Text. Default: `Finish` |
| Next button | Text on the button that moves to the next step. | Text. Default: `Next` |
| Back button | Text on the button that moves to the previous step. | Text. Default: `Back` |
| Steps in order only | Stops the user from jumping ahead by clicking a later step in the header. They can still go back. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On step change | Triggers when the stepper moves to another step. |
| On finish | Triggers when the user clicks the finish button on the last step. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Next step | Moves to the next step. | `components.stepper1.nextTab()` |
| Previous step | Moves to the previous step. | `components.stepper1.previousTab()` |
| Go to step | Moves to the step with the given **Step id**. | `components.stepper1.setTab("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.stepper1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.stepper1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.stepper1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `steps` | Steps in order, each with an `id` and a `label`. Keep the ids the same, since components dropped into a step stay with its id. | `{{components.stepper1.steps}}` |
| `currentStep` | Id of the step shown. It updates as the user moves between steps. | `{{components.stepper1.currentStep}}` |
| `finishLabel` | Text on the button shown on the last step. | `{{components.stepper1.finishLabel}}` |
| `nextLabel` | Text on the button that moves to the next step. | `{{components.stepper1.nextLabel}}` |
| `backLabel` | Text on the button that moves to the previous step. | `{{components.stepper1.backLabel}}` |
| `linearSteps` | Stops the user from jumping ahead by clicking a later step in the header. They can still go back. | `{{components.stepper1.linearSteps}}` |
| `currentStepIndex` | The position of the current step, starting at `0`. | `{{components.stepper1.currentStepIndex}}` |
| `isFirstStep` | Whether the first step is shown. | `{{components.stepper1.isFirstStep}}` |
| `isLastStep` | Whether the last step is shown. | `{{components.stepper1.isLastStep}}` |
| `isVisible` | Whether the component is visible. | `{{components.stepper1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.stepper1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.stepper1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent | Theme: Brand primary |
| Background | Theme: Surface 1 |
| Border radius | — |
| Padding | `12` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
