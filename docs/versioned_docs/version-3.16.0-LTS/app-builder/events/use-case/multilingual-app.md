---
id: multilingual-app
title: Build a Multilingual App
description: Learn how to build a multilingual app in ToolJet with one translation variable, a language Dropdown and component bindings. Includes an English fallback, with optional right-to-left support, locale formatting and database-backed translations.
keywords: [ToolJet multilingual app, ToolJet localization, ToolJet i18n, language switcher, translations, right-to-left, RTL, Arabic, variables]
---

<div style={{paddingBottom:'24px'}}>

In this guide, we'll build a multilingual app in ToolJet. Users pick a language from a Dropdown, and the text in the app changes. You'll keep the translations in one variable and the selected language in another, then bind components to them. Missing translations fall back to English.

Here's the finished operations dashboard switching between English, French and Arabic:

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/app-builder/events/multilingual-app/multilingual-demo.gif" alt="An operations dashboard switching between English, French and right-to-left Arabic from a language Dropdown." />
</div>

The dashboard is a preview of the finished result. The steps below use just a Dropdown, a Text component and a Statistics component, and you can apply the same pattern to every other component. We'll use English and French, and add Arabic in an optional extension.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 1: Store the Translations

1. Click **Page settings** in the right sidebar **(1)**.
2. Hover over your page, click the **⋮** menu and select **Edit page details**.
3. Under **Page events** **(2)**, click **New event handler**. Set the event to **On page load**, the action to **Set variable**, the key to `translations`, and paste this as the value:

```js
{{({en: {page_title: "Operations overview", kpi_revenue: "Revenue"}, fr: {page_title: "Vue d'ensemble des opérations", kpi_revenue: "Chiffre d'affaires"}})}}
```

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/app-builder/events/multilingual-app/page-events.png" alt="The Page settings button in the right sidebar, and the Page events section of the Edit page panel with an On page load Set variable handler." />
</div>

All the translations now live in `variables.translations`. Keep the value on one line.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 2: Add a Language Dropdown

1. Drag a **Dropdown** onto the canvas and name it `langDropdown`.
2. Add two options: `English` with the value `en`, and `Français` with the value `fr`.
3. Turn on **Make this default option** for English.
4. With the Dropdown selected, open **Events** **(1)** in the right panel and click **New event handler**. Set the event to **On select**, the action to **Set variable**, the key to `lang` and the value to `{{components.langDropdown.value}}`.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/app-builder/events/multilingual-app/dropdown-events.png" alt="The Events section of the langDropdown properties, with an On select Set variable handler." />
</div>

:::info
Bindings read `variables.lang`, so the components update as soon as it changes and no Run Query action is needed. The screenshot also shows an Arabic option, which you'll add in the optional extension.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 3: Bind Components to the Translations

1. Drag a **Text** component onto the canvas.
2. With it selected, enter this in the **Data** field **(1)** in the right panel:

```js
{{variables.translations[variables.lang]?.page_title ?? variables.translations.en.page_title}}
```

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/app-builder/events/multilingual-app/bind-text.png" alt="The Data field of a Text component bound to the translations variable with an English fallback." />
</div>

3. Drag a **Statistics** component onto the canvas, and enter this in its **Label** under **Primary value**:

```js
{{variables.translations[variables.lang]?.kpi_revenue ?? variables.translations.en.kpi_revenue}}
```

Each binding reads the selected language's text, and uses the English text when it is missing. For any other component, copy the binding and change the key. Open the preview and switch the language to see both change.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 4: Verify the English Fallback

1. In the Step 1 value, delete `kpi_revenue: "Chiffre d'affaires"` from `fr`, with its comma.
2. Reload the page and select **Français**.
3. The title is French and the KPI label still reads **Revenue**, not `undefined`.

Restore the deleted translation when you're done.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Optional Extensions

The app above is complete. Each extension below is optional.

### Add a Right-to-Left Language

1. Add `dir: "ltr"` to `en` and `fr` in the Step 1 value, and add Arabic with `dir: "rtl"`:

```js
ar: {page_title: "نظرة عامة على العمليات", kpi_revenue: "الإيرادات", dir: "rtl"}
```

2. Add an option to `langDropdown` with the label `العربية` and the value `ar`.
3. On the **Text** component, open **Styles**, click **fx** next to **Alignment** and enter the expression below. For the **Statistics** component, set **Layout** > **Data** to the same expression.

```js
{{variables.translations[variables.lang]?.dir === "rtl" ? "right" : "left"}}
```

:::info
Components keep their canvas position, so the layout isn't mirrored. End Arabic sentences without a full stop so it doesn't land on the wrong side.
:::

### Add More Languages

Add one more entry to the Step 1 value and one more option to the Dropdown.

### Format Numbers for Each Language

Add a `locale` key (such as `"fr-FR"`) to each language, then use it in a binding:

```js
{{Number(362999128).toLocaleString(variables.translations[variables.lang]?.locale ?? "en-GB", {style: "currency", currency: "EUR", maximumFractionDigits: 0})}}
```

### Keep Translations in a Database

Store them in a [ToolJet Database](/docs/tooljet-db/tooljet-database) table, run a query on page load, and set the `translations` variable from its rows.

### Remember the Selected Language

Add the [Set localStorage](/docs/actions/set-localstorage) action next to Set variable.

</div>
