#!/usr/bin/env node
// Writes src/styles/antd.css: antd's CSS-in-JS output for every antd component the pack uses, extracted once at build
// time, with its colours rewired to ToolJet's theme tokens (--tj-*).
//
// Why static: inline in ToolJet each component renders in its own shadow root and its popups (select lists, pickers,
// modals) in a shared popup layer that is another shadow root. antd's StyleProvider injects into one container, so
// runtime styles would miss the popup layer. The pack's index.css, by contrast, is adopted by every shadow root the
// library owns. At runtime antd still generates its styles; lib/AntProvider.tsx sends them to a detached sink.
//
// The look is stock Ant Design (antd's default theme, and its dark algorithm for a dark app) until the app applies a
// ToolJet theme: the pack is themeMode "own", so the host defines the --tj-* tokens only then. The extraction runs in
// cssVar mode with every colour token set to a unique sentinel colour; each sentinel in the output (also as rgba(),
// when antd applied an alpha to it) becomes var(--ant-<token>), declared once on :host and .tj-ant as
// var(--tj-ant-<token>, var(--tjt-<token>, <antd default>)): the component's style prop, else the applied theme,
// else stock Ant.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import * as antd from 'antd';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../src/styles/antd.css');
const h = React.createElement;

// antd's colour tokens (palettes, white, the mask and the two seed bases keep their fixed values).
const PALETTE = /^(blue|purple|cyan|green|magenta|pink|red|orange|yellow|volcano|geekblue|gold|lime)(\d+|-\d+)?$/;
const FIXED = new Set(['colorWhite', 'colorBgMask', 'colorTextBase', 'colorBgBase']);
const isColor = (v) => typeof v === 'string' && /^(#|rgb|hsl)/i.test(v);
const light = antd.theme.getDesignToken();
const dark = antd.theme.getDesignToken({ algorithm: antd.theme.darkAlgorithm });
const keys = Object.keys(light).filter((k) => isColor(light[k]) && !PALETTE.test(k) && !FIXED.has(k));

// The look: stock Ant Design unless the app applies a ToolJet theme.
const B = 'var(--tj-brand)';
const T = 'var(--tj-text)';
const S = 'var(--tj-surface)';
const mix = (c, p, base = S) => `color-mix(in srgb, ${c} ${p}%, ${base})`;
const alpha = (c, p) => `color-mix(in srgb, ${c} ${p}%, transparent)`;

const kebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();

// Ink: a status colour as small text on its own tint (a Tag, a filled input's status text), readable at 4.5:1. The
// colour keeps its hue and chroma at an oklch lightness of at most 0.46 under dark text (a light app) and at least 0.76
// under light text (a dark one), so a colour that already reads keeps its lightness. The pole (white under light text,
// black under dark) carries the side into the mix: half the colour and half the pole is lighter than 0.5 only when dark.
// The same formula as the shadcn pack's --ui-ink-* (styles/ui.css there).
const INK_POLE = 'lch(from var(--ant-color-text) clamp(0, (l - 50) * 1000, 100) 0 0 / 1)';
const INK_L = 'calc(clamp(0, (l - 0.5) * 1000, 1) * max(l * 2 - 1, 0.76) + (1 - clamp(0, (l - 0.5) * 1000, 1)) * min(l * 2, 0.46))';
const ink = (c) => `oklch(from color-mix(in oklab, ${c} 50%, ${INK_POLE}) ${INK_L} calc(c * 2) h / 1)`;
// The status families' text tokens (colorSuccessText ...): the ink of the family's colour, light, dark and themed.
const INKED = Object.fromEntries(['Success', 'Warning', 'Error', 'Info'].map((n) => [`color${n}Text`, ink(`var(--ant-${kebab(`color${n}`)})`)]));

// One family of status tokens (Primary, Success, Warning, Error, Info) from one --tj-* colour. A status family's text
// token is left to INKED (the ink of its colour, themed or not).
const family = (name, c) => ({
  [`color${name}`]: c,
  ...(name === 'Primary' ? { [`color${name}Text`]: c } : {}),
  [`color${name}Hover`]: mix(c, 82, '#fff'),
  [`color${name}TextHover`]: mix(c, 82, '#fff'),
  [`color${name}Active`]: mix(c, 82, '#000'),
  [`color${name}TextActive`]: mix(c, 82, '#000'),
  [`color${name}Bg`]: mix(c, 10),
  [`color${name}BgHover`]: mix(c, 18),
  [`color${name}Border`]: mix(c, 40),
  [`color${name}BorderHover`]: mix(c, 60),
});

// antd colour token -> its value from an applied ToolJet theme (--tj-*). The host defines --tj-* only when the app
// applies a theme (pack themeMode "own"); without them each expression is invalid at computed time, so the
// var(--tjt-<token>, <antd default>) below falls back to stock Ant.
const THEMED = {
  ...family('Primary', B),
  ...family('Info', B),
  ...family('Success', 'var(--tj-success)'),
  ...family('Warning', 'var(--tj-warning)'),
  ...family('Error', 'var(--tj-danger)'),
  colorErrorBgFilledHover: mix('var(--tj-danger)', 14),
  colorErrorBgActive: mix('var(--tj-danger)', 22),
  colorErrorOutline: alpha('var(--tj-danger)', 10),
  colorWarningOutline: alpha('var(--tj-warning)', 12),
  colorLink: B,
  colorLinkHover: mix(B, 82, '#fff'),
  colorLinkActive: mix(B, 82, '#000'),
  controlOutline: alpha(B, 18),
  controlItemBgActive: mix(B, 10),
  controlItemBgActiveHover: mix(B, 18),
  controlItemBgActiveDisabled: alpha(T, 15),
  controlItemBgHover: alpha(T, 4),
  controlTmpOutline: alpha(T, 2),
  colorText: T,
  colorTextHeading: T,
  colorIconHover: T,
  colorTextSecondary: alpha(T, 72),
  colorTextLabel: alpha(T, 80),
  colorTextTertiary: 'var(--tj-text-muted)',
  colorTextDescription: 'var(--tj-text-muted)',
  colorIcon: 'var(--tj-text-muted)',
  colorTextQuaternary: alpha('var(--tj-text-muted)', 70),
  colorTextPlaceholder: alpha('var(--tj-text-muted)', 80),
  colorTextDisabled: alpha(T, 32),
  colorTextLightSolid: 'var(--tj-on-brand)',
  colorHighlight: 'var(--tj-danger)',
  colorFill: alpha(T, 15),
  colorFillContentHover: alpha(T, 15),
  colorBgTextActive: alpha(T, 15),
  colorFillSecondary: alpha(T, 6),
  colorFillContent: alpha(T, 6),
  colorBgTextHover: alpha(T, 6),
  colorFillTertiary: alpha(T, 4),
  colorBgContainerDisabled: alpha(T, 4),
  colorFillQuaternary: alpha(T, 2),
  colorFillAlter: alpha(T, 2),
  colorBgSolid: T,
  colorBgSolidHover: alpha(T, 75),
  colorBgSolidActive: alpha(T, 95),
  colorBgLayout: 'var(--tj-surface-muted)',
  colorBgContainer: S,
  colorBgElevated: S,
  colorBorderBg: S,
  colorBorder: 'var(--tj-border)',
  colorBorderSecondary: 'var(--tj-border-weak)',
  colorSplit: 'var(--tj-border-weak)',
};

// Non-colour tokens a style prop may override (borderRadius).
const EXTRA_THEMED = {
  'border-radius': 'var(--tj-radius)',
  'border-radius-sm': 'var(--tj-radius-small)',
  'border-radius-lg': 'var(--tj-radius-large)',
  // Set in its own rule below (only on a themed host).
  'font-family': null,
};
const EXTRA = {
  'border-radius': `${light.borderRadius}px`,
  'border-radius-sm': `${light.borderRadiusSM}px`,
  'border-radius-lg': `${light.borderRadiusLG}px`,
  'border-radius-xs': `${light.borderRadiusXS}px`,
  'font-family': light.fontFamily.replace(/\s*\n\s*/g, ' '),
  'font-size': `${light.fontSize}px`,
};

const sentinel = (i) => `#0102${(i + 1).toString(16).padStart(2, '0')}`;
const token = Object.fromEntries(keys.map((k, i) => [k, sentinel(i)]));
export const THEME = { cssVar: { key: 'tj', prefix: 'ant' }, hashed: false };

const {
  ConfigProvider, Button, Input, InputNumber, Select, DatePicker, Checkbox, Switch, Radio, Rate, Segmented, Slider, Tag,
  Badge, Alert, Typography, Statistic, Table, Pagination, Empty, Spin, Tabs, Modal, List, Card, Descriptions, Progress,
  Avatar, Steps, Timeline, Divider, Result, Form, Tooltip, Skeleton, Space, Flex, Dropdown, Menu, Popover,
  Upload, TimePicker, AutoComplete, TreeSelect, Cascader, ColorPicker, Transfer, Collapse, Breadcrumb, Drawer, Image,
  Calendar, Tree, Carousel, QRCode,
} = antd;
const all = [
  h(Button, { type: 'primary' }, 'b'), h(Input), h(Input.TextArea), h(Input.Password), h(Input.Search), h(Input.OTP), h(InputNumber),
  h(Select, { options: [] }), h(DatePicker), h(Checkbox), h(Checkbox.Group),
  h(Switch), h(Radio.Group, { options: ['a'] }), h(Radio.Button), h(Rate), h(Segmented, { options: ['a'] }), h(Slider),
  // Tag registers its status and palette colours in sub-components it renders only for a coloured tag.
  h(Tag), h(Tag, { color: 'success' }), h(Tag, { color: 'blue' }), h(Tag.CheckableTag, { checked: true }), h(Badge, { count: 1 }),
  h(Badge, { status: 'success', text: 'b' }), h(Alert, { message: 'a' }), h(Typography.Title), h(Typography.Text),
  h(Typography.Paragraph), h(Typography.Link), h(Statistic, { value: 1 }), h(Table, { dataSource: [], columns: [] }),
  h(Pagination, { total: 50 }), h(Empty), h(Spin), h(Tabs, { items: [{ key: 'a', label: 'a' }] }),
  h(Modal, { open: true, getContainer: false }), h(List, { dataSource: [] }), h(Card), h(Descriptions, { items: [] }),
  h(Progress), h(Progress, { type: 'circle' }), h(Avatar), h(Avatar.Group), h(Steps, { items: [{ title: 'a' }] }),
  h(Timeline, { items: [{ children: 'a' }] }), h(Divider), h(Result), h(Form, null, h(Form.Item, { label: 'a' })),
  h(Tooltip, { title: 't', open: true, getPopupContainer: () => null }, h('span')), h(Skeleton), h(Space), h(Flex),
  h(Dropdown, { menu: { items: [] } }, h('span')), h(Menu, { items: [] }), h(Popover, { content: 'p' }, h('span')),
  h(Upload.Dragger, { fileList: [{ uid: '1', name: 'a.csv', status: 'done' }] }), h(Upload, { listType: 'picture', fileList: [{ uid: '2', name: 'b.png', status: 'done' }] }),
  h(TimePicker), h(DatePicker.RangePicker), h(AutoComplete, { options: [] }), h(TreeSelect, { treeData: [] }),
  h(Cascader, { options: [] }), h(ColorPicker, { open: true, getPopupContainer: () => null }), h(Transfer, { dataSource: [] }),
  h(Collapse, { items: [{ key: 'a', label: 'a', children: 'a' }] }), h(Breadcrumb, { items: [{ title: 'a' }] }),
  // Dropdown and Menu style their popup menus in sub-components rendered only when open.
  h(Dropdown, { menu: { items: [{ key: 'a', label: 'a' }] }, open: true, getPopupContainer: () => null }, h('span')),
  h(Dropdown.Button, { menu: { items: [] } }, 'b'),
  h(Menu, { mode: 'inline', items: [{ key: 'a', label: 'a', children: [{ key: 'b', label: 'b' }] }] }),
  h(Menu, { mode: 'horizontal', items: [{ key: 'a', label: 'a' }] }),
  h(Drawer, { open: true, getContainer: false }), h(Image, { src: 'x' }), h(Image.PreviewGroup), h(Skeleton.Image),
  h(Calendar), h(Tree, { treeData: [] }), h(Carousel, null, h('div')), h(QRCode, { value: 'a' }),
];

const cache = createCache();
const quiet = console.error;
console.error = () => {}; // server-render warnings (useLayoutEffect) are noise here
renderToString(h(StyleProvider, { cache }, h(ConfigProvider, { theme: { ...THEME, token } }, ...all)));
console.error = quiet;
let css = extractStyle(cache, { plain: true, types: ['style', 'token', 'cssVar'] });

// The global token block (selector `.tj`) declares the colour tokens; drop those declarations, they live on :host.
const names = new Set([...keys.map((k) => `--ant-${kebab(k)}`), ...Object.keys(EXTRA).map((k) => `--ant-${k}`)]);
css = css.replace(/(^|\})\.tj\{([^}]*)\}/g, (_m, lead, body) => {
  const kept = body.split(';').filter((decl) => !names.has(decl.split(':')[0].trim()));
  return `${lead}.tj{${kept.join(';')}}`;
});

