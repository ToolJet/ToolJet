---
id: questionnaire
title: Questionnaire
---

<div className="badge badge--primary">Ant Design</div>

The **Questionnaire** component asks a series of questions one at a time, with Back and Next buttons and a progress bar, for surveys, onboarding forms and intake checklists.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The questions, each with a unique `name`, a `prompt` and a `type` of `single`, `multiple` or `text`. Choice questions list their `choices`; add `required: true` to make an answer needed, or `other: true` to offer a free-text Other choice. | Array |
| Default answers | Answers filled in at the start, keyed by question name, such as `{ "role": "Finance" }`. | Object |
| Shortcuts | Keys that pick a choice: `letters` for A, B, C, `numbers` for 1, 2, 3, or `none`. A key hint shows on each choice. | `letters`, `numbers`, `none`. Default: `letters` |
| Show progress | Shows a progress bar above the question. | On or off. Default: On |
| Submit label | Text on the button of the last question, which submits the answers. | Text. Default: `Submit` |
| Complete title | Heading shown after the answers are submitted. | Text. Default: `Thank you` |
| Complete text | Text shown under the heading after the answers are submitted. | Text. Default: `Your answers were submitted.` |
| Bordered | Draws a border around the questionnaire. | On or off. Default: On |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On step changed](../common-settings.md#events) | Triggers when the question shown changes. |
| [On submit](../common-settings.md#events) | Triggers when the user submits the last question and every required question is answered. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Reset | Clears the answers back to **Default answers** and returns to the first question. | `components.questionnaire1.reset()` |
| Go to | Shows the question at the given **Position or name**, a position counting from 0 or a question name. After a submit, it reopens the questions for editing. | `components.questionnaire1.goTo("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The questions, each with a unique `name`, a `prompt` and a `type` of `single`, `multiple` or `text`. Choice questions list their `choices`; add `required: true` to make an answer needed, or `other: true` to offer a free-text Other choice. | `{{components.questionnaire1.items}}` |
| `defaultAnswers` | Answers filled in at the start, keyed by question name, such as `{ "role": "Finance" }`. | `{{components.questionnaire1.defaultAnswers}}` |
| `shortcuts` | Keys that pick a choice: `letters` for A, B, C, `numbers` for 1, 2, 3, or `none`. A key hint shows on each choice. | `{{components.questionnaire1.shortcuts}}` |
| `showProgress` | Shows a progress bar above the question. | `{{components.questionnaire1.showProgress}}` |
| `submitLabel` | Text on the button of the last question, which submits the answers. | `{{components.questionnaire1.submitLabel}}` |
| `completeTitle` | Heading shown after the answers are submitted. | `{{components.questionnaire1.completeTitle}}` |
| `completeText` | Text shown under the heading after the answers are submitted. | `{{components.questionnaire1.completeText}}` |
| `bordered` | Draws a border around the questionnaire. | `{{components.questionnaire1.bordered}}` |
| `answers` | The answers keyed by question name: the picked choice for `single`, a list of choices for `multiple`, and the text for `text`. | `{{components.questionnaire1.answers}}` |
| `currentIndex` | Position of the question shown, counting from 0. | `{{components.questionnaire1.currentIndex}}` |
| `currentItem` | The question shown, as `{ name, prompt, type }`. | `{{components.questionnaire1.currentItem}}` |
| `isComplete` | `true` after the answers are submitted. | `{{components.questionnaire1.isComplete}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
