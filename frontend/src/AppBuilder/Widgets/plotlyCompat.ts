/**
 * Plotly 2.x -> 4.x compatibility layer for the Chart widget.
 *
 * Plotly 4 dropped a set of attributes and features that 2.35 accepted. None of
 * the removals throw — Plotly silently ignores what it no longer understands, so
 * an app that used them keeps rendering while quietly losing the setting. For
 * `transforms` that means displaying rows the author meant to filter out.
 *
 * This module rewrites the legacy syntax into its modern equivalent before the
 * spec reaches Plotly, so apps authored against 2.x keep their behaviour.
 *
 * The deprecated-attribute list is not hand-written: it was extracted from the
 * `_deprecated` blocks in plotly.js 2.35.3's own source, so it covers every alias
 * 2.35 honoured rather than the subset anyone thought to look for.
 *
 * Anything that genuinely cannot be translated (the removed tile-map traces —
 * which are the vulnerable code the upgrade exists to remove) is reported in
 * `unsupported` so the widget can fail visibly instead of rendering blank.
 */

type Dict = Record<string, any>;

export interface PlotlyCompatResult {
  data: Dict[];
  layout: Dict;
  /** Legacy syntax that was rewritten. Informational. */
  warnings: string[];
  /** Cannot be translated — the caller should surface these to the user. */
  unsupported: string[];
}

const isObj = (v: any): v is Dict => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * The spec we are handed comes from resolved store values, so it is rewritten on
 * a copy rather than in place. `structuredClone` avoids the JSON round-trip the
 * frontend conventions warn about; the fallback is only for older runtimes.
 */
const clone = <T>(value: T): T =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

/**
 * Trace types removed in plotly 4, mapped to their replacement.
 *
 * The `*mapbox` traces are the swap plotly's own v4 release notes prescribe:
 * "Remove scattermapbox, choroplethmapbox, densitymapbox trace types... users
 * should switch to equivalent *map traces instead". Both names exist in 2.35 and
 * take the same attributes, and `layout.map.style` accepts the same values as
 * `layout.mapbox.style` did, so the rename is behaviour-preserving.
 *
 * These render through the maplibre bundled in plotly 4.1.1, which is 6.9.0 —
 * the version that patches GHSA-jrc7-96c5-q579. Keeping map charts working does
 * not reintroduce the vulnerability.
 */
const TRACE_REPLACEMENTS: Record<string, string> = {
  pointcloud: 'scattergl',
  heatmapgl: 'heatmap',
  scattermapbox: 'scattermap',
  choroplethmapbox: 'choroplethmap',
  densitymapbox: 'densitymap',
};

/**
 * Containers that accepted a deprecated string `title` / `titlefont` pair.
 * Paths are resolved leniently — a missing branch is skipped.
 */
const LAYOUT_TITLE_PATHS = [
  [],
  ['coloraxis', 'colorbar'],
  ['scene', 'xaxis'],
  ['scene', 'yaxis'],
  ['scene', 'zaxis'],
  ['polar', 'radialaxis'],
  ['polar', 'angularaxis'],
  ['ternary', 'aaxis'],
  ['ternary', 'baxis'],
  ['ternary', 'caxis'],
  ['smith', 'realaxis'],
  ['smith', 'imaginaryaxis'],
];

const TRACE_TITLE_PATHS = [[], ['marker', 'colorbar'], ['colorbar'], ['aaxis'], ['baxis']];

function at(root: Dict, path: string[]): Dict | undefined {
  let node: any = root;
  for (const key of path) {
    if (!isObj(node)) return undefined;
    node = node[key];
  }
  return isObj(node) ? node : undefined;
}

/**
 * `title: "text"` -> `title: { text: "text" }`, plus the companion attributes
 * (`titlefont`, `titleside`, `titleposition`, `titleoffset`) that moved inside it.
 */
