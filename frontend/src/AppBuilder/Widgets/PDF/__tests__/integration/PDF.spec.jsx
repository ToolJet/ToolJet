import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'pdf1';

const widget = createWidgetHarness({
  componentType: 'PDF',
  handle: 'pdf1',
  id: ID,
  defaultProperties: {
    url: binding(''),
    scale: binding('{{true}}'),
    pageControls: binding('{{true}}'),
    showDownloadOption: binding('{{true}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    borderColor: binding('rgb(1, 2, 3)'),
    borderRadius: binding('{{6}}'),
  },
});

// PDF's own outer node carries display (data-cy = component name); its first
// child div carries the border, radius and boxShadow. RenderWidget's wrapper is
// the separate `draggable-widget-<name>` node.
const outer = (id = ID) => document.querySelector(`[data-cy="${id}"]`);
const inner = (id = ID) => document.querySelector(`[data-cy="${id}"] > div`);
const wrapper = (id = ID) => document.querySelector(`[data-cy="${id}"] .scrollable`);
const counterText = (id = ID) => document.querySelector(`[data-cy="${id}"] .pdf-page-controls span`)?.textContent;

/**
 * Recording IntersectionObserver double (standards semantics only — root,
 * thresholds, observed targets, entry delivery). `deliverScroll` models the
 * browser: a scroll inside `scrolledWrapper` produces entries ONLY for
 * observers rooted at that wrapper, ONLY for their observed targets inside it,
 * and ONLY when the visibility ratio reaches a registered threshold.
 */
class RecordingIO {
  static instances = [];
  constructor(callback, options = {}) {
    this.callback = callback;
    this.root = options.root ?? null;
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0];
    this.targets = new Set();
    RecordingIO.instances.push(this);
  }
  observe(target) {
    this.targets.add(target);
  }
  unobserve(target) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

function deliverScroll(scrolledWrapper, visibleByPage) {
  for (const io of RecordingIO.instances) {
    if (io.disconnected || io.root !== scrolledWrapper) continue;
    const minThreshold = Math.min(...io.thresholds);
    const entries = [];
    for (const target of io.targets) {
      if (!scrolledWrapper.contains(target)) continue;
      const page = Number(target.getAttribute('data-page-number'));
      const visible = visibleByPage.get(page);
      if (!visible) continue;
      const reachesThreshold = minThreshold === 0 ? visible.ratio > 0 : visible.ratio >= minThreshold;
      if (!reachesThreshold) continue;
      entries.push({
        target,
        isIntersecting: visible.ratio > 0,
        intersectionRatio: visible.ratio,
        intersectionRect: { height: visible.height },
      });
    }
    if (entries.length) io.callback(entries, io);
  }
}

describe('PDF widget', () => {
  let restoreIO;
  beforeEach(async () => {
    await widget.setup();
    // The harness capability installs a no-op IntersectionObserver; swap in the
    // recording double AFTER it so scroll-tracking scenarios can observe wiring
    // and deliver entries. Restored per test below.
    const sessionObserver = window.IntersectionObserver;
    window.IntersectionObserver = RecordingIO;
    RecordingIO.instances = [];
    restoreIO = () => (window.IntersectionObserver = sessionObserver);
  });
  afterEach(() => {
    restoreIO?.();
    widget.teardown();
  });

  test('[PDF-RENDER-001] an empty url shows the "No PDF file specified" placeholder', async () => {
    // Break this catches: dropping the empty-url guard (PDF.jsx:202) so an unset
    // {{url}} binding mounts <Document file=""> instead of the placeholder, which
    // blanks the widget for every app that has not yet set a file.
    widget.render({ properties: { url: binding('') } });

    expect(await screen.findByText('No PDF file specified')).toBeInTheDocument();
  });

  test('[PDF-STYLE-001] the container is hidden (display:none) when visibility is false', async () => {
    // Break this catches: dropping the `visibility ? 'flex' : 'none'` mapping
    // (PDF.jsx:197) so a hidden PDF stays on screen in the running app.
    widget.render({ styles: { visibility: binding('{{false}}') } });

    await screen.findByText('No PDF file specified');
    expect(outer()).toHaveStyle({ display: 'none' });
  });

  test('[PDF-STYLE-002] boxShadow is applied to the inner container, on the same node as the radius', async () => {
    // Break this catches: putting `boxShadow` back on the radius-less outer node
    // (pre-2026-10-26 behavior) or dropping it entirely — either way the shadow
    // stops hugging the rounded border the user configured (bug-fix batch
    // 2026-10-26, bug 7: square shadow around a rounded widget).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red'), borderRadius: binding('{{20}}') } });

    await screen.findByText('No PDF file specified');
    expect(inner()).toHaveStyle({ boxShadow: '0px 0px 5px red', borderRadius: '20px' });
    expect(outer().style.boxShadow).toBe('');
  });

  test('[PDF-STYLE-003] borderColor is applied to the inner container', async () => {
    // Break this catches: dropping `borderColor` from the inner border
    // (PDF.jsx:189), so the configured border colour never renders.
    widget.render({ styles: { borderColor: binding('rgb(1, 2, 3)') } });

    await screen.findByText('No PDF file specified');
    expect(inner()).toHaveStyle({ border: '1px solid rgb(1, 2, 3)' });
  });

  test('[PDF-STYLE-004] borderRadius is applied to the inner container', async () => {
    // Break this catches: dropping `borderRadius` from the inner container
    // (PDF.jsx:189), so the configured corner radius never renders.
    widget.render({ styles: { borderRadius: binding('{{8}}') } });

    await screen.findByText('No PDF file specified');
    expect(inner()).toHaveStyle({ borderRadius: '8px' });
  });

  test('[PDF-STYLE-005] the scroll wrapper allows horizontal overflow scrolling', async () => {
    // Break this catches: dropping the inline overflow-x override, so the
    // `.scrollable` class's `overflow-x: hidden` clips a fit-to-height page
    // (scale=false) wider than the widget with no way to scroll to it
    // (bug-fix batch 2026-10-26, bug 5 / JAM scale-off-cut).
    widget.render({ properties: { url: binding('') } });

    await screen.findByText('No PDF file specified');
    expect(wrapper()).toHaveStyle({ overflowX: 'auto' });
  });

  test('[PDF-URL-001] an unparsable url renders the load-error message instead of crashing the widget', async () => {
    // Break this catches: mounting <Document> with a string pdfjs cannot parse
    // ("https:" mid-typing) — pdfjs getUrlProp throws synchronously out of
    // react-pdf's un-guarded loadDocument effect and kills the widget subtree
    // (bug-fix batch 2026-10-26, bug 1 / JAM url-crash).
    widget.render({ properties: { url: binding('https:') } });

    expect(await screen.findByText('Failed to load PDF file.')).toBeInTheDocument();
    // The widget survives: its container and placeholder structure stay mounted.
    expect(outer()).not.toBeNull();
  });

  test('[PDF-SCROLL-001] scrolling updates the counter to the most-visible page even when pages are taller than the viewport', async () => {
    // Break this catches: reverting to the single 0.7 IntersectionObserver
    // threshold — a page filling 55% of the wrapper (every tall document) never
    // reaches it, so the "N of M" counter sticks at 1 forever (bug-fix batch
    // 2026-10-26, bug 2 / JAM counter-tall-pages).
    widget.render({ properties: { url: binding('https://example.com/doc.pdf#numPages=5') } });

    await waitFor(() => expect(counterText()).toBe('1 of 5'));
    fireEvent.scroll(wrapper()); // opens the user-scroll gate, as in the browser

    // Mid-scroll geometry of a tall document: page 2 fills more of the viewport
    // than page 1, but neither reaches 70% visibility.
    await act(async () => {
      deliverScroll(
        wrapper(),
        new Map([
          [1, { ratio: 0.3, height: 120 }],
          [2, { ratio: 0.55, height: 220 }],
        ])
      );
    });

    await waitFor(() => expect(counterText()).toBe('2 of 5'));
  });

  test('[PDF-SCROLL-002] each instance tracks only its own scrolling — no cross-talk between two PDFs', async () => {
    // Break this catches: the observer root falling back to
    // document.querySelector('#pdf-wrapper') (the FIRST instance's wrapper) and
    // observing document-wide '.react-pdf__Page' nodes, so scrolling widget A
    // drives widget B's counter once B has ever been scrolled (bug-fix batch
    // 2026-10-26, bug 3 / JAM crosstalk-overflow).
    const SIBLING = 'pdfB';
    widget.render({
      properties: { url: binding('https://example.com/doc.pdf#numPages=5') },
      extraComponents: {
        [SIBLING]: componentDefinition(SIBLING, 'pdfb1', 'PDF', {
          url: binding('https://example.com/doc.pdf#numPages=5'),
          scale: binding('{{true}}'),
          pageControls: binding('{{true}}'),
          showDownloadOption: binding('{{false}}'),
        }),
      },
      also: [{ id: SIBLING, componentType: 'PDF' }],
    });

    await waitFor(() => expect(counterText()).toBe('1 of 5'));
    await waitFor(() => expect(counterText('pdfb1')).toBe('1 of 5'));

    // The JAM repro: widget B was scrolled once earlier (its gate is open), then
    // only widget A is scrolled.
    fireEvent.scroll(wrapper('pdfb1'));
    fireEvent.scroll(wrapper());
    await act(async () => {
      deliverScroll(wrapper(), new Map([[3, { ratio: 1, height: 600 }]]));
    });

    await waitFor(() => expect(counterText()).toBe('3 of 5'));
    expect(counterText('pdfb1')).toBe('1 of 5');
  });
});
