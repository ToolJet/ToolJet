---
id: overview
title: Branding & Customization
---

ToolJet gives you control over how the platform looks, feels, and is delivered to your end-users. Whether you want ToolJet to be indistinguishable from your own product, or you just want your internal tools to follow your company's design language, there are several independent layers of customization you can combine:

- **Custom Domain** - control the URL your team and users see.
- **White Labeling** - control the platform's branding elements (logo, favicon, title, login page).
- **App Themes** - control the design system (colors, tokens) that your apps are built with.
- **Custom Styles** - control the fine-grained CSS of individual components, beyond what themes expose.

## Custom Domain

A [custom domain](/docs/tj-setup/org-branding/custom-domain) lets you access ToolJet through your own URL (e.g., `tools.yourcompany.com`) instead of the default ToolJet URL. This is usually the first step in branding a deployment, since every other customization - white labeling, themes, custom styles - is still served from whatever domain you configure here.

- **Self-hosted**: configured by setting the `TOOLJET_HOST` environment variable to your domain and restarting the deployment. This requires a registered domain and a DNS record pointing to your ToolJet server.
- **ToolJet Cloud** (Team plan and above): configured per workspace, so different workspaces (e.g., Finance, Operations) can each have their own domain. This involves creating a CNAME record pointing to `app.tooljet.com`, then adding the domain under **Settings > Custom Domain** in the workspace.

:::info
Because authentication flows depend on the application URL, updating a custom domain on ToolJet Cloud means you also need to update the redirect/callback URLs in any SSO providers (Okta, Azure AD, Google OAuth, etc.) to include the new domain — otherwise users will hit authentication errors on login.
:::

## White Labeling

[White Labeling](/docs/tj-setup/org-branding/white-labeling) replaces ToolJet's own branding elements with yours, so the platform itself, not just the apps built on it, appears to be your product. It covers:

- **Application logo** - shown on the login screen, dashboard, app editor, and deployed apps.
- **Page title** - the browser tab title.
- **Favicon** - the browser tab icon.
- **Login page image** - the image shown alongside the login form.

Configuration lives under **Settings > White Labelling**, and where it applies depends on the deployment model: for **self-hosted** instances it's set at the instance level (applies to everyone on that instance), while on **cloud** it's set at the workspace level (applies only within that workspace).

:::info
If your license or subscription expires, white labeling automatically reverts to ToolJet's default branding until it's renewed.
:::

## App Themes

While white labeling changes ToolJet's own branding elements, [App Themes](/docs/app-builder/custom-theme) change the design system your **built apps** use. A theme is a reusable set of design tokens — brand colors (primary / secondary / tertiary), text colors, border and surface styling, and system state colors (error, success) — defined once per workspace and configured separately for light and dark mode.

Themes work in two steps:

1. **Create a theme** under **Workspace Settings > Theme**, defining the color tokens above for light and dark mode, with a live preview.
2. **Apply the theme** to an app from its **Global Settings**, then style individual components by picking a theme token (e.g., `Brand/Primary`, `Text/Primary`) instead of a hardcoded color in the component's **Style** tab.

Because components reference theme tokens rather than fixed colors, changing the theme later updates every component that uses it, across every app in the workspace, in one go. This makes App Themes the right tool when you want brand-consistent, maintainable styling across many apps (e.g., a distinct theme per client, or a light/dark toggle for end-users), rather than one-off visual tweaks.

## Custom Styles

[Custom Styles](/docs/app-builder/customstyles) let you apply raw CSS to override the default styles of components - for cases a theme's design tokens don't cover. It's configured from **Workspace Settings > Custom Styles** and works by targeting a component's generated class name, which follows the pattern `._tooljet-<component-name>`:

```css
._tooljet-Button button {
    font-family: 'Georgia', serif !important;
}
```

Custom Styles can be applied globally or per component:

- **Globally**, by targeting a component type's default class (e.g., `._tooljet-Button`) to restyle every instance of that component across apps.
- **Per component**, by targeting the specific name given to a component instance in an app (e.g., `._tooljet-addIncomeButton`) to restyle just that one.

You can also target a component directly, without relying on its auto-generated class: most components expose a **CSS class** field (in their **Style** tab) where you can add one or more custom class names to that specific instance, then reference those class names from the Custom Styles page.

Use the browser inspector to find the exact sub-class or HTML tag to target. Think of Custom Styles as the escape hatch below App Themes: themes give you a consistent, tokenized design system for the common cases, while Custom Styles give you full CSS control for anything more specific.