function migrateTitle(container: Dict | undefined, warnings: string[], where: string): void {
  if (!container) return;

  const hasLegacyCompanion =
    container.titlefont !== undefined ||
    container.titleside !== undefined ||
    container.titleposition !== undefined ||
    container.titleoffset !== undefined;

  if (typeof container.title === 'string' || typeof container.title === 'number') {
    container.title = { text: String(container.title) };
    warnings.push(`${where}: title given as text, rewritten to { text }`);
  } else if (hasLegacyCompanion && !isObj(container.title)) {
    container.title = {};
  }

  if (!isObj(container.title)) return;

  if (container.titlefont !== undefined) {
    if (container.title.font === undefined) container.title.font = container.titlefont;
    delete container.titlefont;
    warnings.push(`${where}: titlefont rewritten to title.font`);
  }
  if (container.titleside !== undefined) {
    if (container.title.side === undefined) container.title.side = container.titleside;
    delete container.titleside;
    warnings.push(`${where}: titleside rewritten to title.side`);
  }
  if (container.titleposition !== undefined) {
    if (container.title.position === undefined) container.title.position = container.titleposition;
    delete container.titleposition;
    warnings.push(`${where}: titleposition rewritten to title.position`);
  }
  if (container.titleoffset !== undefined) {
    if (container.title.offset === undefined) container.title.offset = container.titleoffset;
    delete container.titleoffset;
    warnings.push(`${where}: titleoffset rewritten to title.offset`);
  }
}

/** Plotly's default colorway, used to resolve an unset error-bar colour. */
const DEFAULT_COLORWAY = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

/**
 * Swap a trace's x/y pair, mirroring plotly 2.35's `swapXYData`. `bardir: "h"`
 * did this on the caller's behalf; plotly 4 dropped `bardir` entirely, so
 * translating it to `orientation` alone would silently transpose the chart.
 */
function swapXYData(trace: Dict): void {
  const swap = (a: string, b: string) => {
    const hasA = a in trace;
    const hasB = b in trace;
    if (!hasA && !hasB) return;
    const tmp = trace[a];
    if (hasB) trace[a] = trace[b];
    else delete trace[a];
    if (hasA) trace[b] = tmp;
    else delete trace[b];
  };

  for (const pattern of ['?', '?0', 'd?', '?bins', 'nbins?', 'autobin?', '?src', 'error_?']) {
    swap(pattern.replace('?', 'x'), pattern.replace('?', 'y'));
  }

  if (Array.isArray(trace.z) && Array.isArray(trace.z[0])) {
    if (trace.transpose) delete trace.transpose;
    else trace.transpose = true;
  }

  if (isObj(trace.error_x) && isObj(trace.error_y)) {
    const errorY = trace.error_y;
    const copyYstyle =
      'copy_ystyle' in errorY ? errorY.copy_ystyle : !(errorY.color || errorY.thickness || errorY.width);
    const swapErr = (key: string) => {
      const ex = trace.error_x as Dict;
      const ey = trace.error_y as Dict;
      const tmp = ex[key];
      if (key in ey) ex[key] = ey[key];
      else delete ex[key];
      if (tmp !== undefined) ey[key] = tmp;
      else delete ey[key];
    };
    swapErr('copy_ystyle');
    if (copyYstyle) ['color', 'thickness', 'width'].forEach(swapErr);
  }

  if (typeof trace.hoverinfo === 'string') {
    trace.hoverinfo = trace.hoverinfo
      .split('+')
      .map((p: string) => (p === 'x' ? 'y' : p === 'y' ? 'x' : p))
      .join('+');
  }
}

/**
 * `error_y.opacity` was folded into the alpha of `error_y.color` by plotly 2.35.
 * Plotly 4 drops the attribute, so the error bars render fully opaque.
 */
function mergeErrorOpacity(trace: Dict, index: number, tinycolor: any, warnings: string[]): void {
  const errorY = trace.error_y;
  if (!isObj(errorY) || errorY.opacity === undefined) return;
  const base = errorY.color || (trace.type === 'bar' ? '#444' : DEFAULT_COLORWAY[index % DEFAULT_COLORWAY.length]);
  try {
    const c = tinycolor(base);
    if (c && c.isValid && c.isValid()) {
      c.setAlpha(c.getAlpha() * Number(errorY.opacity));
      errorY.color = c.toRgbString();
      warnings.push('trace: error_y.opacity folded into error_y.color');
    }
  } catch (_e) {
    /* leave the colour as-is */
  }
  delete errorY.opacity;
}

