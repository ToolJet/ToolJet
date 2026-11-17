---
id: component-library
title: Component Library
---

**Components** are the building blocks of ToolJet applications, used to create interactive user interfaces. The **Component Library**, located on the right, contains all [available components](#available-components). 

Components can be added to the canvas by dragging and dropping them onto the canvas at your desired location.

<img className="screenshot-full img-full" src="/img/app-builder/components/component-library.png" alt="App Builder: Component library"/>

## Available Components

| Category | Components |
|:----------|:------------|
| **Buttons**  | [Button](/docs/widgets/button/), [Button Group](/docs/widgets/button-group/), [Popover Menu](/docs/widgets/popover-menu/) |
| **Data** | [Table](/docs/widgets/table/), [Chart](/docs/widgets/chart/)|
| **Layouts** | [Form](/docs/widgets/form/), [Modal](/docs/widgets/modal-v2/), [Container](/docs/widgets/container/), [Tabs](/docs/widgets/tabs/), [ListView](/docs/widgets/listview/), [Kanban](/docs/widgets/kanban/), [Calendar](/docs/widgets/calendar/) |
| **Text Inputs** | [Text Input](/docs/widgets/text-input/), [Text Area](/docs/widgets/text-area/), [Email Input](/docs/widgets/email-input/), [Password Input](/docs/widgets/password-input/), [Rich Text Editor](/docs/widgets/rich-text-editor/) |
| **Number Inputs** | [Number Input](/docs/widgets/number-input/), [Phone Input](/docs/widgets/phone-input/), [Currency Input](/docs/widgets/currency-input/), [Range Slider](/docs/widgets/range-slider/), [Star Rating](/docs/widgets/star-rating/) |
| **Select Inputs** | [Dropdown](/docs/widgets/dropdown/), [Multi-Select](/docs/widgets/multiselect/), [Toggle Switch](/docs/widgets/toggle-switch-v2/), [Radio Button](/docs/widgets/radio-button-v2/), [Checkbox](/docs/widgets/checkbox/), [Tree Select](/docs/widgets/tree-select/), [Cascader](/docs/widgets/cascader/) |
| **Date and Time Inputs** | [Date-range Picker](/docs/widgets/date-range-picker/), [Date Picker](/docs/widgets/date-picker-v2/), [Time Picker](/docs/widgets/time-picker/), [Date-Time Picker](/docs/widgets/datetime-picker-v2/) |
| **Navigation** | [Link](/docs/widgets/link/), [Pagination](/docs/widgets/pagination/), [Steps](/docs/widgets/steps/) |
| **Media** | [Icon](/docs/widgets/icon/), [Image](/docs/widgets/image/), [SVG Image](/docs/widgets/svg-image/), [PDF](/docs/widgets/pdf/), [Map](/docs/widgets/map/) |
| **Presentation** | [Text](/docs/widgets/text/), [Tags](/docs/widgets/tags/), [Circular Progressbar](/docs/widgets/circular-progress-bar/), [Timeline](/docs/widgets/timeline/), [Divider](/docs/widgets/divider/), [Vertical Divider](/docs/widgets/vertical-divider/), [Spinner](/docs/widgets/spinner/), [Statistics](/docs/widgets/statistics/), [Timer](/docs/widgets/timer/), [Progress Bar](/docs/widgets/progress-bar/) |
| **Custom** | [Custom Component](/docs/widgets/custom-component/), [HTML Viewer](/docs/widgets/html/), [iFrame](/docs/widgets/iframe/) |
| **Miscellaneous** | [Filepicker](/docs/widgets/file-picker/), [Code Editor](/docs/widgets/code-editor/), [Color Picker](/docs/widgets/color-picker/), [Bounded Box](/docs/widgets/bounded-box/), [QR Scanner](/docs/widgets/qr-scanner/) |
| **Legacy** | [Modal](/docs/3.5.0-LTS/widgets/modal/), [Datetime Picker](/docs/widgets/datepicker/), [Radio Button](/docs/3.5.0-LTS/widgets/radio-button/), [Toggle Switch](/docs/3.5.0-LTS/widgets/toggle-switch/), [Dropdown](/docs/2.50.0-LTS/widgets/dropdown/), [Multiselect](/docs/widgets/multiselect/) |

## Choose a Component Library

In the component library on the right (**Add new component**), the first tab's title is a picker for the library the app is built with, for example **Rocket 2.0**. Click it to switch between:

| <div style={{ width:"180px"}}> Library </div> | <div style={{ width:"420px"}}> What It Is </div> |
|:---------- | :---------- |
| **ToolJet UI 1.0** | ToolJet's built-in components, listed in [Available Components](#available-components). |
| **Rocket 2.0** | A component pack in the style of shadcn/ui: inputs, data tables, charts, forms, layouts and more. |
| **Ant Design** | A component pack built on Ant Design. |
| **Custom libraries** | Libraries published to your workspace through [Custom Component Libraries](/docs/app-builder/custom-component-library/overview). Listed only on plans that include them. |

<img className="screenshot-full img-s" src="/img/app-builder/components/component-library-picker.png" alt="Add new component panel with the library picker open, listing ToolJet UI 1.0, Rocket 2.0 and Ant Design" />

Rocket 2.0 and Ant Design ship with ToolJet, like its built-in components, so they need no setup. A pack's components are grouped into the same sections as the built-in ones, such as **Buttons**, **Data**, **Charts**, **Layouts** and **Text inputs**. Drag one onto the canvas and configure it from the **Properties** panel. Pack components follow the app's theme, including its brand colors, corner radius and font.

- **New apps** start on **Rocket 2.0**. An app created before the picker existed starts on the library most of its components come from.
- **The choice is saved with the app version.** When you ask ToolJet AI or an agent connected through the [ToolJet MCP server](/docs/build-with-ai/mcp/overview) to build the app, it builds with the library you picked. An app on a custom library is built with ToolJet UI 1.0 components.
- **Switching libraries changes what the panel offers.** Components already on the canvas stay as they are, so one app can mix components from different libraries.

If a pack component can't load, for example because its pack isn't installed on the server, the canvas shows the reason in place of the component.
