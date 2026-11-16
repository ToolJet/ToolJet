---
id: overview
title: React Builder
sidebar_label: Overview
hide_title: true
---

<DocHero
  eyebrow="New in ToolJet v4"
  title="React Builder"
  description="Build internal tools as real React and TypeScript apps, without managing any infrastructure. Generate the app with ToolJet AI, edit the code in your browser, or work in your own editor with a coding agent. ToolJet takes care of sign-in, permissions, data sources, environments and releases."
  chips={['React + TypeScript', 'ToolJet AI', 'VS Code and Cursor', 'Claude Code and Codex', 'Security checks']}
/>

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/overview/hero.png" alt="A React Builder app in the editor: a freight control tower on the canvas, with the React code of that screen open beside it" />

## Three Ways to Build

<SectionSubtitle text="Mix them freely. Every change lands in the same app, with the same history." />

<CardGrid columns={3}>
  <ConfigCard
    label="Prompt"
    title="Describe it to ToolJet AI"
    description="Say what you need. ToolJet plans the app, writes the React code and shows the result on the canvas."
    features={['Start from a prompt on the dashboard', 'Answer a few questions, then watch it build', 'See what each edit changed']}
    href="/docs/build-with-ai/react-builder/create-app"
  />
  <ConfigCard
    label="Browser"
    labelBg="#dcfce7"
    labelColor="#166534"
    title="Edit the code in ToolJet"
    description="Open any file in the built-in Code panel, or click an element and restyle it without writing code."
    features={['Every save updates the canvas', 'The style inspector writes the change for you', 'Preview phone, tablet and desktop widths']}
    href="/docs/build-with-ai/react-builder/editor"
  />
  <ConfigCard
    label="Local"
    labelBg="#fef3c7"
    labelColor="#92400e"
    title="Use your editor and coding agent"
    description="Clone the app with the ToolJet CLI. Work in VS Code or Cursor, or let Claude Code or Codex build it."
    features={['Your saves appear live in ToolJet', 'Typed hooks for every query', 'Instructions for your agent, written by the CLI']}
    href="/docs/build-with-ai/react-builder/local-development"
  />
</CardGrid>

## What ToolJet Handles for You

<SectionSubtitle text="You write the screens. The platform does the rest." />

<CardGrid min={220}>
  <FeatureCard
    icon="🗄️"
    title="Data through queries"
    description="Your code calls ToolJet queries by name. Database passwords and API keys stay on the server."
  />
  <FeatureCard
    icon="🔐"
    title="Sign-in and access"
    description="Users sign in with your workspace login or SSO. You choose who can open each screen and run each query."
    href="/docs/build-with-ai/react-builder/access-control"
  />
  <FeatureCard
    icon="🛡️"
    title="Security checks"
    description="Every version's code and packages are checked. A version that fails your workspace's policy is blocked from release."
    href="/docs/build-with-ai/react-builder/security"
  />
  <FeatureCard
    icon="🔍"
    title="Visual diff and reviews"
    description="Compare two versions screen by screen and file by file, then ask a teammate to approve the release."
    href="/docs/development-lifecycle/release/compare-versions"
  />
  <FeatureCard
    icon="🕘"
    title="History and undo"
    description="Every AI edit, save and upload is recorded. Go back to any earlier point."
    href="/docs/build-with-ai/react-builder/versions-and-history"
  />
  <FeatureCard
    icon="🚀"
    title="Environments and GitSync"
    description="Promote versions from development to production, and keep the code in your Git repository."
    href="/docs/build-with-ai/react-builder/versions-and-history"
  />
</CardGrid>

## A Screen Is Plain React

A screen is a React component. It reads data by running one of the app's queries by name.

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

The CLI generates `useAppQuery` from your app's queries, so the query name and its rows are typed.

## React Builder or Visual Mode?

You choose a build mode when you create an app, and the app keeps it. Both modes share the same data sources, queries, permissions and release flow.

| <div style={{ width:"120px"}}> </div> | <div style={{ width:"260px"}}> Visual Mode </div> | <div style={{ width:"260px"}}> React Builder </div> |
|:---------- | :---------- | :---------- |
| You build by | Dragging components onto a canvas and setting their properties | Writing React components, or asking the AI to write them |
| Best for | Most internal tools: tables, forms and dashboards | Interfaces that need their own layout, interactions or styling |
| You edit in | The visual App Builder | The Code panel, the style inspector, or your own editor |
| Before release | The standard release flow | The same flow, plus a security check of the code and its packages |

## From Prompt to Production

<CardGrid columns={3}>
  <FlowStep number="1" title="Create" description="Pick React Builder when you create the app, or start from a prompt." href="/docs/build-with-ai/react-builder/create-app" />
  <FlowStep number="2" title="Build" description="Use the AI chat, the Code panel or your own editor. Each save shows on the canvas." href="/docs/build-with-ai/react-builder/editor" />
  <FlowStep number="3" title="Set access" description="Choose who can open each screen and who can run each query." href="/docs/build-with-ai/react-builder/access-control" />
  <FlowStep number="4" title="Save a version" description="ToolJet builds the code, checks it and keeps that build with the version." href="/docs/build-with-ai/react-builder/versions-and-history" />
  <FlowStep number="5" title="Review and release" description="Compare it with what is live, get approval, then release and promote." href="/docs/development-lifecycle/release/compare-versions" />
</CardGrid>

## Where to Go Next

<CardGrid min={190}>
  <NextStepCard title="Create an App" description="Start from a prompt or a blank app." href="/docs/build-with-ai/react-builder/create-app" />
  <NextStepCard title="Edit in the Browser" description="The Code panel and the style inspector." href="/docs/build-with-ai/react-builder/editor" />
  <NextStepCard title="Build Locally" description="Your editor, the CLI and coding agents." href="/docs/build-with-ai/react-builder/local-development" />
  <NextStepCard title="App Security" description="What is checked, and how the release gate works." href="/docs/build-with-ai/react-builder/security" />
</CardGrid>

:::info Availability
React Builder is available on ToolJet Cloud and on self-hosted Enterprise Edition. The Community Edition doesn't include it.
:::
