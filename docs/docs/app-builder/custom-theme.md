---
id: custom-theme
title: App Themes
---

export const Swatch = ({ color }) => <svg viewBox="0 0 28 28"><rect x="1" y="1" width="26" height="26" rx="7" fill={color} stroke="currentColor" strokeOpacity="0.4" /></svg>;

ToolJet supports App Themes giving teams complete control over the look and feel of their applications. With this feature, you can define and manage multiple themes and apply them across your apps in a consistent and reusable way.

Each workspace can have one or more themes configured, and any application within that workspace can use any of the defined themes. This helps in maintaining visual consistency across applications, improves brand alignment, and enhances user experience.

## Built-in Themes

Every workspace comes with seven ready-made themes next to the default **ToolJet** theme, so you can give an app a new look without designing a theme first.

<CardGrid min={150}>
  <FeatureCard icon={<Swatch color="#4368E3" />} title="ToolJet" badge="Default" description="ToolJet's own blue. Primary #4368E3." />
  <FeatureCard icon={<Swatch color="#111827" />} title="ToolJet Ink" description="Cool near-black. Primary #111827." />
  <FeatureCard icon={<Swatch color="#334155" />} title="ToolJet Slate" description="Slate gray. Primary #334155." />
  <FeatureCard icon={<Swatch color="#1E3A8A" />} title="ToolJet Navy" description="Navy blue. Primary #1E3A8A." />
  <FeatureCard icon={<Swatch color="#4F46E5" />} title="ToolJet Indigo" description="Indigo. Primary #4F46E5." />
  <FeatureCard icon={<Swatch color="#047857" />} title="ToolJet Emerald" description="Emerald green. Primary #047857." />
  <FeatureCard icon={<Swatch color="#292524" />} title="ToolJet Graphite" description="Warm near-black, on a stone canvas. Primary #292524." />
  <FeatureCard icon={<Swatch color="#BE123C" />} title="ToolJet Rose" description="Rose red. Primary #BE123C." />
</CardGrid>

Each one changes the primary color, the app background and the surfaces, in light and dark mode. Fonts, corner radius and status colors stay the same as in the default theme.

<!-- TODO screenshot: /img/app-builder/custom-theme/built-in-themes-two-up.png | img-full | alt: The same app page in two built-in themes, ToolJet Navy on the left and ToolJet Emerald on the right, with buttons, links and backgrounds following each theme | shows: the Carrier Directory page of the visual showcase app captured at one crop with ToolJet Navy applied and again with ToolJet Emerald applied, joined side by side in one image -->

### Apply a Built-in Theme

1. Open the app and click the **Settings** icon in the left sidebar to open **Global settings**.
2. Under **Canvas styles**, open the **Theme** dropdown. Each theme has a swatch of its primary color.
3. Select a theme, for example **ToolJet Navy**.

<!-- TODO screenshot: /img/app-builder/custom-theme/theme-dropdown-built-in.png | img-m | alt: The Theme dropdown in Global settings listing ToolJet and the seven built-in themes, each with a swatch of its primary color | shows: Carrier Directory in the App Builder with Global settings open, Canvas styles expanded and the Theme dropdown open, eight themes with swatches and the Default pill on ToolJet -->

