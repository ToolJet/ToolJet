---
id: questionnaire
title: Questionnaire
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Questionnaire** component asks a series of questions one at a time, with answer cards, a progress bar and **Previous**, **Skip**, **Next** and **Submit** buttons. Use it for onboarding flows, surveys or intake forms.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | Questions to ask, in order. Each has a `name` and a `prompt`, and can set a `description`, `required`, a `type` of `single`, `multiple` or `text`, `choices`, an `other` free-text choice and a `placeholder`. | Array |
| Default answers | Answers filled in when the questionnaire starts, keyed by question `name`. | Object |
| Answer shortcuts | Keys shown on the answer cards that pick an answer: **Letters** (A, B, C), **Numbers** (1, 2, 3) or **None**. | Letters, Numbers, None. Default: Letters |
| Show progress | Shows a bar and a count of how far through the questions the user is. | On or off. Default: On |
| Submit button label | Text on the button shown on the last question. | Text. Default: `Submit` |
| Completed title | Heading shown after the user submits. | Text. Default: `Thanks for your answers` |
| Completed text | Message shown under **Completed title** after the user submits. | Text. Default: `We will use them to set up your workspace.` |
| Surface | **Card** draws the questionnaire in a bordered box; **Plain** shows it without one. | Card, Plain. Default: Card |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On step changed](../common-settings.md#events) | Triggers when the questionnaire moves to another question. |
| [On submit](../common-settings.md#events) | Triggers when the user submits and every required question is answered. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Reset | Restores the default answers and goes back to the first question. | `components.questionnaire1.reset()` |
| Go to question | Moves to the question given by **Index or name**, a position starting at `0` or a question's `name`. It reopens a submitted questionnaire. | `components.questionnaire1.goTo("{{0}}")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | Questions to ask, in order. Each has a `name` and a `prompt`, and can set a `description`, `required`, a `type` of `single`, `multiple` or `text`, `choices`, an `other` free-text choice and a `placeholder`. | `{{components.questionnaire1.items}}` |
| `defaultAnswers` | Answers filled in when the questionnaire starts, keyed by question `name`. | `{{components.questionnaire1.defaultAnswers}}` |
| `shortcuts` | Keys shown on the answer cards that pick an answer: **Letters** (A, B, C), **Numbers** (1, 2, 3) or **None**. | `{{components.questionnaire1.shortcuts}}` |
| `showProgress` | Shows a bar and a count of how far through the questions the user is. | `{{components.questionnaire1.showProgress}}` |
| `submitLabel` | Text on the button shown on the last question. | `{{components.questionnaire1.submitLabel}}` |
| `completeTitle` | Heading shown after the user submits. | `{{components.questionnaire1.completeTitle}}` |
| `completeText` | Message shown under **Completed title** after the user submits. | `{{components.questionnaire1.completeText}}` |
| `surface` | **Card** draws the questionnaire in a bordered box; **Plain** shows it without one. | `{{components.questionnaire1.surface}}` |
| `answers` | The answers keyed by question `name`: the chosen value for a single choice, a list of values for a multiple choice, and the text for a text question. | `{{components.questionnaire1.answers}}` |
| `currentIndex` | The position of the current question, starting at `0`. | `{{components.questionnaire1.currentIndex}}` |
| `currentItem` | The current question's `name`, `prompt`, `type` and `required`. | `{{components.questionnaire1.currentItem}}` |
| `isComplete` | Whether the user has submitted the questionnaire. | `{{components.questionnaire1.isComplete}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent (progress, selected answer, buttons) | Theme: Brand primary |
| Background | Theme: Surface 1 |
| Border and answer card border | Theme: Default border |
| Question color | Theme: Primary text |
| Description and answer description color | Theme: Placeholder text |
| Radius | — |
| Question typeface | Theme font |
