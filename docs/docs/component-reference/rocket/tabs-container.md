---
id: tabs-container
title: Tabs
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Tabs** component is a container with a row of tabs, each with its own area to drop components into, so related content shares one space, such as a record's details, activity and files. With the **Steps** style it works as a wizard with **Back**, **Next** and **Finish** buttons.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tabs | Tabs to show, each with an `id` and a `label`. Each can add an `icon`, `badge`, `disable`, `visible` or `loading`. Keep the ids the same, since components dropped into a tab stay with its id. | Array |
| Current tab | Id of the tab that is open. It updates as the user switches tabs. | Text. Default: `details` |
| Default tab | Id of a tab to open. When this changes, the component switches to that tab. | Text |
| Style | Look of the tab bar. **Pills** highlights the open tab, **Underline** draws a line under it, and **Steps** shows numbered steps with wizard buttons. | Pills, Underline, Steps. Default: Pills |
| Tab alignment | Where the tabs sit in the bar. **Stretch** spreads them across the full width. | Start, Center, Stretch. Default: Start |
| Orientation | Whether the tabs run along the **Top** or down the **Side**. The **Steps** style always runs along the top. | Top, Side. Default: Top |
| Hide tabs | Hides the tab bar and shows only the open tab's area. Switch tabs with actions. | On or off. Default: Off |
| Render only active tab | Loads only the open tab's components. When off, every tab's components stay loaded, keeping their values while hidden. | On or off. Default: Off |
| Scroll to top on tab switch | Scrolls the newly opened tab back to its top. | On or off. Default: Off |
| Wizard: Back and Next buttons | With the **Steps** style, shows **Back** and **Next** buttons and a step count under the content. | On or off. Default: On |
| Wizard: Next label | Text on the wizard's button that moves to the next step. | Text. Default: `Next` |
| Wizard: Back label | Text on the wizard's button that moves to the previous step. | Text. Default: `Back` |
| Wizard: Finish label | Text on the wizard's button on the last step. | Text. Default: `Finish` |
| Wizard: steps in order only | With the **Steps** style, stops the user from jumping ahead by clicking a later step. | On or off. Default: On |
| Loading look | What shows while the component is loading: a spinner or a skeleton tab bar. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On tab switch](../common-settings.md#events) | Triggers when the open tab changes. |
| [On finish](../common-settings.md#events) | Triggers when the user clicks the wizard's finish button on the last step. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set tab | Opens the tab with the given **Tab id**. A hidden or disabled tab is ignored. | `components.tabscontainer1.setTab("")` |
| Next tab | Opens the next tab. | `components.tabscontainer1.nextTab()` |
| Previous tab | Opens the previous tab. | `components.tabscontainer1.previousTab()` |
| Set tab disable | Disables or enables the tab with the given **Tab id** until **Tabs** changes. | `components.tabscontainer1.setTabDisable("", "{{true}}")` |
| Set tab loading | Shows or hides a loading spinner in place of the content of the tab with the given **Tab id**. | `components.tabscontainer1.setTabLoading("", "{{true}}")` |
| Set tab visibility | Shows or hides the tab with the given **Tab id** until **Tabs** changes. Hiding the open tab moves to the next one. | `components.tabscontainer1.setTabVisibility("", "{{true}}")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tabs` | Tabs to show, each with an `id` and a `label`. Each can add an `icon`, `badge`, `disable`, `visible` or `loading`. Keep the ids the same, since components dropped into a tab stay with its id. | `{{components.tabscontainer1.tabs}}` |
| `currentTab` | Id of the tab that is open. It updates as the user switches tabs. | `{{components.tabscontainer1.currentTab}}` |
| `defaultTab` | Id of a tab to open. When this changes, the component switches to that tab. | `{{components.tabscontainer1.defaultTab}}` |
| `variant` | Look of the tab bar. **Pills** highlights the open tab, **Underline** draws a line under it, and **Steps** shows numbered steps with wizard buttons. | `{{components.tabscontainer1.variant}}` |
| `tabsAlign` | Where the tabs sit in the bar. **Stretch** spreads them across the full width. | `{{components.tabscontainer1.tabsAlign}}` |
| `orientation` | Whether the tabs run along the **Top** or down the **Side**. The **Steps** style always runs along the top. | `{{components.tabscontainer1.orientation}}` |
| `hideTabs` | Hides the tab bar and shows only the open tab's area. Switch tabs with actions. | `{{components.tabscontainer1.hideTabs}}` |
| `renderOnlyActiveTab` | Loads only the open tab's components. When off, every tab's components stay loaded, keeping their values while hidden. | `{{components.tabscontainer1.renderOnlyActiveTab}}` |
| `scrollToTopOnTabSwitch` | Scrolls the newly opened tab back to its top. | `{{components.tabscontainer1.scrollToTopOnTabSwitch}}` |
| `showStepNav` | With the **Steps** style, shows **Back** and **Next** buttons and a step count under the content. | `{{components.tabscontainer1.showStepNav}}` |
| `nextLabel` | Text on the wizard's button that moves to the next step. | `{{components.tabscontainer1.nextLabel}}` |
| `backLabel` | Text on the wizard's button that moves to the previous step. | `{{components.tabscontainer1.backLabel}}` |
| `finishLabel` | Text on the wizard's button on the last step. | `{{components.tabscontainer1.finishLabel}}` |
| `linearSteps` | With the **Steps** style, stops the user from jumping ahead by clicking a later step. | `{{components.tabscontainer1.linearSteps}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton tab bar. | `{{components.tabscontainer1.loadingIndicator}}` |
| `currentTabTitle` | The label of the open tab. | `{{components.tabscontainer1.currentTabTitle}}` |
| `currentStepIndex` | The position of the open tab among the visible tabs, starting at `0`. | `{{components.tabscontainer1.currentStepIndex}}` |
| `isFirstStep` | Whether the open tab is the first visible tab. | `{{components.tabscontainer1.isFirstStep}}` |
| `isLastStep` | Whether the open tab is the last visible tab. | `{{components.tabscontainer1.isLastStep}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent (active step, focus ring) | Theme: Brand primary |
| Tab bar background | Theme: Surface 3 |
| Tab text color | Theme: Placeholder text |
| Active tab text color | Theme: Primary text |
| Active tab background (pills) | Theme: Surface 1 |
| Active tab indicator (underline) | Theme: Brand primary |
| Panel background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Background | Theme: Surface 1 |
| Radius | — |
| Tab font size | `14` |
| Border around tabs | On |
| Padding | `12` |
