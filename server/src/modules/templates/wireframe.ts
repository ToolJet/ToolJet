// Card wireframes for the template gallery. Pure: a template definition goes in, an SVG string comes out.
// scripts/generate-template-assets.ts writes the output next to the preview HTML; nothing calls this at runtime.
// Colours are literal because an SVG loaded through <img> cannot read the page's CSS variables.

export type WireframeTheme = 'light' | 'dark';

type ValueMap = Record<string, { value?: unknown } | undefined>;

interface DefinitionComponent {
  id?: string;
  type: string;
  pageId: string;
  parent: string | null;
  properties?: ValueMap;
  styles?: ValueMap;
  displayPreferences?: ValueMap;
  layouts?: Array<{ type: string; top: number; left: number; width: number; height: number }>;
}

interface DefinitionAppVersion {
  homePageId?: string;
  globalSettings?: {
    theme?: { definition?: { brand?: { colors?: { primary?: { light?: string; dark?: string } } } } };
  };
}

export interface TemplateDefinition {
  app: Array<{
    definition: {
      appV2: {
        components?: DefinitionComponent[];
        dataSources?: Array<{ id: string; kind: string }>;
        dataQueries?: Array<{ dataSourceId: string }>;
        appVersions?: DefinitionAppVersion[];
      };
    };
  }>;
}

export interface WireframeBlock {
  type: string;
  top: number; // px
  left: number; // grid columns
  width: number; // grid columns
  height: number; // px
  // One layer of direct children. Same units as the parent's own fields, but relative to the parent:
  // top is px from the parent's top, left and width are columns of the parent's 43-column grid.
  children?: WireframeBlock[];
}

const GRID_COLUMNS = 43;
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 900;
const HEADER_HEIGHT = 48;
const MODAL_TYPES = new Set(['Modal', 'ModalV2']);
const HEX_COLOUR = /^#[0-9a-f]{3,8}$/i;
const FALLBACK_ACCENT: Record<WireframeTheme, string> = { light: '#4368E3', dark: '#4368E3' };
const PALETTES = {
  light: { background: '#F8F9FA', surface: '#FFFFFF', border: '#E4E7EB', muted: '#D7DBDF' },
  dark: { background: '#1F2129', surface: '#2B2F3A', border: '#3A3F4B', muted: '#4C5155' },
};
// Space kept free inside a parent's border; children are clipped to the area inside it.
const CHILD_INSET = 4;
const BUTTON_RADIUS = 6;
const BAR_HEIGHTS = [0.35, 0.6, 0.45, 0.8, 0.5, 0.95];
// Text skeleton: bar width is a fraction of the block, chosen per block from its geometry (see `variation`).
const TEXT_WIDTH_RATIO = { min: 0.35, max: 0.7 };
const TEXT_MAX_WIDTH = 420;
const TEXT_TWO_LINE_MIN_HEIGHT = 44;
const TEXT_SECOND_LINE_RATIO = 0.6;
const TEXT_BAR_HEIGHT = 10;
const TEXT_LINE_GAP = 8;
// Table row skeleton: three cell segments, as fractions of the row's inner width.
const TABLE_CELLS = [
  { start: 0, width: 0.22 },
  { start: 0.3, width: 0.3 },
  { start: 0.7, width: 0.16 },
];
const TABLE_CELL_JITTER = 0.2; // a segment is up to this fraction shorter, per row
const VARIATION_STEPS = 8;
// Listview / Kanban skeleton: a panel of stacked row cards that stands in for the list's children.
const LIST_TYPES = /^(listview|kanban)$/i;
const LIST_PADDING = 16;
const LIST_ROW_HEIGHT = 56;
const LIST_ROW_GAP = 12;
const LIST_MAX_ROWS = 4;

type Palette = (typeof PALETTES)[WireframeTheme];
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const isFalse = (value: unknown): boolean =>
  value === false || (typeof value === 'string' && value.replace(/\s/g, '') === '{{false}}');

const isVisible = (component: DefinitionComponent): boolean =>
  !isFalse(component.properties?.visibility?.value) &&
  !isFalse(component.styles?.visibility?.value) &&
  !isFalse(component.displayPreferences?.showOnDesktop?.value);

const desktopLayout = (c: DefinitionComponent) => c.layouts?.find((l) => l.type === 'desktop');

const toBlock = (c: DefinitionComponent): WireframeBlock[] => {
  const layout = desktopLayout(c);
  return layout
    ? [{ type: c.type, top: layout.top, left: layout.left, width: layout.width, height: layout.height }]
    : [];
};

