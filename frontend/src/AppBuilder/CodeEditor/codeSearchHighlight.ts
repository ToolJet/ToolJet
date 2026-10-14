import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, StateEffect } from '@codemirror/state';
import useStore from '@/AppBuilder/_stores/store';
import type { CodeSearchState } from '@/AppBuilder/_stores/slices/codeSearchSlice';
import { buildMatcher, MIN_TERM_LENGTH } from '@/AppBuilder/LeftSidebar/CodeSearch/searchRecords';

// Marks every match of the code search term in this editor while the Code search panel is open,
// so a jump lands on a field whose matches are all visible at a glance.
const matchMark = Decoration.mark({ class: 'tj-code-search-match' });
const refresh = StateEffect.define<null>();

// The store fields this plugin reads.
type HighlightState = CodeSearchState & { isSidebarOpen: boolean; selectedSidebarItem: string };

const activeMatcher = (state: HighlightState): RegExp | null => {
  const { term, options } = state.codeSearch;
  const panelOpen = state.isSidebarOpen && state.selectedSidebarItem === 'search';
  if (!panelOpen || !term || term.length < MIN_TERM_LENGTH) return null;
  // Highlighting runs on the main thread, where a backtracking regex (`(a+)+$`) would freeze the
  // editor; regex matching only runs in the code-search worker, which can be terminated.
  if (options.regex) return null;
  return buildMatcher(term, options).matcher || null;
};

const buildDecorations = (view: EditorView, matcher: RegExp | null): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  if (!matcher) return builder.finish();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    matcher.lastIndex = 0;
    let hit;
    while ((hit = matcher.exec(text)) !== null) {
      if (hit[0] === '') {
        matcher.lastIndex++;
        continue;
      }
      builder.add(from + hit.index, from + hit.index + hit[0].length, matchMark);
    }
  }
  return builder.finish();
};

// ponytail: one store subscription per mounted editor (tens in the Inspector); move to a single
// shared subscription if editor counts grow large.
export const codeSearchHighlight = ViewPlugin.fromClass(
  class {
    matcher: RegExp | null;
    decorations: DecorationSet;
    unsubscribe: () => void;

    constructor(view: EditorView) {
      this.matcher = activeMatcher(useStore.getState());
      this.decorations = buildDecorations(view, this.matcher);
      this.unsubscribe = useStore.subscribe((state: HighlightState, previous: HighlightState) => {
        const changed =
          state.codeSearch !== previous.codeSearch ||
          state.isSidebarOpen !== previous.isSidebarOpen ||
          state.selectedSidebarItem !== previous.selectedSidebarItem;
        if (!changed) return;
        this.matcher = activeMatcher(state);
        // Defer: the store can update while another editor is mid-dispatch.
        queueMicrotask(() => view.dom.isConnected && view.dispatch({ effects: refresh.of(null) }));
      });
    }

    update(update: ViewUpdate) {
      const refreshed = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(refresh)));
      if (refreshed || update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view, this.matcher);
      }
    }

    destroy() {
      this.unsubscribe();
    }
  },
  { decorations: (plugin) => plugin.decorations }
);
