import React from 'react';
import { createPortal } from 'react-dom';
import { render, act, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// C-04: a page switch leaked ~135 listeners per pack widget mount. Chrome's constructed stylesheet holds every shadow
// root that adopted it, so an unmounted widget's root stayed alive with its tj-cc-root (React puts its ~140 delegated
// listeners on every portal container), and a pack cache keyed by the root (Ant icons) kept the whole old page through
// root.host. jsdom has no constructed sheets: they are stubbed here the way Chrome exposes them.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve('.x{color:red}')),
}));

const Popup = ({ text = 'badge' }) => {
  const ref = React.useRef(null);
  const [overlay, setOverlay] = React.useState(null);
  React.useLayoutEffect(() => setOverlay(ref.current.getRootNode().tjOverlay ?? null), []);
  return (
    <span ref={ref} data-testid="inner">
      {text}
      {overlay && createPortal(<div data-testid="popup">menu</div>, overlay)}
    </span>
  );
};

const props = (cacheKey) => ({
  bundleUrl: 'bundle.js',
  cssUrl: 'bundle.css',
  cacheKey,
  componentName: 'Popup',
  componentProps: {},
  componentStyles: {},
  renderSlot: () => null,
  setExposedVariable: jest.fn(),
  fireEvent: jest.fn(),
  actions: new Map(),
  dataCy: 'pop1',
  light: <i data-testid="light">light</i>,
});

const mountWidget = async (cacheKey) => {
  const view = render(<InlineLibraryComponent {...props(cacheKey)} />);
  const host = view.container.querySelector('[data-cy="pop1"]');
  await waitFor(() => expect(host.shadowRoot.querySelector('[data-testid="popup"]')).toBeNull());
  await waitFor(() => expect(document.querySelector('.tj-cc-popup-host').shadowRoot.textContent).toContain('menu'));
  return { ...view, host, root: host.shadowRoot };
};

beforeEach(() => {
  loadLibraryModule.mockReset();
  loadLibraryModule.mockResolvedValue({ Popup });
});

describe('pack host teardown', () => {
  describe('with constructed stylesheets (Chrome)', () => {
    const hadReplaceSync = 'replaceSync' in CSSStyleSheet.prototype;
    const hadAdopted = 'adoptedStyleSheets' in Document.prototype;
    beforeAll(() => {
      if (!hadReplaceSync)
        CSSStyleSheet.prototype.replaceSync = function replaceSync(text) {
          this.__text = text;
        };
      if (!hadAdopted) {
        const prop = {
          configurable: true,
          get() {
            return this.__adopted ?? [];
          },
          set(list) {
            this.__adopted = list;
          },
        };
        Object.defineProperty(Document.prototype, 'adoptedStyleSheets', prop);
        Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', prop);
      }
    });
    afterAll(() => {
      if (!hadReplaceSync) delete CSSStyleSheet.prototype.replaceSync;
      if (!hadAdopted) {
        delete Document.prototype.adoptedStyleSheets;
        delete ShadowRoot.prototype.adoptedStyleSheets;
      }
    });

    it('drops the shared sheets from the widget root and the popup layer on unmount', async () => {
      const { root, unmount } = await mountWidget('teardown|adopt');
      const layerRoot = document.querySelector('.tj-cc-popup-host').shadowRoot;
      expect(root.adoptedStyleSheets).toHaveLength(3);
      expect(layerRoot.adoptedStyleSheets).toHaveLength(3);
      unmount();
      expect(root.adoptedStyleSheets).toEqual([]);
      expect(layerRoot.adoptedStyleSheets).toEqual([]);
    });

    // PERF-02 (Codex): each mount handed the same library CSS to the shared sheet, which re-parsed it every time (Ant's
    // is close to 1 MB: about 35 million characters per page switch on a 37-widget page).
    it("parses a revision's library CSS once across mounts, and again only when it changes", async () => {
      const { loadLibraryCss } = jest.requireMock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
      const real = CSSStyleSheet.prototype.replaceSync;
      const parsed = [];
      CSSStyleSheet.prototype.replaceSync = function replaceSync(text) {
        if (text === '.x{color:red}' || text === '.x{color:blue}') parsed.push(text);
        return real.call(this, text);
      };
      try {
        for (let i = 0; i < 3; i += 1) {
          const { unmount } = await mountWidget('teardown|parse-once');
          await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
          unmount();
        }
        expect(parsed).toEqual(['.x{color:red}']);
        loadLibraryCss.mockImplementationOnce(() => Promise.resolve('.x{color:blue}'));
        const { unmount } = await mountWidget('teardown|parse-once');
        await waitFor(() => expect(parsed).toEqual(['.x{color:red}', '.x{color:blue}']));
        unmount();
      } finally {
        CSSStyleSheet.prototype.replaceSync = real;
      }
    });
  });

  it('leaves a kept widget root empty, without the overlay, and cuts its host out of the old page', async () => {
    const { host, root, unmount } = await mountWidget('teardown|fallback');
    const layerHost = document.querySelector('.tj-cc-popup-host');
    expect(root.querySelector('.tj-cc-root')).not.toBeNull();
    expect(root.querySelectorAll('style[data-tj-sheet]')).toHaveLength(3);
    expect(host.querySelector('[data-testid="light"]')).not.toBeNull();
    unmount();
    expect(root.childNodes).toHaveLength(0);
    expect(root.tjOverlay).toBeUndefined();
    expect(layerHost.isConnected).toBe(false);
    expect(layerHost.shadowRoot.childNodes).toHaveLength(0);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(host.parentNode).toBeNull();
    expect(host.childNodes).toHaveLength(0);
  });

  it('mounts and unmounts many times without keeping a popup layer or a widget root', async () => {
    for (let i = 0; i < 5; i += 1) {
      const { root, unmount } = await mountWidget('teardown|cycles');
      expect(document.querySelectorAll('.tj-cc-popup-host')).toHaveLength(1);
      unmount();
      expect(root.childNodes).toHaveLength(0);
      expect(document.querySelectorAll('.tj-cc-popup-host')).toHaveLength(0);
    }
  });

  it('keeps a live host intact when only the sheet key changes', async () => {
    const { host, rerender } = await mountWidget('teardown|keyA');
    rerender(<InlineLibraryComponent {...props('teardown|keyB')} />);
    await waitFor(() => expect(host.shadowRoot.querySelector('[data-testid="inner"]')).not.toBeNull());
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(host.isConnected).toBe(true);
    expect(host.querySelector('[data-testid="light"]')).not.toBeNull();
    expect(host.shadowRoot.querySelectorAll('.tj-cc-root')).toHaveLength(1);
  });
});
