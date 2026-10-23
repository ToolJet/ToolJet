---
id: generate-applications
title: App Generation
---

This guide explains how to generate and modify applications and modules with ToolJet AI, using nothing but a prompt.

:::info
This page covers **Start with a prompt**, the AI built into ToolJet. To build the same apps from Claude Code, Codex, or another coding agent, see [ToolJet MCP](/docs/build-with-ai/mcp/app-generation) instead.
:::

## Creating Application

Enter a prompt on the home page describing the business application you want to build, and ToolJet generates it for you. There are no intermediate steps to confirm; the app is built directly from your prompt.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/prompt-v2.png" alt="tooljet generate apps" />

Once generation finishes, you are taken to the App Builder with a fully functional app: UI components, queries, and data bindings are already configured, and you can customize anything from there.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/app-v2.png" alt="tooljet generate apps" />

## Modifying Application

You can modify any application in ToolJet with AI assistance, whether it's a newly created app or an existing one. You can update components and queries within your application with just a prompt.

<img className="screenshot-full img-full" src="/img/tooljet-ai/generate-app/modify.png" alt="tooljet generate apps" />

To change one specific component or query rather than letting the AI infer the target, [@mention it in the chat](/docs/build-with-ai/referencing-app-resources).

## Creating Modules

ToolJet AI can be used to quickly generate Modules, which can then be reused across multiple applications. To generate a module using ToolJet AI, open the Module Builder and enter your prompt describing the UI you want to create.

<img className="screenshot-full img-full" src="/img/tooljet-ai/modules/generate.png" alt="tooljet generate modules" />

<!-- TODO verify: "Creating Application" says "There are no intermediate steps to confirm", but the AI can pause a build to ask for input (for example, to confirm a data source or a missing connection). See "Build Notifications" below. -->

## Stopping a Build

While ToolJet AI is building or modifying your app in the App Builder chat, the send button turns into a **Stop build** button. Click it to stop the build. The button shows **Stopping build** until the build has stopped.

<!-- TODO screenshot: App Builder AI chat during a running build, with the Stop build button in the composer -->

Stopping a build doesn't undo it. Any changes the AI already saved to your app are kept. Tools the AI is already running get up to 30 seconds to finish before the build is stopped. When the build stops, the chat shows one of these messages:

| Message | What it means |
|---------|---------------|
| **Build cancelled. Changes already saved are kept.** | The build stopped normally. |
| **Build stopped after waiting for active tools. Changes already saved are kept. An in-flight operation may still finish; review the app before continuing.** | A running tool didn't finish in time. Check the app before you send the next prompt. |
| **The previous build is still stopping. Please try again shortly.** | An earlier build is still shutting down. Wait a moment, then send your prompt again. |

If the stop request fails, you see **Could not stop the build. Please try again.**

## Leaving or Refreshing During a Build

A build runs on the server, not in your browser tab. If you refresh the page, lose your connection, or close and reopen the app, the build keeps running. When you open the app's AI chat again, it reconnects to the running build: the chat shows the build's progress, the elapsed time continues from when the build started, and you can still stop it. When the build finishes, the editor reloads the app with the changes.

While a build runs, the editor shows **Agent is building your app** and **Please don't refresh or make edits until it finishes.** The canvas, the properties panel, and the query panel are locked. The left sidebar stays available, so you can still use the chat, the debugger, and version history. Avoid refreshing when you can: ToolJet recovers the build, but the browser asks you to confirm before it leaves the page.

