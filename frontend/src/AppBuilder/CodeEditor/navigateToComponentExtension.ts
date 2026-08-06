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

/**
 * Regex to match full `components.componentName.property.subProperty` references.
 * Captures the component name (group 1).
 */
const COMPONENT_REF_REGEX = /components\.([a-zA-Z_][a-zA-Z0-9_]*)(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;

const linkHoverMark = Decoration.mark({ class: 'cm-component-link-hover' });

/** Payload for the combined state effect */
interface HoverState {
  modKeyHeld: boolean;
  from: number;
  to: number;
  componentName: string;
}

const setHoverEffect = StateEffect.define<HoverState | null>();

/**
 * Find the component reference range at a given document position.
 * Returns { from, to, componentName } or null. Only checks the single line
 * containing `pos` — O(line length), not O(document).
 */
function componentRefAtPos(view: EditorView, pos: number): { from: number; to: number; componentName: string } | null {
  if (pos < 0 || pos > view.state.doc.length) return null;
  const line = view.state.doc.lineAt(pos);
  COMPONENT_REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = COMPONENT_REF_REGEX.exec(line.text)) !== null) {
    const from = line.from + match.index;
    const to = from + match[0].length;
    if (pos >= from && pos <= to) {
      return { from, to, componentName: match[1] };
    }
  }
  return null;
}

/**
 * CodeMirror ViewPlugin that:
 * 1. Underlines + colors only the SINGLE `components.X.Y` reference under the cursor
 *    when Cmd (Mac) / Ctrl (Win/Linux) is held — just like VS Code "Go to Definition".
 * 2. Navigates to the component on Cmd/Ctrl + Click.
 *
 * Performance: never scans the full document. Only checks the line under the mouse
 * pointer and maintains at most one decoration range.
 */
const navigateToComponentPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    modKeyHeld = false;
    currentHover: { from: number; to: number; componentName: string } | null = null;
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

    /** Dispatch an effect so CodeMirror re-reads decorations */
    syncDecoration() {
      const payload =
        this.modKeyHeld && this.currentHover
          ? { modKeyHeld: true, ...this.currentHover }
          : null;
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

      // If the document changed, the stored hover range may be stale
      if (update.docChanged) {
        this.currentHover = null;
        if (this.decorations !== Decoration.none) {
          this.decorations = Decoration.none;
        }
      }
    }

    /** Update hover from mouse coordinates (called on mousemove) */
    updateHoverFromMouse(view: EditorView, x: number, y: number) {
      const pos = view.posAtCoords({ x, y });
      const ref = pos !== null ? componentRefAtPos(view, pos) : null;

      // Only dispatch if the hovered reference actually changed
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

        const ref = componentRefAtPos(view, pos);
        if (!ref) return false;

        event.preventDefault();
        event.stopPropagation();
        useStore.getState().navigateToComponent(ref.componentName);
        return true;
      },
    },
  }
);

/** Base theme — only applied to the single hovered reference.
 *  Targets both the decoration span AND any child syntax-highlighting spans
 *  so the color override applies regardless of CodeMirror's token nesting. */
const navigateToComponentTheme = EditorView.baseTheme({
  '.cm-component-link-hover, .cm-component-link-hover *': {
    borderBottom: 'none',
    color: 'var(--primary-accent-strong, #4368E3) !important',
    cursor: 'pointer',
  },
  '.cm-component-link-hover': {
    borderBottom: '1.5px solid var(--primary-accent-strong, #4368E3)',
    paddingBottom: '1px',
  },
});

/** Combined extension to enable Cmd/Ctrl+Click navigation to components */
export const navigateToComponentExtension = [navigateToComponentPlugin, navigateToComponentTheme];