/**
 * `hsv()` / `hsva()` colour strings. Plotly 4 swapped tinycolor for culori,
 * which does not parse them. Converted to hex/rgba so they survive.
 */
function convertHsvStrings(node: any, warnings: string[], tinycolor: any): void {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      if (typeof v === 'string' && /^hsva?\(/i.test(v)) {
        node[i] = hsvToCss(v, tinycolor, warnings);
      } else if (isObj(v) || Array.isArray(v)) {
        convertHsvStrings(v, warnings, tinycolor);
      }
    }
    return;
  }
  if (!isObj(node)) return;
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (typeof v === 'string' && /^hsva?\(/i.test(v)) {
      node[key] = hsvToCss(v, tinycolor, warnings);
    } else if (isObj(v) || Array.isArray(v)) {
      convertHsvStrings(v, warnings, tinycolor);
    }
  }
}

function hsvToCss(value: string, tinycolor: any, warnings: string[]): string {
  try {
    const c = tinycolor(value);
    if (c && c.isValid && c.isValid()) {
      const converted = c.getAlpha() < 1 ? c.toRgbString() : c.toHexString();
      warnings.push(`hsv() colour "${value}" converted to "${converted}"`);
      return converted;
    }
  } catch (_e) {
    /* fall through — leave the original value alone */
  }
  return value;
}

/* ------------------------------------------------------------------ *
 * transforms — removed wholesale in plotly 4, reimplemented here.
 * ------------------------------------------------------------------ */

/** Trace attributes that are per-point arrays and must stay index-aligned. */
const ARRAY_ATTR_PATHS = [
  ['x'],
  ['y'],
  ['z'],
  ['lat'],
  ['lon'],
  ['values'],
  ['labels'],
  ['locations'],
  ['text'],
  ['hovertext'],
  ['customdata'],
  ['ids'],
  ['base'],
  ['width'],
  ['offset'],
  ['marker', 'color'],
  ['marker', 'size'],
  ['marker', 'opacity'],
  ['marker', 'line', 'color'],
  ['marker', 'line', 'width'],
  ['line', 'color'],
  ['error_x', 'array'],
  ['error_y', 'array'],
];

function readPath(obj: Dict, path: string[]): any {
  let node: any = obj;
  for (const key of path) {
    if (node === null || node === undefined) return undefined;
    node = node[key];
  }
  return node;
}

function writePath(obj: Dict, path: string[], value: any): void {
  let node: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!isObj(node[path[i]])) node[path[i]] = {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
}

/** Reindex every per-point array on the trace using `indices`. */
function selectIndices(trace: Dict, indices: number[], length: number): void {
  for (const path of ARRAY_ATTR_PATHS) {
    const arr = readPath(trace, path);
    if (Array.isArray(arr) && arr.length === length) {
      writePath(
        trace,
        path,
        indices.map((i) => arr[i])
      );
    }
  }
}

/** Resolve a transform `target`: an attribute name, or an inline array. */
function resolveTarget(trace: Dict, target: any): any[] | undefined {
  if (Array.isArray(target)) return target;
  if (typeof target === 'string') {
    const v = readPath(trace, target.split('.'));
    return Array.isArray(v) ? v : undefined;
  }
  return undefined;
}

const FILTER_OPS: Record<string, (v: any, ref: any) => boolean> = {
  '=': (v, r) => (Array.isArray(r) ? r.includes(v) : v === r),
  '!=': (v, r) => (Array.isArray(r) ? !r.includes(v) : v !== r),
  '<': (v, r) => v < r,
  '<=': (v, r) => v <= r,
  '>': (v, r) => v > r,
  '>=': (v, r) => v >= r,
  '[]': (v, r) => v >= r[0] && v <= r[1],
  '()': (v, r) => v > r[0] && v < r[1],
  '[)': (v, r) => v >= r[0] && v < r[1],
  '(]': (v, r) => v > r[0] && v <= r[1],
  '][': (v, r) => v <= r[0] || v >= r[1],
  ')(': (v, r) => v < r[0] || v > r[1],
  '](': (v, r) => v <= r[0] || v > r[1],
  ')[': (v, r) => v < r[0] || v >= r[1],
  '{}': (v, r) => (Array.isArray(r) ? r.includes(v) : v === r),
  '}{': (v, r) => (Array.isArray(r) ? !r.includes(v) : v !== r),
};

