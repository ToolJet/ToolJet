---
id: component-library
title: Component Library
---

Components are the building blocks of ToolJet applications, used to create interactive user interfaces. You add them from the components panel on the right of the app builder, and you choose which component library they come from.

## Available Component Libraries

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