const byPosition = (a: WireframeBlock, b: WireframeBlock) => a.top - b.top || a.left - b.left;

// A child's `parent` is the parent's id, plus a suffix for some slots: `<tabsId>-<tabIndex>`, `<containerId>-header`.
// Returns the parent id when the child should be drawn: the whole of Tabs is not shown, only its first tab.
function resolveParentId(parent: string, topLevel: Map<string, DefinitionComponent>): string | undefined {
  if (topLevel.has(parent)) return topLevel.get(parent)?.type === 'Tabs' ? undefined : parent;
  const cut = parent.lastIndexOf('-');
  const parentId = parent.slice(0, cut);
  const suffix = parent.slice(cut + 1);
  const owner = cut > 0 ? topLevel.get(parentId) : undefined;
  if (!owner) return undefined;
  return owner.type === 'Tabs' && suffix !== '0' ? undefined : parentId;
}

export function extractHomeBlocks(definition: TemplateDefinition): WireframeBlock[] {
  const appV2 = definition.app[0].definition.appV2;
  const homePageId = appV2.appVersions?.[0]?.homePageId;
  const shown = (appV2.components ?? []).filter(
    (c) => c.pageId === homePageId && !MODAL_TYPES.has(c.type) && isVisible(c) && desktopLayout(c)
  );

  const topLevel = new Map<string, DefinitionComponent>();
  shown.filter((c) => !c.parent && c.id).forEach((c) => topLevel.set(c.id as string, c));

  const childrenOf = new Map<string, WireframeBlock[]>();
  shown.forEach((c) => {
    const parentId = c.parent ? resolveParentId(c.parent, topLevel) : undefined;
    if (parentId && !LIST_TYPES.test(topLevel.get(parentId)?.type ?? ''))
      childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), ...toBlock(c)]);
  });

  return shown
    .filter((c) => !c.parent)
    .flatMap((c) => {
      const children = (c.id && childrenOf.get(c.id)) || [];
      return toBlock(c).map((block) => (children.length ? { ...block, children: children.sort(byPosition) } : block));
    })
    .sort(byPosition);
}

export function accentColour(definition: TemplateDefinition, theme: WireframeTheme): string {
  const colour =
    definition.app[0].definition.appV2.appVersions?.[0]?.globalSettings?.theme?.definition?.brand?.colors?.primary?.[
      theme
    ];
  return typeof colour === 'string' && HEX_COLOUR.test(colour) ? colour : FALLBACK_ACCENT[theme];
}

const rect = (b: Box, attrs: string) =>
  `<rect x="${Math.round(b.x)}" y="${Math.round(b.y)}" width="${Math.round(Math.max(b.w, 0))}" height="${Math.round(
    Math.max(b.h, 0)
  )}" ${attrs}/>`;

const panel = (b: Box, p: Palette) => rect(b, `rx="8" fill="${p.surface}" stroke="${p.border}" stroke-width="2"`);

// Deterministic 0..1 value from a box's rounded position and width, so the same layout always draws the same bars.
const variation = (b: Box, salt = 0): number =>
  (Math.abs(Math.round(b.x) * 31 + Math.round(b.y) * 17 + Math.round(b.w) * 13 + salt * 7) % VARIATION_STEPS) /
  (VARIATION_STEPS - 1);

function textShape(b: Box, p: Palette): string {
  const ratio = TEXT_WIDTH_RATIO.min + variation(b) * (TEXT_WIDTH_RATIO.max - TEXT_WIDTH_RATIO.min);
  const first = Math.min(b.w * ratio, TEXT_MAX_WIDTH);
  const widths = b.h >= TEXT_TWO_LINE_MIN_HEIGHT ? [first, first * TEXT_SECOND_LINE_RATIO] : [first];
  const stack = widths.length * TEXT_BAR_HEIGHT + (widths.length - 1) * TEXT_LINE_GAP;
  return widths
    .map((w, i) =>
      rect(
        { x: b.x, y: b.y + (b.h - stack) / 2 + i * (TEXT_BAR_HEIGHT + TEXT_LINE_GAP), w, h: TEXT_BAR_HEIGHT },
        `rx="5" fill="${p.muted}"`
      )
    )
    .join('');
}