const AGG_FUNCS: Record<string, (vals: any[], agg?: Dict) => any> = {
  count: (v) => v.length,
  sum: (v) => v.reduce((a: number, b: any) => a + Number(b || 0), 0),
  avg: (v) => (v.length ? v.reduce((a: number, b: any) => a + Number(b || 0), 0) / v.length : null),
  min: (v) => (v.length ? Math.min(...v.map(Number)) : null),
  max: (v) => (v.length ? Math.max(...v.map(Number)) : null),
  first: (v) => (v.length ? v[0] : null),
  last: (v) => (v.length ? v[v.length - 1] : null),
  range: (v) => (v.length ? Math.max(...v.map(Number)) - Math.min(...v.map(Number)) : null),
  median: (v) => {
    if (!v.length) return null;
    const s = v.map(Number).sort((a, b) => a - b);
    const mid = (s.length - 1) / 2;
    return (s[Math.floor(mid)] + s[Math.ceil(mid)]) / 2;
  },
  // `mode` returns the first value to reach the maximum count, matching plotly.
  mode: (v) => {
    const counts = new Map<any, number>();
    let maxCount = 0;
    let out: any = null;
    for (const item of v) {
      const next = (counts.get(item) ?? 0) + 1;
      counts.set(item, next);
      if (next > maxCount) {
        maxCount = next;
        out = item;
      }
    }
    return maxCount ? out : null;
  },
  rms: (v) => (v.length ? Math.sqrt(v.reduce((a: number, b: any) => a + Number(b) ** 2, 0) / v.length) : null),
  change: (v) => (v.length ? Number(v[v.length - 1]) - Number(v[0]) : null),
  // Plotly's `funcmode` defaults to 'sample', normalising by N-1 rather than N.
  stddev: (v, agg) => {
    if (!v.length) return null;
    const n = v.map(Number);
    const mean = n.reduce((a, b) => a + b, 0) / n.length;
    const norm = (agg?.funcmode ?? 'sample') === 'sample' ? n.length - 1 : n.length;
    return norm > 0 ? Math.sqrt(n.reduce((a, b) => a + (b - mean) ** 2, 0) / norm) : 0;
  },
};

function traceLength(trace: Dict): number {
  for (const path of ARRAY_ATTR_PATHS) {
    const arr = readPath(trace, path);
    if (Array.isArray(arr)) return arr.length;
  }
  return 0;
}

/**
 * Apply one trace's `transforms` chain, returning the resulting traces.
 * `groupby` fans one trace out into several, so this returns an array.
 */
