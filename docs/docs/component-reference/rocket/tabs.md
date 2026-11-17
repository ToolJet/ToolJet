---
id: tabs
title: Text Tabs
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Text Tabs** component shows short blocks of text under a row of tabs, one block per tab, such as an overview, notes and terms. To put other components inside tabs, use **Tabs**.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tabs | Tabs to show, each with a `value`, a `label` and the `content` text. Each can add an `icon`, `badge`, `disable`, `visible` or `loading`. | Array |
| Current tab | Value of the tab that is open. It updates as the user switches tabs. | Text. Default: `overview` |
| Default tab | Value of a tab to open. When this changes, the component switches to that tab. | Text |
| Style | Look of the tab bar. **Pills** highlights the open tab, **Underline** draws a line under it, and **Steps** shows numbered steps for a step-by-step flow. | Pills, Underline, Steps. Default: Pills |
| Tab alignment | Where the tabs sit in the bar. **Stretch** spreads them across the full width. | Start, Center, Stretch. Default: Start |
| Orientation | Whether the tabs run along the **Top** or down the **Side**. The **Steps** style always runs along the top. | Top, Side. Default: Top |
| Hide tabs | Hides the tab bar and shows only the open tab's content. Switch tabs with actions. | On or off. Default: Off |
| Steps in order only | With the **Steps** style, stops the user from jumping ahead by clicking a later step. | On or off. Default: On |
| Loading look | What shows while the component is loading: a spinner or a skeleton tab bar. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On tab switch](../common-settings.md#events) | Triggers when the open tab changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set tab | Opens the tab with the given **Tab id**. A hidden or disabled tab is ignored. | `components.tabs1.setTab("")` |
| Next tab | Opens the next tab. | `components.tabs1.nextTab()` |
| Previous tab | Opens the previous tab. | `components.tabs1.previousTab()` |
| Set tab disable | Disables or enables the tab with the given **Tab id** until **Tabs** changes. | `components.tabs1.setTabDisable("", "{{true}}")` |
| Set tab loading | Shows or hides a loading spinner in the content of the tab with the given **Tab id**. | `components.tabs1.setTabLoading("", "{{true}}")` |
| Set tab visibility | Shows or hides the tab with the given **Tab id** until **Tabs** changes. Hiding the open tab moves to the next one. | `components.tabs1.setTabVisibility("", "{{true}}")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tabs` | Tabs to show, each with a `value`, a `label` and the `content` text. Each can add an `icon`, `badge`, `disable`, `visible` or `loading`. | `{{components.tabs1.tabs}}` |
| `value` | Value of the tab that is open. It updates as the user switches tabs. | `{{components.tabs1.value}}` |
| `defaultTab` | Value of a tab to open. When this changes, the component switches to that tab. | `{{components.tabs1.defaultTab}}` |
| `variant` | Look of the tab bar. **Pills** highlights the open tab, **Underline** draws a line under it, and **Steps** shows numbered steps for a step-by-step flow. | `{{components.tabs1.variant}}` |
| `tabsAlign` | Where the tabs sit in the bar. **Stretch** spreads them across the full width. | `{{components.tabs1.tabsAlign}}` |
| `orientation` | Whether the tabs run along the **Top** or down the **Side**. The **Steps** style always runs along the top. | `{{components.tabs1.orientation}}` |
| `hideTabs` | Hides the tab bar and shows only the open tab's content. Switch tabs with actions. | `{{components.tabs1.hideTabs}}` |
| `linearSteps` | With the **Steps** style, stops the user from jumping ahead by clicking a later step. | `{{components.tabs1.linearSteps}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton tab bar. | `{{components.tabs1.loadingIndicator}}` |
| `currentTab` | The value of the open tab. | `{{components.tabs1.currentTab}}` |
| `currentTabTitle` | The label of the open tab. | `{{components.tabs1.currentTabTitle}}` |
| `currentStepIndex` | The position of the open tab among the visible tabs, starting at `0`. | `{{components.tabs1.currentStepIndex}}` |
| `isFirstStep` | Whether the open tab is the first visible tab. | `{{components.tabs1.isFirstStep}}` |
| `isLastStep` | Whether the open tab is the last visible tab. | `{{components.tabs1.isLastStep}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent (underline, active step) | Theme: Brand primary |
| Tab bar background | Theme: Surface 3 |
| Tab text color | Theme: Placeholder text |
| Active tab text color | Theme: Primary text |
| Active tab background (pills) | Theme: Surface 1 |
| Active tab indicator (underline) | Theme: Brand primary |
| Panel background | Theme: Surface 1 |
| Panel text | Theme: Primary text |
| Border color | Theme: Default border |
| Radius | — |
| Tab font size | `14` |
| Border around tabs | On |
| Tab list (legacy) | — |
| Active tab (legacy) | — |