function listShape(b: Box, p: Palette): string {
  const rows = Math.max(
    0,
    Math.min(LIST_MAX_ROWS, Math.floor((b.h - 2 * LIST_PADDING + LIST_ROW_GAP) / (LIST_ROW_HEIGHT + LIST_ROW_GAP)))
  );
  const cards = Array.from({ length: rows }, (_, i) => {
    const row = {
      x: b.x + LIST_PADDING,
      y: b.y + LIST_PADDING + i * (LIST_ROW_HEIGHT + LIST_ROW_GAP),
      w: b.w - 2 * LIST_PADDING,
      h: LIST_ROW_HEIGHT,
    };
    const text = { x: row.x + LIST_PADDING, y: row.y, w: row.w - 2 * LIST_PADDING, h: row.h };
    return rect(row, `rx="8" fill="${p.background}" stroke="${p.border}" stroke-width="2"`) + textShape(text, p);
  });
  return panel(b, p) + cards.join('');
}

function tableShape(b: Box, p: Palette): string {
  const rows = Math.max(0, Math.min(6, Math.floor((b.h - 48) / 40)));
  const inner = b.w - 48;
  const lines = Array.from({ length: rows }, (_, i) => {
    const row = { x: b.x + 24, y: b.y + 56 + i * 40, w: inner, h: 8 };
    return TABLE_CELLS.map((cell, j) =>
      rect(
        {
          x: row.x + cell.start * inner,
          y: row.y,
          w: cell.width * inner * (1 - TABLE_CELL_JITTER * variation(row, i * TABLE_CELLS.length + j)),
          h: 8,
        },
        `rx="4" fill="${p.muted}"`
      )
    ).join('');
  });
  return (
    panel(b, p) + rect({ x: b.x + 24, y: b.y + 24, w: b.w * 0.3, h: 10 }, `rx="5" fill="${p.muted}"`) + lines.join('')
  );
}

function chartShape(b: Box, p: Palette, accent: string): string {
  const slot = (b.w - 48) / BAR_HEIGHTS.length;
  const bars = BAR_HEIGHTS.map((ratio, i) => {
    const h = (b.h - 48) * ratio;
    const opacity = i % 2 ? '0.6' : '0.35';
    return rect(
      { x: b.x + 24 + i * slot, y: b.y + b.h - 24 - h, w: slot * 0.6, h },
      `rx="4" fill="${accent}" fill-opacity="${opacity}"`
    );
  });
  return panel(b, p) + bars.join('');
}

function shapeFor(type: string, b: Box, p: Palette, accent: string): string {
  if (LIST_TYPES.test(type)) return listShape(b, p);
  if (/table/i.test(type)) return tableShape(b, p);
  if (/chart/i.test(type)) return chartShape(b, p, accent);
  if (/button/i.test(type)) return rect(b, `rx="${BUTTON_RADIUS}" fill="${accent}"`);
  if (/input|dropdown|select|picker|textarea/i.test(type))
    return rect(b, `rx="6" fill="${p.surface}" stroke="${p.border}" stroke-width="2"`);
  if (/^text$/i.test(type)) return textShape(b, p);
  return panel(b, p);
}

// Child boxes sit on the parent's 43-column grid, clipped to the parent's inner area. Null when nothing is left.
function childBox(child: WireframeBlock, parent: Box): Box | null {
  const columnWidth = parent.w / GRID_COLUMNS;
  const x = Math.max(parent.x + child.left * columnWidth, parent.x + CHILD_INSET);
  const y = Math.max(parent.y + child.top, parent.y + CHILD_INSET);
  const right = Math.min(parent.x + (child.left + child.width) * columnWidth, parent.x + parent.w - CHILD_INSET);
  const bottom = Math.min(parent.y + child.top + child.height, parent.y + parent.h - CHILD_INSET);
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}

export function renderWireframe(blocks: WireframeBlock[], theme: WireframeTheme, accent: string): string {
  const p = PALETTES[theme];
  const nested: Palette = { ...p, surface: p.background }; // panels inside a panel read as recessed
  const columnWidth = CANVAS_WIDTH / GRID_COLUMNS;
  const shapes = blocks
    .map((block) => {
      const box = {
        x: block.left * columnWidth,
        y: block.top + HEADER_HEIGHT,
        w: block.width * columnWidth,
        h: block.height,
      };
      const children = (block.children ?? []).flatMap((child) => {
        const inner = childBox(child, box);
        return inner ? [shapeFor(child.type, inner, nested, accent)] : [];
      });
      return shapeFor(block.type, box, p, accent) + children.join('');
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" preserveAspectRatio="xMidYMin slice">` +
    `<rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${p.background}"/>` +
    `<rect width="${CANVAS_WIDTH}" height="${HEADER_HEIGHT}" fill="${accent}"/>` +
    `<rect x="24" y="20" width="96" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.6"/>` +
    shapes +
    `</svg>\n`
  );
}