// Sentinels -> var(--ant-<token>), with any alpha antd applied kept through color-mix.
const bySentinel = new Map(keys.map((k, i) => [sentinel(i).slice(1), `var(--ant-${kebab(k)})`]));
css = css.replace(/#(0102[0-9a-f]{2})\b/gi, (m, hex) => bySentinel.get(hex.toLowerCase()) ?? m);
css = css.replace(/rgba?\(\s*1\s*,\s*2\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g, (m, b, a) => {
  const v = bySentinel.get(`0102${Number(b).toString(16).padStart(2, '0')}`);
  if (!v) return m;
  return a === undefined ? v : `color-mix(in srgb, ${v} ${Math.round(Number(a) * 1000) / 10}%, transparent)`;
});
// A status Tag (success, processing, error, warning) draws its text in the family's text token, the ink, as antd's own
// filled status fields do; antd's Tag uses the family's base colour, which measured 2.3:1 on its tint in a dark app.
css = css.replace(
  /(\.ant-tag\.ant-tag-(?:success|processing|error|warning)\{color:var\(--ant-color-(?:success|info|error|warning))\)/g,
  '$1-text)'
);
const leftovers = css.match(/#0102[0-9a-f]{2}|rgba?\(\s*1\s*,\s*2\s*,/gi) ?? [];
// A sentinel antd mixed with another colour (darken, lighten) cannot be traced back; report it.
const mixed = css.match(/#010[0-9a-f]{3}\b/gi) ?? [];

// On :host (every shadow root of the library, the popup layer included) and on each component root (.tj-ant), so a
// component's own style props (lib/AntProvider.tsx useTokenStyles, set as --tj-ant-* on its root) apply. A root in a
// dark app carries .tj-ant-dark (antd's dark algorithm).
// Each token: the component's style prop (--tj-ant-*), else the applied theme (--tjt-*), else antd's default.
const themedVar = (k) => (THEMED[k] ? `var(--tjt-${kebab(k)}, ` : '');
const block = (selector, token) =>
  [
    `${selector} {`,
    ...keys.map((k) => `  --ant-${kebab(k)}: var(--tj-ant-${kebab(k)}, ${themedVar(k)}${INKED[k] ?? token[k]}${THEMED[k] ? ')' : ''});`),
    ...(token === light
      ? Object.entries(EXTRA).map(([k, v]) => `  --ant-${k}: var(--tj-ant-${k}, ${k in EXTRA_THEMED ? `var(--tjt-${k}, ${v})` : v});`)
      : []),
    '}',
  ].join('\n');
const themed = [
  ':host, .tj-ant {',
  ...Object.entries(THEMED).map(([k, v]) => `  --tjt-${kebab(k)}: ${v};`),
  ...Object.entries(EXTRA_THEMED).filter(([, v]) => v).map(([k, v]) => `  --tjt-${k}: ${v};`),
  '}',
  // The app font only with an applied theme (the host marks itself .tj-themed); a bare var(--cc-font-family) is
  // always inherited from the page.
  ':host(.tj-themed), :host(.tj-themed) .tj-ant {',
  '  --tjt-font-family: var(--cc-font-family);',
  '}',
].join('\n');
const host = `${themed}\n${block(':host, .tj-ant', light)}\n${block('.tj-ant.tj-ant-dark, .tj-ant-dark .tj-ant', dark)}\n.tj-ant-dark {\n  color-scheme: dark;\n}`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  `/* Generated by scripts/extract-styles.mjs from antd ${antd.version}. Do not edit. */\n${host}\n${css}\n`
);
console.log(
  `antd.css: ${Math.round(fs.statSync(out).size / 1024)} KB, ${keys.length} theme tokens` +
    (leftovers.length || mixed.length ? `, untraced colours: ${[...new Set([...leftovers, ...mixed])].join(' ')}` : '')
);