function applyTransforms(trace: Dict, warnings: string[], unsupported: string[]): Dict[] {
  const transforms = trace.transforms;
  delete trace.transforms;
  if (!Array.isArray(transforms) || !transforms.length) return [trace];

  let traces = [trace];

  for (const tr of transforms) {
    if (!isObj(tr) || tr.enabled === false) continue;
    const type = tr.type;

    if (type === 'filter') {
      traces = traces.map((t) => {
        const len = traceLength(t);
        const target = resolveTarget(t, tr.target);
        if (!target) return t;
        const op = FILTER_OPS[tr.operation || '='];
        if (!op) {
          unsupported.push(`transform filter: unsupported operation "${tr.operation}"`);
          return t;
        }
        const keep: number[] = [];
        for (let i = 0; i < len; i++) if (op(target[i], tr.value)) keep.push(i);
        selectIndices(t, keep, len);
        return t;
      });
      warnings.push('transform: filter applied in the widget (removed from Plotly in v4)');
    } else if (type === 'sort') {
      traces = traces.map((t) => {
        const len = traceLength(t);
        const target = resolveTarget(t, tr.target);
        if (!target) return t;
        const order = tr.order === 'descending' ? -1 : 1;
        const idx = Array.from({ length: len }, (_, i) => i).sort((a, b) => {
          const va = target[a];
          const vb = target[b];
          if (va === vb) return 0;
          return (va > vb ? 1 : -1) * order;
        });
        selectIndices(t, idx, len);
        return t;
      });
      warnings.push('transform: sort applied in the widget (removed from Plotly in v4)');
    } else if (type === 'aggregate') {
      traces = traces.map((t) => {
        const len = traceLength(t);
        const groups = resolveTarget(t, tr.groups);
        if (!groups) return t;

        const order: any[] = [];
        const buckets = new Map<any, number[]>();
        for (let i = 0; i < len; i++) {
          const g = groups[i];
          if (!buckets.has(g)) {
            buckets.set(g, []);
            order.push(g);
          }
          buckets.get(g)!.push(i);
        }

        const aggregations = Array.isArray(tr.aggregations) ? tr.aggregations : [];
        const aggregatedPaths = new Set<string>();

        for (const agg of aggregations) {
          if (!isObj(agg) || agg.enabled === false) continue;
          const path = String(agg.target || '').split('.');
          const src = readPath(t, path);
          if (!Array.isArray(src)) continue;
          const fn = AGG_FUNCS[agg.func || 'first'];
          if (!fn) {
            unsupported.push(`transform aggregate: unsupported function "${agg.func}"`);
            continue;
          }
          writePath(
            t,
            path,
            order.map((g) =>
              fn(
                buckets.get(g)!.map((i) => src[i]),
                agg
              )
            )
          );
          aggregatedPaths.add(path.join('.'));
        }

        // Non-aggregated arrays collapse to the first value in each group,
        // matching plotly's own behaviour.
        for (const path of ARRAY_ATTR_PATHS) {
          const key = path.join('.');
          if (aggregatedPaths.has(key)) continue;
          const arr = readPath(t, path);
          if (Array.isArray(arr) && arr.length === len) {
            writePath(
              t,
              path,
              order.map((g) => arr[buckets.get(g)![0]])
            );
          }
        }
        return t;
      });
      warnings.push('transform: aggregate applied in the widget (removed from Plotly in v4)');
    } else if (type === 'groupby') {
      const next: Dict[] = [];
      for (const t of traces) {
        const len = traceLength(t);
        const groups = resolveTarget(t, tr.groups);
        if (!groups) {
          next.push(t);
          continue;
        }
        const order: any[] = [];
        const buckets = new Map<any, number[]>();
        for (let i = 0; i < len; i++) {
          const g = groups[i];
          if (!buckets.has(g)) {
            buckets.set(g, []);
            order.push(g);
          }
          buckets.get(g)!.push(i);
        }
        const styles = Array.isArray(tr.styles) ? tr.styles : [];
        for (const g of order) {
          const groupTrace = clone(t);
          selectIndices(groupTrace, buckets.get(g)!, len);
          groupTrace.name = String(g);
          const style = styles.find((s: Dict) => isObj(s) && s.target === g);
          if (style && isObj(style.value)) Object.assign(groupTrace, style.value);
          next.push(groupTrace);
        }
      }
      traces = next;
      warnings.push('transform: groupby applied in the widget (removed from Plotly in v4)');
    } else {
      unsupported.push(`transform: unsupported type "${type}"`);
    }
  }

  return traces;
}

/* ------------------------------------------------------------------ */

/**
 * Rewrite a Plotly 2.x spec so it behaves the same under Plotly 4.
 *
 * Does not mutate the caller's objects — the spec is deep-cloned first.
 */
