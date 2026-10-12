---
id: build-multilingual-app
title: Build a Multilingual App
description: Learn how to build a multilingual app in ToolJet. Add a language switcher, translate labels, charts and tables, format numbers and dates for each locale, and support right-to-left languages such as Arabic.
keywords: [ToolJet multilingual app, ToolJet localization, ToolJet i18n, internationalization, language switcher, right-to-left, RTL, Arabic, RunJS, page variable]
---

<div style={{paddingBottom:'24px'}}>

In this guide, we'll build a multilingual ToolJet app: one dashboard that users can read in English, French, German, Spanish, Japanese or Arabic. We'll keep the translations in a RunJS query, switch the language with a page variable, and format numbers and dates for each locale.

The same approach works for any app, such as a form, an admin panel or a support queue. Later in the guide, you'll also see how to keep the translations in a ToolJet Database table or another data source instead.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/build-multilingual-app/dashboard-languages.gif" alt="A ToolJet dashboard switching between English, French, German, Spanish, Japanese and right-to-left Arabic. Titles, KPI labels, chart legends, table headers, status badges, currency and dates change while the figures stay the same." />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 1: Create the Translations Query

Create a new **RunJS** query named `computeLabels` and turn on **Run this query on application load**. Add the translations as an object, with one entry per text and one value per language, and a lookup that picks the right language:

```js
var T = {
  kpi_revenue: { en: "Revenue", fr: "Chiffre d'affaires", de: "Umsatz" },
  col_status:  { en: "Status",  fr: "Statut",             de: "Status" }
};

// Page variable first, then ?lang= in the URL, then English.
var lang = (page.variables && page.variables.lang) || (globals.urlparams && globals.urlparams.lang) || 'en';

// Chosen language, then English, then the key itself.
var t = {};
Object.keys(T).forEach(function (k) { t[k] = T[k][lang] || T[k].en || k; });

return { lang: lang, t: t };
```

Run the query. The preview shows `lang: "en"` and a `t` object with every text. If a translation is missing, the lookup falls back to English, and if the key itself is missing it shows the key name, so gaps are easy to spot.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 2: Bind Components to the Translations

Select a **Text** component, click **fx** next to its `Text` property and enter:

```js
{{((queries.computeLabels.data || {}).t || {}).kpi_revenue || ''}}
```

Do the same for button labels, **Statistics** labels, chart titles and table column names. The `|| ''` keeps a component empty, not broken, while the query is loading. Typed text can't change language, so every label in the app should come from `t`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 3: Add a Language Switcher

Add one **Button** per language. Bind its `Text` to the language name, such as `Deutsch`, so users can find their language in any language. For each button, add two **On click** events in this order:

