import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import useStore from '@/AppBuilder/_stores/store';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function isModKey(key: string): boolean {
  return isMac ? key === 'Meta' : key === 'Control';
}

function isModPressed(event: MouseEvent | KeyboardEvent): boolean {
  return isMac ? event.metaKey : event.ctrlKey;
}

type RefKind = 'component' | 'query';

interface RefMatch {
  from: number;
  to: number;
  name: string;
  kind: RefKind;
}

/**
 * Regex to match `components.name[.prop]*` or `queries.name[.prop]*` references.
 * Group 1 = "components" or "queries", Group 2 = the name.
 */
const REF_REGEX = /(components|queries)\.([a-zA-Z_][a-zA-Z0-9_]*)(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;

const linkHoverMark = Decoration.mark({ class: 'cm-ref-link-hover' });

const setHoverEffect = StateEffect.define<RefMatch | null>();

/**
 * Find a component/query reference at a given document position.
 * Only checks the single line containing `pos` — O(line length).
 */
function refAtPos(view: EditorView, pos: number): RefMatch | null {
  if (pos < 0 || pos > view.state.doc.length) return null;
  const line = view.state.doc.lineAt(pos);
  REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = REF_REGEX.exec(line.text)) !== null) {
    const from = line.from + match.index;
    const to = from + match[0].length;
    if (pos >= from && pos <= to) {
      return {
        from,
        to,
        name: match[2],
        kind: match[1] === 'queries' ? 'query' : 'component',
      };
    }
  }
  return null;
}

/** Execute the navigation action for the given reference */
function navigateToRef(ref: RefMatch): void {
  const store = useStore.getState();
  if (ref.kind === 'component') {
    store.navigateToComponent(ref.name);
  } else {
    const queryId = store.getQueryIdFromName(ref.name);
    if (queryId) {
      store.queryPanel.setSelectedQuery(queryId);
      store.queryPanel.expandQueryPaneIfNeeded();
    }
  }
}

/**
 * CodeMirror ViewPlugin that:
 * 1. Underlines + colors the SINGLE `components.X.Y` or `queries.X.Y` reference
 *    under the cursor when Cmd (Mac) / Ctrl (Win/Linux) is held.
 * 2. Navigates to the component/query on Cmd/Ctrl + Click.
 *
 * Performance: never scans the full document. Only checks the line under the mouse
 * pointer and maintains at most one decoration range.
 */
const navigateRefPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    modKeyHeld = false;
    currentHover: RefMatch | null = null;
    private view: EditorView;
    private onKeyDown: (e: KeyboardEvent) => void;
    private onKeyUp: (e: KeyboardEvent) => void;
    private onWindowBlur: () => void;

    constructor(view: EditorView) {
      this.view = view;

      this.onKeyDown = (e: KeyboardEvent) => {
        if (isModKey(e.key) && !this.modKeyHeld) {
          this.modKeyHeld = true;
          this.syncDecoration();
        }
      };
      this.onKeyUp = (e: KeyboardEvent) => {
        if (isModKey(e.key) && this.modKeyHeld) {
          this.modKeyHeld = false;
          this.syncDecoration();
        }
      };
      this.onWindowBlur = () => {
        if (this.modKeyHeld) {
          this.modKeyHeld = false;
          this.syncDecoration();
        }
      };

      window.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('keyup', this.onKeyUp, true);
      window.addEventListener('blur', this.onWindowBlur);
    }

    destroy() {
      window.removeEventListener('keydown', this.onKeyDown, true);
      window.removeEventListener('keyup', this.onKeyUp, true);
      window.removeEventListener('blur', this.onWindowBlur);
    }

    syncDecoration() {
      const payload = this.modKeyHeld && this.currentHover ? this.currentHover : null;
      this.view.dispatch({ effects: setHoverEffect.of(payload) });
    }

    update(update: ViewUpdate) {
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(setHoverEffect)) {
            if (effect.value) {
              this.decorations = Decoration.set([
                linkHoverMark.range(effect.value.from, effect.value.to),
              ]);
            } else {
              this.decorations = Decoration.none;
            }
          }
        }
      }

      if (update.docChanged) {
        this.currentHover = null;
        if (this.decorations !== Decoration.none) {
          this.decorations = Decoration.none;
        }
      }
    }

    updateHoverFromMouse(view: EditorView, x: number, y: number) {
      const pos = view.posAtCoords({ x, y });
      const ref = pos !== null ? refAtPos(view, pos) : null;

      const prev = this.currentHover;
      if (ref?.from === prev?.from && ref?.to === prev?.to) return;

      this.currentHover = ref;
      if (this.modKeyHeld) {
        this.syncDecoration();
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      mousemove(this, event: MouseEvent, view: EditorView) {
        this.updateHoverFromMouse(view, event.clientX, event.clientY);
      },
      mouseleave(this, _event: MouseEvent, _view: EditorView) {
        if (this.currentHover) {
          this.currentHover = null;
          if (this.modKeyHeld) this.syncDecoration();
        }
      },
      mousedown(this, event: MouseEvent, view: EditorView) {
        if (!isModPressed(event)) return false;

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;

        const ref = refAtPos(view, pos);
        if (!ref) return false;

        event.preventDefault();
        event.stopPropagation();
        navigateToRef(ref);
        return true;
      },
    },
  }
);

/** Base theme — targets the decoration span AND child syntax-highlighting spans */
const navigateRefTheme = EditorView.baseTheme({
  '.cm-ref-link-hover, .cm-ref-link-hover *': {
    borderBottom: 'none',
    color: 'var(--primary-accent-strong, #4368E3) !important',
    cursor: 'pointer',
  },
  '.cm-ref-link-hover': {
    borderBottom: '1.5px solid var(--primary-accent-strong, #4368E3)',
    paddingBottom: '1px',
  },
});

/** Combined extension to enable Cmd/Ctrl+Click navigation to components and queries */
export const navigateToComponentExtension = [navigateRefPlugin, navigateRefTheme];
