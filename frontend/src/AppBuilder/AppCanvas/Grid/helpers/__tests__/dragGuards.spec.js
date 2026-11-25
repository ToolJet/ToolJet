import { CONFIG_HANDLE_CLASS, isDragFromConfigHandle } from '../dragGuards';

// Spelled out rather than imported from the module under test: the guard has to
// agree with the class ConfigHandle.jsx renders, and a test that builds its DOM
// from the module's own constant passes no matter what that constant says.
const RENDERED_CONFIG_HANDLE_CLASS = 'config-handle';

// Builds a detached DOM chain and returns it innermost-first, which is the
// order document.elementsFromPoint uses (topmost element, then its ancestors).
const elementsAtPoint = (...classChainOutermostFirst) => {
  const nodes = classChainOutermostFirst.map((className) => {
    const el = document.createElement('div');
    if (className) el.className = className;
    return el;
  });
  nodes.forEach((node, i) => {
    if (i > 0) nodes[i - 1].appendChild(node);
  });
  return nodes.reverse();
};

describe('isDragFromConfigHandle', () => {
  it('allows the drag when the pointer is over the config handle itself', () => {
    expect(isDragFromConfigHandle(elementsAtPoint('canvas-component', RENDERED_CONFIG_HANDLE_CLASS))).toBe(true);
  });

  it('allows the drag when the pointer is over the button nested in the config handle', () => {
    // ConfigHandle renders .config-handle > ConfigHandleButton (.config-handle-button
    // > button.badge). elementsFromPoint returns the ancestors too, so the
    // handle is in the list even when the badge is what's under the cursor.
    const elements = elementsAtPoint(
      'canvas-component',
      RENDERED_CONFIG_HANDLE_CLASS,
      'config-handle-button',
      'badge text-truncate'
    );

    expect(isDragFromConfigHandle(elements)).toBe(true);
  });

  it('blocks the drag when the pointer is over the widget body', () => {
    expect(isDragFromConfigHandle(elementsAtPoint('canvas-component', 'bounded-box relative'))).toBe(false);
  });

  it('blocks the drag when nothing is under the pointer', () => {
    expect(isDragFromConfigHandle([])).toBe(false);
    expect(isDragFromConfigHandle(undefined)).toBe(false);
  });

  it('does not accept handle-content, the class this guard used to look for', () => {
    // Removed from ConfigHandle.jsx in 84b8d29f49; the stale lookup it left
    // behind is what made BoundedBox and the range sliders undraggable.
    expect(isDragFromConfigHandle(elementsAtPoint('canvas-component', 'badge handle-content'))).toBe(false);
  });

  it('matches the class ConfigHandle actually renders', () => {
    expect(CONFIG_HANDLE_CLASS).toBe(RENDERED_CONFIG_HANDLE_CLASS);
  });
});
