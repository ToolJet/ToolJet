---
id: steps
title: Steps
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Steps** component shows progress through a multi-step process, such as onboarding or an order's stages, with finished steps checked and the current one highlighted. It only shows progress; use **Stepper** for a wizard with content in each step.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Steps | Steps in order, as plain names or as items with an `id` and `name` that can add a `description`, `tooltip`, `visible` or `disabled`. | Array |
| Current step (id) | Id of the current step. When this changes, the indicator moves to that step. | Text |
| Current step (0-based) | Position of the current step, starting at `0`. It updates as the step changes. | Number. Default: `1` |
| Steps selectable | Lets the user click a step to make it current. | On or off. Default: On |
| Orientation | Whether the steps run across or down. | Horizontal, Vertical. Default: Horizontal |
| Marker | Marker for each step: a numbered circle or a small dot. | Numbers, Dots. Default: Numbers |
| Loading look | What shows while the component is loading: a spinner or a skeleton outline. | Spinner, Skeleton. Default: Spinner |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On select | Triggers when the user clicks a step. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set step | Makes the step with the given **Step id** current. A disabled step is ignored. | `components.steps1.setStep("")` |
| Next step | Moves to the next step that isn't disabled. | `components.steps1.nextStep()` |
| Previous step | Moves to the previous step that isn't disabled. | `components.steps1.previousStep()` |
| Reset steps | Moves back to the first step that isn't disabled. | `components.steps1.resetSteps()` |
| Set step visibility | Shows or hides the step with the given **Step id** until **Steps** changes. | `components.steps1.setStepVisible("", "{{true}}")` |
| Set step disable | Disables or enables the step with the given **Step id** until **Steps** changes. | `components.steps1.setStepDisable("", "{{true}}")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.steps1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.steps1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.steps1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `steps` | Steps in order, as plain names or as items with an `id` and `name` that can add a `description`, `tooltip`, `visible` or `disabled`. | `{{components.steps1.steps}}` |
| `currentStep` | Id of the current step. When this changes, the indicator moves to that step. | `{{components.steps1.currentStep}}` |
| `currentStepIndex` | Position of the current step, starting at `0`. It updates as the step changes. | `{{components.steps1.currentStepIndex}}` |
| `stepsSelectable` | Lets the user click a step to make it current. | `{{components.steps1.stepsSelectable}}` |
| `orientation` | Whether the steps run across or down. | `{{components.steps1.orientation}}` |
| `variant` | Marker for each step: a numbered circle or a small dot. | `{{components.steps1.variant}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton outline. | `{{components.steps1.loadingIndicator}}` |
| `currentStepId` | The id of the current step. | `{{components.steps1.currentStepId}}` |
| `isVisible` | Whether the component is visible. | `{{components.steps1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.steps1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.steps1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Completed and current accent | Theme: Brand primary |
| Upcoming step accent (circle border, line) | Theme: Default border |
| Completed step label | Theme: Primary text |
| Current step label | Theme: Primary text |
| Upcoming step label | Theme: Placeholder text |
| Description color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