<!-- TODO verify: the maximum time a single build can run before it times out (the server's run limit is 2 hours; PR #17868 mentions a 50-minute socket timeout). -->

## Build Notifications

ToolJet can let you know when a build finishes, so you can step away during long builds.

### Allowing Notifications

To get browser notifications, allow ToolJet to send them. You can do this in two places:
- Click the bell icon in the AI chat header (tooltip: **Get notified when ToolJet responds to requests which take time**). In the **Allow ToolJet to send notifications** dialog, click **Allow notifications**. The bell is only shown until you allow or block notifications in your browser.
- When a build has been running for about 10 seconds, the chat asks **This will take a couple moments, want a notification when it's done?** Click **Allow notifications**. This prompt appears at most once per browser session and stops appearing after you dismiss it twice.

<!-- TODO screenshot: the "Allow ToolJet to send notifications" dialog opened from the bell icon in the AI chat header -->

### When You Are Notified

You are only notified when a build ends while you are away from the ToolJet tab, for example when the tab is in the background. If the tab is open and focused, the chat already shows the result. ToolJet plays a short chime when a build ends while you're away. If you allowed notifications, it also shows a browser notification. Clicking the notification takes you back to the app's tab.

| When | Notification | Button |
|------|--------------|--------|
| A new app finished building | **Your app is ready**: ToolJet has finished building. View the output. | **View output** |
| Changes to an existing app finished | **Changes applied**: ToolJet has finished your updates. View the output. | **View output** |
| Most of the app was built, but one part couldn't be finished | **Your app is partly ready**: ToolJet built most of your app but couldn't finish one part. View it and tell ToolJet what to adjust. | **View output** |
| The build failed | **Build failed**: ToolJet ran into a problem and couldn't finish. View details to see what happened and retry. | **View details** |
| The AI paused and needs your answer | **ToolJet needs your input**: ToolJet has paused and is waiting on your answer to continue. | **Respond** |
| A query transformation was written | **Transformation ready**: ToolJet has written the transformation for your query. View the output. | **View output** |

You aren't notified when you stop a build yourself, or when a message only asks a question and doesn't change the app.

### Turning Notifications Off

Build notifications are on by default. To turn them off, go to **Profile settings** → **Notifications** and switch off **AI build notifications**. This setting applies to your account.

If your browser blocks notifications from ToolJet, the card shows **ToolJet notifications are blocked in your browser**. To unblock them, click the lock icon in your browser's address bar and set **Notifications** to **Allow**.

<img className="screenshot-full img-l" src="/img/tooljet-ai/generate-app/ai-build-notifications.png" alt="Notifications card in Profile settings with the AI build notifications toggle turned on" />

### Build-Completion Email

When ToolJet AI finishes building a new app, it also emails you a link to the app with the subject **Your ToolJet app is ready!** The email is sent once per app, only when the build completes successfully. It isn't sent for failed, partly built, or stopped builds, when the AI is waiting for your input, or for modules. The **AI build notifications** setting doesn't affect this email. The email requires [SMTP](/docs/setup/configuration/env-vars#smtp-configuration) to be configured on self-hosted deployments. With white labelling, the subject uses your product name instead of ToolJet.

## App Versions

ToolJet AI works on the app version you have open in the editor. Before you send a prompt, switch to the version you want the AI to change. The AI edits that version, not the app's default editing version.

You can also ask the AI to manage versions for you. The AI only does this when you ask:
- **Create a version**: The AI creates a new draft version by copying an existing one, then switches the editor to it. Version names must be unique within the app and 1–25 characters long.
- **Switch versions**: The AI opens another existing version in the editor. Switching doesn't release anything.
- **Release a version**: The AI releases a specific version only if you explicitly ask it to release or publish the app. If your workspace uses environments, the version is promoted one environment at a time until it reaches production.

When a build switches to a different version or environment, the editor follows it automatically. If the editor can't open the version, you see **The app changed, but version `<version name>` could not be opened.** Open that version from the version manager.

<!-- TODO verify: how the AI names versions it creates when you don't give it a name -->

## Related

- [Query Generation](/docs/build-with-ai/generate-queries) — generate queries, code, and organize your query panel
- [@mention in AI Chat](/docs/build-with-ai/referencing-app-resources) — target an exact component or query
- [Understanding AI Credits](/docs/build-with-ai/ai-credits) — how much an operation costs
