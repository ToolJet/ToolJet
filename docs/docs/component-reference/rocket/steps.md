---
id: steps
title: Steps
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Steps** component shows progress through a multi-step process, such as onboarding or an order's stages, with finished steps checked and the current one highlighted. It only shows progress; use **Stepper** for a wizard with content in each step.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user clicks a step. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set step | Makes the step with the given **Step id** current. A disabled step is ignored. | `components.steps1.setStep("")` |
| Next step | Moves to the next step that isn't disabled. | `components.steps1.nextStep()` |
| Previous step | Moves to the previous step that isn't disabled. | `components.steps1.previousStep()` |
| Reset steps | Moves back to the first step that isn't disabled. | `components.steps1.resetSteps()` |
| Set step visibility | Shows or hides the step with the given **Step id** until **Steps** changes. | `components.steps1.setStepVisible("", "{{true}}")` |
| Set step disable | Disables or enables the step with the given **Step id** until **Steps** changes. | `components.steps1.setStepDisable("", "{{true}}")` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Completed and current accent | Theme: Brand primary |
| Upcoming step accent (circle border, line) | Theme: Default border |
| Completed step label | Theme: Primary text |
| Current step label | Theme: Primary text |
| Upcoming step label | Theme: Placeholder text |
| Description color | Theme: Placeholder text |
