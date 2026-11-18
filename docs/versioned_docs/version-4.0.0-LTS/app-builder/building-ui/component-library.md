---
id: component-library
title: Component Library
---

Components are the building blocks of ToolJet applications, used to create interactive user interfaces. Components are added from the components panel on the right of the App Builder, from the selected component library.

## Available Component Libraries

ToolJet includes three component libraries. An application can switch libraries later and can use components from more than one library.

<CardGrid columns={3}>
  <CapabilityCard
    title="ToolJet UI 1.0"
    badge="60+ components"
    description="The original ToolJet components, used by existing applications."
    img="/img/app-builder/building-ui/component-library/carrier-directory-tooljet-ui.png"
    features={['Table, Form, Chart, Kanban and more', 'A reference page for every component']}
  />
  <CapabilityCard
    title="Rocket 2.0"
    badge="81 components"
    description="Components in the style of shadcn/ui. New applications use this library by default."
    img="/img/app-builder/building-ui/component-library/carrier-directory-rocket.png"
    href="/docs/component-reference/rocket"
    features={['Data Table, Form, Kanban, Calendar and 11 charts', 'Follows the application theme']}
  />
  <CapabilityCard
    title="Ant Design"
    badge="86 components"
    description="Components built on Ant Design, with the Ant Design visual style."
    img="/img/app-builder/building-ui/component-library/carrier-directory-ant-design.png"
    href="/docs/component-reference/ant-design"
    features={['Table, Tree, Transfer, Drawer and 13 charts', 'Follows the application theme once a theme is applied']}
  />
</CardGrid>


### Switch to Another Library

The library picker sits at the top of the components panel.

<img className="screenshot-full img-m" src="/img/app-builder/building-ui/component-library/library-picker.png" alt="The library picker open at the top of the components panel, listing ToolJet UI 1.0, Rocket 2.0 and Ant Design, with the check mark on Rocket 2.0 and Rocket 2.0 components on the canvas beside it" />

1. Click the name of the current library, for example **Rocket 2.0**.
2. Select **ToolJet UI 1.0**, **Rocket 2.0** or **Ant Design**. A check mark shows the one in use.
3. Drag components from that library onto the canvas. Components already on the canvas stay as they are, so one app can mix libraries.

The selection is saved with the app version. Until a library is selected, a blank page opens on Rocket 2.0, and a page that has only ToolJet UI 1.0 components opens on ToolJet UI 1.0.

[Custom component libraries](../custom-component-library/overview.md) published to the workspace are listed in the same picker under Custom libraries.

<details id="tj-dropdown">

<summary>**If a Component Doesn't Load**</summary>

If a Rocket 2.0 or Ant Design component fails to load, ToolJet tries again twice on its own. If it still can't load, the canvas shows "This component couldn't load." in its place, with a **Retry** button. Components placed inside it stay on the canvas, and one **Retry** reloads every component from that library.

</details>

## Add Components to the Canvas

Components can be added to the canvas by dragging and dropping them onto the canvas at your desired location.

<img className="screenshot-full img-full" src="/img/app-builder/components/component-library.png" alt="App Builder: Component library"/>
