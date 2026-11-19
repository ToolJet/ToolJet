---
id: overview
title: React Builder
sidebar_label: Overview
hide_title: true
---

<DocHero
  title="React Builder"
  description="React Builder creates ToolJet applications as React and TypeScript projects. The code can be generated with ToolJet AI, edited in the browser, or developed locally with the ToolJet CLI. ToolJet hosts the application and provides authentication, access control, queries, environments and releases."
/>

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/overview/hero.png" alt="A React Builder app in the editor: a freight control tower on the canvas, with the React code of that screen open beside it" />

## Ways to Build an Application

A React Builder application can be built in three ways. All three change the same application and are recorded in the same version history, so they can be combined.

<CardGrid columns={3}>
  <ConfigCard
    label="Prompt"
    title="Generate With ToolJet AI"
    description="ToolJet AI plans the application, writes the React code and renders the result on the canvas."
    features={['Start from a prompt on the dashboard', 'Answer clarifying questions during the build', 'Review the changes made by each edit']}
    href="/docs/app-builder/react-builder/create-app"
  />
  <ConfigCard
    label="Browser"
    labelBg="#dcfce7"
    labelColor="#166534"
    title="Edit in the Code Panel"
    description="Files are edited in the Code panel inside ToolJet. The style inspector changes the styling of a selected element and writes the matching code."
    features={['The canvas updates on each save', 'Styling changes without manual code edits', 'Preview at phone, tablet and desktop widths']}
    href="/docs/app-builder/react-builder/editor"
  />
  <ConfigCard
    label="Local"
    labelBg="#fef3c7"
    labelColor="#92400e"
    title="Develop Locally"
    description="The ToolJet CLI clones the application to a local folder for development in any code editor or with a coding agent."
    features={['Local saves sync to ToolJet', 'Typed hooks are generated for each query', 'The CLI writes instructions for coding agents']}
    href="/docs/app-builder/react-builder/local-development"
  />
</CardGrid>

## Platform Services

ToolJet provides the following services to every React Builder application, so the application code doesn't implement them.

<CardGrid min={220}>
  <FeatureCard
    icon="database"
    title="Queries"
    description="Application code runs ToolJet queries by name. Datasource credentials stay on the ToolJet server."
  />
  <FeatureCard
    icon="key"
    title="Authentication and Access Control"
    description="Users sign in with the workspace's login methods, including SSO. Access can be restricted for each screen and each query."
    href="/docs/app-builder/react-builder/access-control"
  />
  <FeatureCard
    icon="shield-check"
    title="Security Checks"
    description="The code and packages of each version are checked. A version that fails the workspace's scan policy can't be released."
    href="/docs/app-builder/react-builder/security"
  />
  <FeatureCard
    icon="git-compare"
    title="Version Comparison and Reviews"
    description="Two versions can be compared screen by screen and file by file, and a version can be sent for review before release."
    href="/docs/development-lifecycle/release/compare-versions"
  />
  <FeatureCard
    icon="history"
    title="App History"
    description="AI edits, saves and uploads are recorded in App history, and recent changes can be undone."
    href="/docs/app-builder/react-builder/versions-and-history#history-and-undo"
  />
  <FeatureCard
    icon="git-branch"
    title="Environments and GitSync"
    description="Versions are promoted from development to production. With GitSync, the application code is committed to a Git repository."
    href="/docs/development-lifecycle/overview"
  />
</CardGrid>

## Screen Structure

Each screen is a React component. A screen reads data by running one of the application's queries by name.

```tsx
import { useAppQuery } from '../tooljet.gen';

export const Shipments = () => {
  const shipments = useAppQuery('listShipments');
  if (shipments.loading) return <p>Loading shipments…</p>;
  return (
    <ul>
      {shipments.data?.map((s) => <li key={s.id}>{s.reference}: {s.status}</li>)}
    </ul>
  );
};
```

The CLI generates `useAppQuery` in `tooljet.gen.ts` from the application's queries, so query names and result rows are typed.

## React Builder and Visual Mode

The build mode is selected when an application is created and can't be changed afterwards. Both modes use the same datasources, queries, permissions and release process.

| <div style={{ width:"120px"}}> </div> | <div style={{ width:"260px"}}> Visual Mode </div> | <div style={{ width:"260px"}}> React Builder </div> |
|:---------- | :---------- | :---------- |
| Building method | Components are dragged onto a canvas and configured in the properties panel | React components are written in code or generated by ToolJet AI |
| Typical use | Most internal tools, such as tables, forms and dashboards | Interfaces that need a custom layout, interactions or styling |
| Editing | The visual App Builder | The Code panel, the style inspector or a local code editor |
| Release | The standard release process | The standard release process, plus a security check of the code and its packages |

## Next Steps

<CardGrid min={190}>
  <NextStepCard title="Create an App" description="Create an application from a prompt or from a blank app." href="/docs/app-builder/react-builder/create-app" />
  <NextStepCard title="Edit in the Browser" description="Use the Code panel and the style inspector." href="/docs/app-builder/react-builder/editor" />
  <NextStepCard title="Build Locally" description="Develop with the ToolJet CLI, a code editor or a coding agent." href="/docs/app-builder/react-builder/local-development" />
  <NextStepCard title="App Security" description="Learn what is checked and how the release gate works." href="/docs/app-builder/react-builder/security" />
</CardGrid>