Components that [take their colors from the theme](#3-use-theme-styles-in-your-components) switch to the new palette. To start every new app on a built-in theme, make it the workspace default under [Manage Themes](#manage-themes).

:::info Availability
Every plan on ToolJet Cloud and self-hosted Enterprise Edition can apply the built-in themes and set one as the workspace default. Editing, renaming or deleting them, and creating your own themes, needs a plan that includes custom themes. Community Edition doesn't have the **Theme** dropdown or the **Themes** page.
:::

## Why Use App Themes?

App Themes empower your organization by:

- **Brand consistency**: Align your internal tools with your company’s visual identity.
- **Reusability**: Define once, use across multiple apps.
- **Customization**: Update the look of all your apps in one go by editing the theme.
- **Collaboration**: Teams working on different apps can maintain a unified design system.

This is especially useful for teams with apps across different environments (e.g., internal tools, client-facing apps, admin panels) where each might need a slightly different yet consistent visual identity.

## How to Use App Themes

An App Theme allows you to customize the UI components of your ToolJet apps by configuring a set of visual styles such as:

- Brand Colors (Primary, Secondary, Tertiary)
- Text colors
- Border and surface styling
- System state colors (e.g., error, success)

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme-config.png" alt="Configure custom theme" />

You can configure these settings for both light and dark modes, and instantly preview changes using the built-in preview panel.

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme.png" alt="Configure custom theme" />

<br/><br/>

Using your own theme in ToolJet involves two simple steps — **creating the theme** and **applying it to your applications**.

### 1. Create an App Theme

<PlanBadge type="team" />

Role Required: **Admin/Builder**

- Go to your **Workspace Settings**.
- Click on the **Themes** tab.
- Click **Create new theme**.
- Enter a name for the theme. The name must be 5 to 100 characters, must be unique in the workspace, and can't be `ToolJet`.
- Configure your theme styles in each tab. Each color has a **Light** and a **Dark** value, and starts from the default ToolJet theme:

  | Tab | Colors |
  |:--- |:------ |
  | **Brand** | **Primary**, **Secondary (Optional)**, **Tertiary (Optional)** |
  | **Text** | **Primary**, **Placeholder** |
  | **Border** | **Default**, **Weak** |
  | **System status** | **Success**, **Error**, **Warning** |
  | **Surface** | **App background**, **Surface 1**, **Surface 2**, **Surface 3** |

- Use the **Light** and **Dark** toggle in the **Preview** panel to check how the theme looks in each mode.
- Click **Save** once you're done, or click **Discard** to reset your changes.<br/>

You can create multiple themes as per your needs — for different teams, environments, or clients.

:::info
Custom themes are a paid feature. On plans without this feature, **Create new theme** is disabled and your own themes are listed but disabled: an app set to one of them shows the **ToolJet** theme's colors. The [built-in themes](#built-in-themes) stay available.
:::

### Manage Themes

The **Themes** tab lists every theme in the workspace. The workspace default theme has a **Default** tag. Select a theme to preview it, then use these actions:

- **Set as default**: Makes the theme the default for all new applications created in the workspace.
- **Edit**: Click the edit icon next to **Set as default** to change the theme's name or colors.
- **Rename Theme**: Available from the theme's menu in the list.
- **Delete Theme**: Available from the theme's menu in the list, or from the delete icon in the theme's header.

The **ToolJet** theme can't be edited, renamed, or deleted, but you can set it back as the default. The seven [built-in themes](#built-in-themes) are read-only unless your plan includes custom themes.

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/themes-tab.png" alt="Themes tab in workspace settings with a custom theme selected" />

### 2. Apply the Theme to Your Application

Role Required: **Admin/Builder**

- Open the app where you want to use the theme.
- Click the **Settings** icon in the **left sidebar** to open **Global settings**.
- In the **Canvas Styles** section, find the **Theme** dropdown. It shows the currently selected theme, and the workspace's default theme is marked **Default**.
- Click the dropdown to view and select from all your configured themes. To create a new one, click **Create a new theme** at the bottom of the dropdown. This opens the workspace theme settings in a new tab. <br/>
  <img  className="screenshot-full img-m" src="/img/app-builder/custom-theme/select-theme.png" alt="Configure custom theme" />

Once selected, your app will now use the chosen theme as the base style for components.

### 3. Use Theme Styles in Your Components

To make your components adopt the theme styles:

- Select a component in the app canvas.
- Go to the **Style** tab of the component.
- Wherever color can be set (background, border, text), you’ll see a **Theme** option next to the color picker. Once selected you'll see the list of theme colors such as Brand/Primary, Brand/Secondary, Text/Primary, etc.

These options map directly to what you configured during theme setup.

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/choose-theme-color.png" alt="Configure custom theme" />

Once components are styled using theme options, changing the theme from Global Settings will instantly update all those components, making your app visually consistent and easy to update.

:::info Themes from templates
When you create an app from a template, ToolJet adds the template's theme to your workspace and applies it to the app. Template themes are named after their color palette, for example **Slate and silver**. If your workspace already has a theme with that name, the app uses the existing theme. On plans without App Themes, no theme is added. The app keeps the **ToolJet** theme, and the template's light-mode colors are applied to its components directly.
:::

## Scenarios

Here are some scenarios where app themes shine:

- **Brand-specific apps**: Create different themes for different brands/clients your company serves.
- **Dark & light mode toggle**: Provide a seamless visual switch for end-users between light and dark modes.
- **Multi-team organizations**: Let each team within your org create and maintain their own theme without affecting others.

## Example

Here’s an example showing how an application interface looks before and after applying an app theme.

### Before (Default Theme)

This is the default ToolJet UI without any app theme applied. It uses the standard branding and neutral colors.
<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/default-theme-app-v1.png" alt="Configure custom theme" />

### After (App Theme Applied)

<img className="screenshot-full img-full" src="/img/app-builder/custom-theme/custom-theme-app-v1.png" alt="Configure custom theme" />

This is the same application after applying the "Coral" app theme. Notice the button color, primary accents, and overall visual alignment now reflect the chosen palette.

By simply configuring a theme once at the workspace level, you can instantly apply a fresh look across all apps, improving usability, clarity, and brand identity.