export function applyPlotlyCompat(data: any, layout: any, tinycolor: any): PlotlyCompatResult {
  const warnings: string[] = [];
  const unsupported: string[] = [];

  let traces: Dict[] = Array.isArray(data) ? clone(data) : [];
  const nextLayout: Dict = isObj(layout) ? clone(layout) : {};

  /* ---- layout ---- */

  for (const path of LAYOUT_TITLE_PATHS) {
    migrateTitle(at(nextLayout, path), warnings, `layout${path.length ? '.' + path.join('.') : ''}`);
  }

  // Cartesian axes (xaxis, yaxis, xaxis2, ...) are not handled here: Chart.jsx
  // builds those itself and normalises the author's values as it merges them.

  if (Array.isArray(nextLayout.annotations)) {
    for (const ann of nextLayout.annotations) {
      if (!isObj(ann) || ann.ref === undefined) continue;
      if (ann.xref === undefined) ann.xref = ann.ref;
      if (ann.yref === undefined) ann.yref = ann.ref;
      delete ann.ref;
      warnings.push('layout.annotations: ref rewritten to xref/yref');
    }
  }

  // The `mapbox` subplot became `map` alongside the trace rename. Numbered
  // subplots (mapbox2, mapbox3, ...) follow the same pattern.
  for (const key of Object.keys(nextLayout)) {
    const match = /^mapbox(\d*)$/.exec(key);
    if (!match) continue;
    const target = `map${match[1]}`;
    if (nextLayout[target] === undefined) nextLayout[target] = nextLayout[key];
    delete nextLayout[key];
    warnings.push(`layout.${key} renamed to layout.${target}`);
  }

  if (nextLayout.hidesources !== undefined) delete nextLayout.hidesources;

  /* ---- traces ---- */

  const expanded: Dict[] = [];
  for (const original of traces) {
    if (!isObj(original)) continue;
    let trace = original;

    if (TRACE_REPLACEMENTS[trace.type]) {
      const replacement = TRACE_REPLACEMENTS[trace.type];
      warnings.push(`trace type "${trace.type}" replaced with "${replacement}"`);
      trace.type = replacement;
      if (replacement === 'scattergl' && trace.mode === undefined) trace.mode = 'markers';
    }

    // A map trace points at its subplot by name, which was renamed with it.
    if (typeof trace.subplot === 'string' && /^mapbox\d*$/.test(trace.subplot)) {
      trace.subplot = trace.subplot.replace(/^mapbox/, 'map');
    }

    // Mirrors plotly 2.35's cleanData: bardir:"h" on a bar/histogram set the
    // orientation AND swapped the data axes. Translating to `orientation`
    // without the swap would transpose the chart.
    if (trace.bardir !== undefined) {
      const isBarLike = trace.type === 'bar' || String(trace.type || '').slice(0, 9) === 'histogram';
      if (trace.bardir === 'h' && isBarLike) {
        trace.orientation = 'h';
        swapXYData(trace);
        warnings.push('trace: bardir rewritten to orientation (with axis swap, as in Plotly 2.x)');
      }
      delete trace.bardir;
    }

    mergeErrorOpacity(trace, expanded.length, tinycolor, warnings);

    if (trace.stream !== undefined) delete trace.stream;

    for (const path of TRACE_TITLE_PATHS) {
      migrateTitle(at(trace, path), warnings, `trace${path.length ? '.' + path.join('.') : ''}`);
    }

    expanded.push(...applyTransforms(trace, warnings, unsupported));
  }
  traces = expanded;

  convertHsvStrings(traces, warnings, tinycolor);
  convertHsvStrings(nextLayout, warnings, tinycolor);

  // Plotly 4 changed two defaults rather than removing anything, so a spec that
  // never mentioned these attributes still renders differently. Pin the 2.x
  // values unless the author chose one. (Listed in the v4.0.0 release notes;
  // a schema diff does not surface them, because the attributes still exist.)
  if (traces.some((t) => t.type === 'splom')) {
    for (const key of Object.keys(nextLayout)) {
      if (!/^[xy]axis\d*$/.test(key) || !isObj(nextLayout[key])) continue;
      if (nextLayout[key].matches === undefined) {
        nextLayout[key].matches = false;
        warnings.push(`layout.${key}: matches pinned to false (v4 defaults splom axes to matched)`);
      }
    }
  }

  const hasGeoTrace = traces.some((t) => t.type === 'scattergeo' || t.type === 'choropleth');
  if ((hasGeoTrace || isObj(nextLayout.geo)) && !isObj(nextLayout.geo)) nextLayout.geo = {};
  if (isObj(nextLayout.geo) && nextLayout.geo.fitbounds === undefined) {
    nextLayout.geo.fitbounds = false;
    warnings.push('layout.geo: fitbounds pinned to false (v4 defaults it to "locations")');
  }

  return {
    data: traces,
    layout: nextLayout,
    warnings: Array.from(new Set(warnings)),
    unsupported: Array.from(new Set(unsupported)),
  };
}
