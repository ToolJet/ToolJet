---
id: sharing-apps
title: Preview, Test and Share Apps 
---

 ToolJet's App-Builder provides critical tools for app preview, development and deployment. Let's take a look at how you can use it throughout the development process.

## Preview
You can use Preview to ensure the app functions correctly on both mobile and desktop platforms.

- Open the ToolJet App-Builder and navigate to your app.
- Click the `Preview` icon located at the top-right corner to enter preview mode.
- Use the **Mobile** and **Desktop** view options to toggle between different screen settings.
- Observe component behavior and layout differences across devices.
- Adjust component visibility using the `Show on mobile` and `Show on desktop` options under the component's Properties Panel.

## Multi-Environment Testing
Simulate app behavior in various stages of the development lifecycle (Development, Staging, Production).

**Steps**:
1. Select the desired environment from the Env dropdown menu in the top-bar.
2. Make necessary changes and use the Version Manager to handle different versions.
3. Preview the app to ensure it behaves as expected in the chosen environment.

## Share

### Releasing App
To release an app to the users, you need to promote it to `Production` environment. Once you are in `Production`, the `Promote` button will have the `Release` label. Once you click on `Release` and confirm, the application will be released.

### Making App Public
You can share the application with external users via a user-friendly, accessible URL.

- Click the `Share` button on the top-bar.
- In the Share modal, toggle on `Make application public` to allow access without a ToolJet login.
- Edit the default URL slug to a more memorable and relevant one for easier access.
- Copy the newly customized URL and distribute it to your intended audience.

This provides external users easy and direct access to the application, enhancing reach and usability.

<!-- ## Embedding the App into a Website

**Objective**: Integrate the ToolJet app within an existing web application to provide seamless user interaction.

**Steps**:
1. Ensure the app is set to public or set `ENABLE_PRIVATE_APP_EMBED` to `true` in the `.env` file for private apps.
2. Navigate to the Share modal and copy the embeddable link.
3. Paste the embed link into the `iframe` tag of your website's HTML code.

**Benefit**: Users can interact with the ToolJet app directly from your website, improving the user experience and retaining user engagement. -->


### Efficient Development with Gitsync

Gitsync can be used to maintain application version control and facilitate collaborative development.

- Click on the `Gitsync` icon in the top-bar.
- Follow the prompts to connect your ToolJet app with a GitHub repository.
- Utilize git operations to manage app development across different branches and versions.

Read more about Gitsync **[here](/docs/gitsync)**.