---
id: component-library
title: Component Library
---

Components are the building blocks of ToolJet applications, used to create interactive user interfaces. You add them from the components panel on the right of the app builder, and you choose which component library they come from.

## Choose a Component Library

<SectionSubtitle text="Three libraries ship with ToolJet on every edition. Pick one, switch later, or mix them in one app." />

<CardGrid columns={3}>
  <CapabilityCard
    title="ToolJet UI 1.0"
    badge="60+ components"
    description="ToolJet's original components, the ones your existing apps use."
    features={['Table, Form, Chart, Kanban and more', 'A reference page for every component']}
  />
  <CapabilityCard
    title="Rocket 2.0"
    badge="81 components"
    description="Components in the style of shadcn/ui. New apps start here."
    features={['Data Table, Form, Kanban, Calendar and 11 charts', 'Always follows your app theme']}
  />
  <CapabilityCard
    title="Ant Design"
    badge="86 components"
    description="Components built on Ant Design, with its own look."
    features={['Table, Tree, Transfer, Drawer and 13 charts', 'Follows your app theme once you apply one']}
  />
</CardGrid>

<!-- TODO screenshot: /img/app-builder/building-ui/component-library/carrier-directory-tooljet-ui.png | card img prop (ToolJet UI 1.0 card) | alt: The Carrier Directory screen built with ToolJet UI 1.0 components | shows: the Carrier Directory page (toolbar with search, Mode select, toggle and Add carrier; eight-row table; details form) built in ToolJet UI 1.0, same 1100x620 crop as the other two cards -->
<!-- TODO screenshot: /img/app-builder/building-ui/component-library/carrier-directory-rocket.png | card img prop (Rocket 2.0 card) | alt: The Carrier Directory screen built with Rocket 2.0 components | shows: the same Carrier Directory page built in Rocket 2.0, same 1100x620 crop -->
<!-- TODO screenshot: /img/app-builder/building-ui/component-library/carrier-directory-ant-design.png | card img prop (Ant Design card) | alt: The Carrier Directory screen built with Ant Design components | shows: the same Carrier Directory page built in Ant Design, same 1100x620 crop -->

### Switch to Another Library

The library picker sits at the top of the components panel.

<!-- TODO screenshot: /img/app-builder/building-ui/component-library/library-picker.png | img-full | alt: The library picker open at the top of the components panel, listing ToolJet UI 1.0, Rocket 2.0 and Ant Design, with Rocket 2.0 components on the canvas beside it | shows: Carrier Directory in the app builder on Rocket 2.0 with the picker open and the check mark on Rocket 2.0; crop the canvas edge plus the panel; the list must show only the three libraries that ship (no Material UI) -->

1. Click the name of the current library, for example **Rocket 2.0**.
2. Select **ToolJet UI 1.0**, **Rocket 2.0** or **Ant Design**. A check mark shows the one in use.
3. Drag components from that library onto the canvas. Components already on the canvas stay as they are, so one app can mix libraries.

Your choice is saved with the app version. Until you choose, a blank page opens on Rocket 2.0, and a page that has only ToolJet UI 1.0 components opens on ToolJet UI 1.0.

[Custom component libraries](../custom-component-library/overview.md) published to your workspace are listed in the same picker under Custom libraries, on plans that include them.

<details id="tj-dropdown">

<summary>**If a Component Doesn't Load**</summary>

If a Rocket 2.0 or Ant Design component fails to load, ToolJet tries again twice on its own. If it still can't load, the canvas shows "This component couldn't load." in its place, with a **Retry** button. Components placed inside it stay on the canvas, and one **Retry** reloads every component from that library.

</details>

## Add Components to the Canvas

Components can be added to the canvas by dragging and dropping them onto the canvas at your desired location.

<img className="screenshot-full img-full" src="/img/app-builder/components/component-library.png" alt="App Builder: Component library"/>

## Available Components

ToolJet UI 1.0 includes the following components.

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