- **Set page variable**: key `lang`, value `de` (the button's language code).
- **Run Query**: `computeLabels`.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/build-multilingual-app/annotated-switcher.png" alt="The Deutsch button selected in the ToolJet builder. Callout 1 marks the label binding, callout 2 the two On click events, and callout 3 the button on the canvas." />
</div>

Click a button in the preview and every bound label changes. You can also open the app with `?lang=fr` in the URL to start in French.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 4: Format Numbers and Dates for Each Locale

Translated words are half the job. `Intl` writes numbers, currency and dates the way each language expects, so the figures stay the same and only the writing changes. Add a locale for each language in `computeLabels`, and return it:

```js
var LOCALE = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', ja: 'ja-JP', ar: 'ar-EG-u-nu-latn' };

return { lang: lang, locale: LOCALE[lang], t: t };
```

Then use it wherever you format a value:

```js
var eur = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
eur.format(362999128);   // €362,999,128  ·  362.999.128 €  ·  362 999 128 €
```

`ar-EG-u-nu-latn` keeps Latin digits in Arabic. Use `ar-EG` for Arabic-Indic digits.

For charts and tables, build the values in a second RunJS query, `computeDash`. It returns formatted KPI values, the Plotly JSON for each chart and the table rows, so legends, month names, axis units and status labels are plain translated strings. Set each **Chart** to **Plot from JSON** and bind its JSON description to the query. The full query is at the end of this guide.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/build-multilingual-app/five-languages.png" alt="The same dashboard in English, French, German, Spanish and Japanese, side by side." />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 5: Support Right-to-Left Languages

For Arabic, Hebrew and other right-to-left languages, add the language like any other and return its text direction from `computeLabels`:

```js
var RTL = ['ar', 'he'];

return { lang: lang, locale: LOCALE[lang], dir: RTL.indexOf(lang) > -1 ? 'rtl' : 'ltr', t: t };
```

Then use `dir` in three places:

- **Text and tables:** add a CSS rule to an **Html** component's `<style>` block and bind it to `dir`, so it only applies for right-to-left languages. ToolJet adds a `_tooljet-<component name>` class to each component, which you can target:

  ```js
  {{((queries.computeLabels.data || {}).dir === 'rtl') ? ['pageTitle', 'statusTable'].map(function (n) { return '._tooljet-' + n + ', ._tooljet-' + n + ' * { direction: rtl; text-align: right !important; }'; }).join(' ') : ''}}
  ```

- **Charts:** mirror the Plotly figure in `computeDash` so time runs right to left, value axes move to the right and legends align right.
- **Fonts:** load a font that covers the script, such as `Noto Sans Arabic`.

<div style={{textAlign: 'center'}}>
 <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/build-multilingual-app/arabic-rtl.jpg" alt="The same dashboard in Arabic. Text is right-aligned, the revenue chart runs right to left with its value axis on the right, and the table columns read right to left." />
</div>

Components keep their positions on the canvas, so the sidebar stays on the left while the text, charts and tables read right to left.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 6: Move the Translations to a Table (Optional)

When translators or admins need to edit text without opening the app, store one row per text and language in a [ToolJet Database](/docs/tooljet-db/tooljet-database) table with `key`, `lang` and `value` columns. Create a **List rows** query named `getTranslations` that runs on page load and triggers `computeLabels` on success, then build `T` from the rows:

```js
var rows = (queries.getTranslations && queries.getTranslations.data) || [];
var T = {};
rows.forEach(function (r) { T[r.key] = T[r.key] || {}; T[r.key][r.lang] = r.value; });
```

Everything else stays the same, including the bindings. A Google Sheet, a SQL query or a REST API works the same way, as long as the query returns `key`, `lang` and `value`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

This was a basic implementation of a multilingual app in ToolJet. Feel free to extend it, for example by adding more languages or by saving the user's choice with the [Set localStorage](/docs/actions/set-localstorage) action, since the language isn't remembered between visits. Text that ToolJet generates itself, such as the Table's search box, isn't translated by this approach, so the example hides it.

<details>
<summary>Full dictionary for <code>computeLabels</code> (51 texts × 6 languages)</summary>

Use it in place of the short object in Step 1, with these lines after it:

```js
var SUPPORTED = ['en', 'fr', 'de', 'es', 'ja', 'ar'];
var LOCALE = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', ja: 'ja-JP', ar: 'ar-EG-u-nu-latn' };
var RTL = ['ar'];
// ...then the language lookup and the t loop from Step 1 (check lang against SUPPORTED), plus:
var langs = SUPPORTED.map(function (code) { return { code: code, name: T.lang_name[code] || code, current: code === lang }; });
return { lang: lang, locale: LOCALE[lang], dir: RTL.indexOf(lang) > -1 ? 'rtl' : 'ltr', t: t, langs: langs };
```

```js
var T = {
  app_name: { en: "Global Operations Command Center", fr: "Centre de commandement des opérations mondiales", de: "Globales Operations-Cockpit", es: "Centro de mando de operaciones globales", ja: "グローバル・オペレーション・コマンドセンター", ar: "مركز قيادة العمليات العالمية" },
  brand_short: { en: "Command Center", fr: "Centre de commande", de: "Leitstand", es: "Centro de mando", ja: "コマンドセンター", ar: "مركز القيادة" },
  page_title: { en: "Operations overview", fr: "Vue d'ensemble des opérations", de: "Betriebsübersicht", es: "Resumen de operaciones", ja: "オペレーション概況", ar: "نظرة عامة على العمليات" },
  page_subtitle: { en: "Revenue and delivery performance across four regions", fr: "Chiffre d'affaires et performance de livraison dans quatre régions", de: "Umsatz und Lieferleistung in vier Regionen", es: "Ingresos y rendimiento de entrega en cuatro regiones", ja: "4地域の売上と配送パフォーマンス", ar: "الإيرادات وأداء التسليم في أربع مناطق" },
  nav_language: { en: "Language", fr: "Langue", de: "Sprache", es: "Idioma", ja: "言語", ar: "اللغة" },
  nav_note: { en: "Figures are identical in every language.", fr: "Les chiffres sont identiques dans toutes les langues.", de: "Die Zahlen sind in jeder Sprache identisch.", es: "Las cifras son idénticas en todos los idiomas.", ja: "数値はどの言語でも同じです。", ar: "الأرقام متطابقة في جميع اللغات." },
  filter_region: { en: "Region", fr: "Région", de: "Region", es: "Región", ja: "地域", ar: "المنطقة" },
  filter_period: { en: "Period", fr: "Période", de: "Zeitraum", es: "Período", ja: "期間", ar: "الفترة" },
  region_all: { en: "All regions", fr: "Toutes les régions", de: "Alle Regionen", es: "Todas las regiones", ja: "全地域", ar: "كل المناطق" },
  region_na: { en: "North America", fr: "Amérique du Nord", de: "Nordamerika", es: "Norteamérica", ja: "北米", ar: "أمريكا الشمالية" },
  region_emea: { en: "EMEA", fr: "EMEA", de: "EMEA", es: "EMEA", ja: "EMEA", ar: "EMEA" },
  region_apac: { en: "Asia-Pacific", fr: "Asie-Pacifique", de: "Asien-Pazifik", es: "Asia-Pacífico", ja: "アジア太平洋", ar: "آسيا والمحيط الهادئ" },
  region_latam: { en: "Latin America", fr: "Amérique latine", de: "Lateinamerika", es: "Latinoamérica", ja: "中南米", ar: "أمريكا اللاتينية" },
  period_6: { en: "Last 6 months", fr: "6 derniers mois", de: "Letzte 6 Monate", es: "Últimos 6 meses", ja: "直近6か月", ar: "آخر 6 أشهر" },
  period_12: { en: "Last 12 months", fr: "12 derniers mois", de: "Letzte 12 Monate", es: "Últimos 12 meses", ja: "直近12か月", ar: "آخر 12 شهرًا" },
  kpi_revenue: { en: "Revenue", fr: "Chiffre d'affaires", de: "Umsatz", es: "Ingresos", ja: "売上高", ar: "الإيرادات" },
  kpi_orders: { en: "Orders fulfilled", fr: "Commandes traitées", de: "Erfüllte Bestellungen", es: "Pedidos completados", ja: "処理済み注文", ar: "الطلبات المنفّذة" },
  kpi_ontime: { en: "On-time delivery", fr: "Livraison à l'heure", de: "Pünktliche Lieferung", es: "Entrega puntual", ja: "定時配送率", ar: "التسليم في الموعد" },
  kpi_aov: { en: "Avg. order value", fr: "Panier moyen", de: "Ø Bestellwert", es: "Valor medio de pedido", ja: "平均注文額", ar: "متوسط قيمة الطلب" },
  kpi_mom: { en: "vs last month", fr: "vs mois précédent", de: "ggü. Vormonat", es: "vs mes anterior", ja: "前月比", ar: "مقارنة بالشهر السابق" },
  chart_revenue_title: { en: "Revenue by region", fr: "Chiffre d'affaires par région", de: "Umsatz nach Region", es: "Ingresos por región", ja: "地域別売上高", ar: "الإيرادات حسب المنطقة" },
  chart_regions_title: { en: "Regional comparison", fr: "Comparaison régionale", de: "Regionaler Vergleich", es: "Comparación regional", ja: "地域比較", ar: "مقارنة المناطق" },
  chart_ops_title: { en: "Orders and on-time rate", fr: "Commandes et taux de ponctualité", de: "Bestellungen und Pünktlichkeit", es: "Pedidos y puntualidad", ja: "注文数と定時率", ar: "الطلبات ونسبة الالتزام بالموعد" },
  legend_orders: { en: "Orders", fr: "Commandes", de: "Bestellungen", es: "Pedidos", ja: "注文数", ar: "الطلبات" },
  legend_ontime: { en: "On-time rate", fr: "Taux de ponctualité", de: "Pünktlichkeitsquote", es: "Tasa de puntualidad", ja: "定時率", ar: "نسبة الالتزام بالموعد" },
  table_title: { en: "Country performance", fr: "Performance par pays", de: "Länderleistung", es: "Rendimiento por país", ja: "国別パフォーマンス", ar: "أداء الدول" },
  col_country: { en: "Country", fr: "Pays", de: "Land", es: "País", ja: "国", ar: "الدولة" },
  col_revenue: { en: "Revenue", fr: "CA", de: "Umsatz", es: "Ingresos", ja: "売上高", ar: "الإيرادات" },
  col_orders: { en: "Orders", fr: "Commandes", de: "Bestellungen", es: "Pedidos", ja: "注文数", ar: "الطلبات" },
  col_sla: { en: "On-time", fr: "À l'heure", de: "Pünktlich", es: "Puntual", ja: "定時率", ar: "في الموعد" },
  col_status: { en: "Status", fr: "Statut", de: "Status", es: "Estado", ja: "状況", ar: "الحالة" },
  status_healthy: { en: "Healthy", fr: "Sain", de: "Stabil", es: "Saludable", ja: "良好", ar: "سليم" },
  status_watch: { en: "Watch", fr: "Sous surveillance", de: "Beobachten", es: "Vigilancia", ja: "要注意", ar: "مراقبة" },
  status_critical: { en: "Critical", fr: "Critique", de: "Kritisch", es: "Crítico", ja: "危機", ar: "حرج" },
  country_us: { en: "United States", fr: "États-Unis", de: "Vereinigte Staaten", es: "Estados Unidos", ja: "米国", ar: "الولايات المتحدة" },
  country_ca: { en: "Canada", fr: "Canada", de: "Kanada", es: "Canadá", ja: "カナダ", ar: "كندا" },
  country_gb: { en: "United Kingdom", fr: "Royaume-Uni", de: "Vereinigtes Königreich", es: "Reino Unido", ja: "英国", ar: "المملكة المتحدة" },
  country_de: { en: "Germany", fr: "Allemagne", de: "Deutschland", es: "Alemania", ja: "ドイツ", ar: "ألمانيا" },
  country_fr: { en: "France", fr: "France", de: "Frankreich", es: "Francia", ja: "フランス", ar: "فرنسا" },
  country_ae: { en: "UAE", fr: "Émirats arabes unis", de: "Vereinigte Arabische Emirate", es: "Emiratos Árabes Unidos", ja: "アラブ首長国連邦", ar: "الإمارات" },
  country_jp: { en: "Japan", fr: "Japon", de: "Japan", es: "Japón", ja: "日本", ar: "اليابان" },
  country_sg: { en: "Singapore", fr: "Singapour", de: "Singapur", es: "Singapur", ja: "シンガポール", ar: "سنغافورة" },
  country_au: { en: "Australia", fr: "Australie", de: "Australien", es: "Australia", ja: "オーストラリア", ar: "أستراليا" },
  country_br: { en: "Brazil", fr: "Brésil", de: "Brasilien", es: "Brasil", ja: "ブラジル", ar: "البرازيل" },
  country_mx: { en: "Mexico", fr: "Mexique", de: "Mexiko", es: "México", ja: "メキシコ", ar: "المكسيك" },
  country_ar: { en: "Argentina", fr: "Argentine", de: "Argentinien", es: "Argentina", ja: "アルゼンチン", ar: "الأرجنتين" },
  refresh_button: { en: "Refresh data", fr: "Actualiser", de: "Daten aktualisieren", es: "Actualizar datos", ja: "データを更新", ar: "تحديث البيانات" },
  updated_label: { en: "Updated {time}", fr: "Mis à jour à {time}", de: "Aktualisiert um {time}", es: "Actualizado a las {time}", ja: "{time} 更新", ar: "آخر تحديث {time}" },
  tag_live: { en: "Live", fr: "En direct", de: "Live", es: "En vivo", ja: "ライブ", ar: "مباشر" },
  err_load: { en: "Could not load data.", fr: "Impossible de charger les données.", de: "Daten konnten nicht geladen werden.", es: "No se pudieron cargar los datos.", ja: "データを読み込めませんでした。", ar: "تعذّر تحميل البيانات." },
  lang_name: { en: "English", fr: "Français", de: "Deutsch", es: "Español", ja: "日本語", ar: "العربية" }
};
```

</details>

<details>
<summary>Complete <code>computeDash</code> query</summary>

Run it after `computeLabels` and after a `getSales` query (a ToolJet Database **List rows** query on a table with `month`, `country_key`, `region_key`, `revenue`, `orders` and `ontime_orders`). Bind each chart's JSON description to `{{(queries.computeDash.data || {}).revenueJson || '{}'}}` (and `regionsJson`, `opsJson`) with **Plot from JSON** on, and the Table's data to `rows`.

```js
var L = (queries.computeLabels && queries.computeLabels.data) || null;
var sales = (queries.getSales && queries.getSales.data) || [];
if (!L || !L.t || !sales.length) { return {}; }
var t = L.t;
var locale = L.locale;
var rtl = L.dir === 'rtl';

// Filters live in page variables (set by the chips).
var region = 'all';
var period = 12;
try { region = (page.variables && page.variables.region) || 'all'; } catch (e) { region = 'all'; }
try { period = Number((page.variables && page.variables.period) || 12); } catch (e) { period = 12; }

function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, v) { return vars && vars[v] !== undefined ? vars[v] : m; }); }
function day(r) { return String(r.month).slice(0, 10); }

// Locale-aware formatters.
var cur0 = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
var curC = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });
var nf = new Intl.NumberFormat(locale);
var pct1 = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
var pct0 = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
var pctS = new Intl.NumberFormat(locale, { style: 'percent', signDisplay: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1 });
var monShort = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
var monLong = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

var months = [];
var seen = {};
sales.forEach(function (r) { var d = day(r); if (!seen[d]) { seen[d] = 1; months.push(d); } });
months.sort();
var keep = months.slice(-period);
var scoped = sales.filter(function (r) { return keep.indexOf(day(r)) > -1 && (region === 'all' || r.region_key === region); });
var allInPeriod = sales.filter(function (r) { return keep.indexOf(day(r)) > -1; });

function agg(rows) { var o = { rev: 0, orders: 0, ot: 0 }; rows.forEach(function (r) { o.rev += Number(r.revenue); o.orders += r.orders; o.ot += r.ontime_orders; }); return o; }
function at(m) { return agg(scoped.filter(function (r) { return day(r) === m; })); }
var total = agg(scoped);
var last = at(keep[keep.length - 1]);
var prev = at(keep[keep.length - 2]);
function chg(a, b) { return b ? a / b - 1 : 0; }

var kpis = {
  revenue: { value: cur0.format(total.rev), delta: pctS.format(chg(last.rev, prev.rev)) },
  orders: { value: nf.format(total.orders), delta: pctS.format(chg(last.orders, prev.orders)) },
  ontime: { value: pct1.format(total.ot / total.orders), delta: pctS.format(last.ot / last.orders - prev.ot / prev.orders) },
  aov: { value: cur0.format(total.rev / total.orders), delta: pctS.format(chg(last.rev / last.orders, prev.rev / prev.orders)) }
};

var REGIONS = ['na', 'emea', 'apac', 'latam'];
var COLORS = { na: '#4F46E5', emea: '#0EA5E9', apac: '#14B8A6', latam: '#F59E0B' };
var FONT = { color: '#64748B', family: "Inter, 'Noto Sans JP', 'Noto Sans Arabic', system-ui, sans-serif", size: 12 };
var GRID = '#EDF1F6';

// Right-to-left: mirror a chart so time runs right to left, value axes sit on the right, and legends align right.
function mirror(fig) {
  var ly = fig.layout;
  var m = ly.margin;
  var l = m.l;
  m.l = m.r;
  m.r = l;
  if (ly.xaxis.range) { ly.xaxis.range = [ly.xaxis.range[1], ly.xaxis.range[0]]; } else { ly.xaxis.autorange = 'reversed'; }
  ly.yaxis.side = 'right';
  if (ly.yaxis2) { ly.yaxis2.side = 'left'; }
  if (ly.legend) { ly.legend.x = 1; ly.legend.xanchor = 'right'; }
  return fig;
}

// Chart 1: revenue by region over time.
var shown = region === 'all' ? REGIONS : [region];
var maxStack = 0;
keep.forEach(function (m) { var s = 0; scoped.forEach(function (r) { if (day(r) === m) { s += Number(r.revenue); } }); if (s > maxStack) { maxStack = s; } });
var step = Math.max(1000000, Math.ceil(maxStack / 4 / 1000000) * 1000000);
var yTicks = [0, step, step * 2, step * 3, step * 4];
var revFig = {
  data: shown.map(function (k) {
    var ys = keep.map(function (m) { var s = 0; scoped.forEach(function (r) { if (day(r) === m && r.region_key === k) { s += Number(r.revenue); } }); return s; });
    return { type: 'scatter', mode: 'lines', stackgroup: 'one', name: t['region_' + k], x: keep, y: ys, line: { width: 1.5, color: COLORS[k] }, fillcolor: COLORS[k] + '66', text: keep.map(function (m, i) { return t['region_' + k] + '<br>' + monLong.format(new Date(m)) + '<br>' + curC.format(ys[i]); }), hovertemplate: '%{text}<extra></extra>' };
  }),
  layout: { autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: FONT, hovermode: 'x unified', showlegend: true, legend: { orientation: 'h', x: 0, y: 1.14 }, margin: { l: 64, r: 12, t: 8, b: 30 }, xaxis: { tickvals: keep, ticktext: keep.map(function (m) { return monShort.format(new Date(m)); }), showgrid: false, linecolor: GRID }, yaxis: { tickvals: yTicks, ticktext: yTicks.map(function (v) { return curC.format(v); }), gridcolor: GRID, zeroline: false, range: [0, step * 4] } }
};

// Chart 2: regional comparison. The selected region stays solid.
var regTotals = REGIONS.map(function (k) { return { k: k, v: agg(allInPeriod.filter(function (r) { return r.region_key === k; })).rev }; }).sort(function (a, b) { return b.v - a.v; });
var regFig = {
  data: [{ type: 'bar', orientation: 'h', y: regTotals.map(function (r) { return t['region_' + r.k]; }), x: regTotals.map(function (r) { return r.v; }), text: regTotals.map(function (r) { return curC.format(r.v); }), textposition: 'outside', cliponaxis: false, marker: { color: regTotals.map(function (r) { return region === 'all' || region === r.k ? COLORS[r.k] : COLORS[r.k] + '4D'; }) }, hovertemplate: '%{y}<br>%{text}<extra></extra>' }],
  layout: { autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: FONT, showlegend: false, margin: { l: 104, r: 16, t: 8, b: 24 }, xaxis: { visible: false, range: [0, regTotals[0].v * 1.6] }, yaxis: { autorange: 'reversed', linecolor: GRID } }
};

// Chart 3: orders (bars) and on-time rate (line, right axis).
var monthly = keep.map(function (m) { return at(m); });
var rates = monthly.map(function (a) { return a.ot / a.orders; });
var minRate = Math.min.apply(null, rates);
var lo = Math.floor(minRate * 100 / 2) * 2 / 100;
var rTicks = [lo, lo + (1 - lo) / 2, 1].map(function (v) { return Math.round(v * 100) / 100; });
var opsFig = {
  data: [
    { type: 'bar', name: t.legend_orders, x: keep, y: monthly.map(function (a) { return a.orders; }), marker: { color: '#C7D2FE' }, textposition: 'none', text: monthly.map(function (a, i) { return monLong.format(new Date(keep[i])) + '<br>' + nf.format(a.orders); }), hovertemplate: '%{text}<extra></extra>' },
    { type: 'scatter', mode: 'lines+markers', name: t.legend_ontime, x: keep, y: rates, yaxis: 'y2', line: { color: '#0F766E', width: 2.5 }, marker: { size: 6 }, text: rates.map(function (v, i) { return monLong.format(new Date(keep[i])) + '<br>' + pct1.format(v); }), hovertemplate: '%{text}<extra></extra>' }
  ],
  layout: { autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: FONT, showlegend: true, legend: { orientation: 'h', x: 0, y: 1.18 }, margin: { l: 56, r: 48, t: 8, b: 28 }, bargap: 0.35, xaxis: { tickvals: keep, ticktext: keep.map(function (m) { return monShort.format(new Date(m)); }), showgrid: false, linecolor: GRID }, yaxis: { gridcolor: GRID, zeroline: false, tickformat: '~s' }, yaxis2: { overlaying: 'y', side: 'right', range: [lo, 1], tickvals: rTicks, ticktext: rTicks.map(function (v) { return pct0.format(v); }), showgrid: false } }
};

if (rtl) { [revFig, regFig, opsFig].forEach(mirror); }

// Table: one row per country for the chosen period and region.
var byCountry = {};
scoped.forEach(function (r) { var o = byCountry[r.country_key] || { rev: 0, orders: 0, ot: 0 }; o.rev += Number(r.revenue); o.orders += r.orders; o.ot += r.ontime_orders; byCountry[r.country_key] = o; });
var rows = Object.keys(byCountry).map(function (k) {
  var o = byCountry[k];
  var rate = o.ot / o.orders;
  var code = rate >= 0.95 ? 'healthy' : rate >= 0.93 ? 'watch' : 'critical';
  return { _rev: o.rev, country: t['country_' + k] || k, revenue: curC.format(o.rev), orders: nf.format(o.orders), ontime: pct1.format(rate), status: t['status_' + code], status_code: code };
}).sort(function (a, b) { return b._rev - a._rev; }).map(function (r) { return { country: r.country, revenue: r.revenue, orders: r.orders, ontime: r.ontime, status: r.status, status_code: r.status_code }; });

var updated = fill(t.updated_label, { time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()) });

return { region: region, period: period, kpis: kpis, revenueJson: JSON.stringify(revFig), regionsJson: JSON.stringify(regFig), opsJson: JSON.stringify(opsFig), rows: rows, updated: updated };
```

</details>

</div>
