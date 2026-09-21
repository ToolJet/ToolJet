/**
 * Pagination behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/Pagination/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 *
 * Two harnesses, because the rendered page window is a function of the widget's
 * `width` prop (`Math.floor(width / 28)` in Pagination.jsx) and `createWidgetHarness`
 * fixes that width per harness: `widget` is wide enough to show every page,
 * `narrow` is not, which is the only way to exercise the ellipsis branch.
 *
 * Three characterizations here pin behaviour that differs from the documentation,
 * each under an approved decision — the loader sits on the first item of the
 * window rather than the current page (D-01), boundary operators are gated by CSS
 * alone (D-02), and re-selecting the active page fires `onPageChange` again (D-06).
 */
import { screen, waitFor, within } from '@testing-library/react';
import { paginationConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/pagination';
import { paginationConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/pagination';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, setVariableOn, binding, store, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pag1';
const HANDLE = 'pagination1';
const ID2 = 'pag2';
const HANDLE2 = 'pagination2';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';

const defaultProperties = {
  numberOfPages: binding('{{5}}'),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  loadingState: binding('{{false}}'),
};
const defaultStyles = { alignment: binding('left'), boxShadow: binding('0px 0px 0px 0px #00000040') };

const harnessArgs = {
  componentType: 'Pagination',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
};

// 600 / 28 = 21 slots, so every page of a 5- or 20-page range is rendered.
const widget = createWidgetHarness({ ...harnessArgs, widgetWidth: 600 });
// 400 / 28 = 14 slots => 10 page numbers before the ellipsis trimming runs.
const narrow = createWidgetHarness({ ...harnessArgs, widgetWidth: 400 });

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) => container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const pageList = (container, handle = HANDLE) => root(container, handle).querySelector('ul');
const operator = (container, label, handle = HANDLE) => within(root(container, handle)).getByLabelText(label);
const pageItem = (container, page, handle = HANDLE) =>
  within(pageList(container, handle)).getByText(String(page)).closest('li');
const activePage = (container, handle = HANDLE) =>
  pageList(container, handle).querySelector('li.active')?.textContent ?? null;
// Page items only: the four operators are the `li`s carrying an aria-label.
const pageNumbers = (container, handle = HANDLE) =>
  Array.from(pageList(container, handle).querySelectorAll('li:not([aria-label])')).map((li) => li.textContent);

const click = (harness, node) => harness.session.user.click(node);
const clickOperator = (harness, container, label, handle = HANDLE) =>
  click(harness, operator(container, label, handle).querySelector('a'));

async function setProperty(harness, property, value, componentId = ID) {
  await harness.session.store.act(() => harness.setComponentProperty(componentId, property, value, 'properties'));
}
async function setStyle(harness, property, value, componentId = ID) {
  await harness.session.store.act(() => harness.setComponentProperty(componentId, property, value, 'styles'));
}

/** Counts handler runs through a public seam: each fire increments a custom variable. */
const countPageChanges = (sourceId = ID) =>
  setVariableOn(sourceId, 'onPageChange', { key: 'fired', value: '{{(variables.fired ?? 0) + 1}}' });

function paginationDefinition(id, handle, properties = {}) {
  const definition = componentDefinition(id, handle, 'Pagination', { ...defaultProperties, ...properties });
  definition.component.definition.styles = { ...defaultStyles };
  return definition;
}

describe('Pagination widget', () => {
  describe('wide layout', () => {
    beforeEach(() => widget.setup());
    afterEach(() => widget.teardown());

    describe('default page index', () => {
      test('[Pagination-DEF-001] mount publishes the default page without firing the change event', async () => {
        // Break this catches: firing onPageChange during the first render (the isInitialRender
        // guard), or failing to publish currentPageIndex/totalPages until the first navigation.
        // The handler is registered BEFORE the render: an initial-render fire is invisible to
        // a handler wired up afterwards.
        const { container } = widget.render({
          properties: { defaultPageIndex: binding('{{3}}') },
          events: countPageChanges(),
        });

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(3));
        expect(widget.exposed().totalPages).toBe(5);
        expect(activePage(container)).toBe('3');
        expect(widget.variables().fired).toBeUndefined();
      });

      test('[Pagination-DEF-001] without a default page index the widget starts on page 1', async () => {
        // Break this catches: seeding currentPage from an undefined property instead of 1.
        const { container } = widget.render();

        await waitFor(() => expect(activePage(container)).toBe('1'));
        expect(widget.exposed().totalPages).toBe(5);
      });

      test('[Pagination-DEF-002] a post-mount default page index change navigates and fires once', async () => {
        // Break this catches: ignoring later defaultPageIndex changes, or re-running the
        // effect (and the event) for a value that did not actually change.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{2}}') } });
        widget.setEvents(countPageChanges());
        await waitFor(() => expect(activePage(container)).toBe('2'));

        await setProperty(widget, 'defaultPageIndex', '{{4}}');

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(4));
        expect(activePage(container)).toBe('4');
        await waitFor(() => expect(widget.variables().fired).toBe(1));

        await setProperty(widget, 'defaultPageIndex', '{{4}}');
        await clickOperator(widget, container, 'Go to next page');

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(5));
        await waitFor(() => expect(widget.variables().fired).toBe(2));
      });

      test('[Pagination-DEF-003] a zero default page index is ignored (D-04)', async () => {
        // Break this catches: replacing the truthiness guard with a null check, which would
        // make a bound 0 navigate to page 0.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{2}}') } });
        await waitFor(() => expect(activePage(container)).toBe('2'));

        await setProperty(widget, 'defaultPageIndex', '{{0}}');

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(2));
        expect(activePage(container)).toBe('2');
      });

      test('[Pagination-DEF-003] out-of-range default page indices are applied unclamped (D-04)', async () => {
        // Break this catches: silently borrowing setPage's clamp here, which would hide an
        // authoring mistake instead of surfacing the authored value.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{9}}') } });

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(9));
        // 9 is outside a 5-page range, so no rendered page is selected.
        expect(activePage(container)).toBeNull();

        await setProperty(widget, 'defaultPageIndex', '{{-3}}');
        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(-3));
        expect(activePage(container)).toBeNull();
      });
    });

    describe('navigation', () => {
      test('[Pagination-NAV-001] operators move one page, to the first page, and to the last page', async () => {
        // Break this catches: swapping the operator handlers, or jumping to the wrong bound
        // (e.g. gotoLastPage using a stale total).
        const { container } = widget.render();
        await waitFor(() => expect(activePage(container)).toBe('1'));

        await clickOperator(widget, container, 'Go to next page');
        expect(widget.exposed().currentPageIndex).toBe(2);
        expect(activePage(container)).toBe('2');

        await clickOperator(widget, container, 'Go to previous page');
        expect(widget.exposed().currentPageIndex).toBe(1);

        await clickOperator(widget, container, 'Go to last page');
        expect(widget.exposed().currentPageIndex).toBe(5);
        expect(activePage(container)).toBe('5');

        await clickOperator(widget, container, 'Go to first page');
        expect(widget.exposed().currentPageIndex).toBe(1);
        expect(activePage(container)).toBe('1');
      });

      test('[Pagination-NAV-001] clicking a page number selects exactly that page', async () => {
        // Break this catches: binding every page link to the same index, or leaving more than
        // one item marked active after a jump.
        const { container } = widget.render();

        await click(widget, pageItem(container, 4));

        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(4));
        expect(pageList(container).querySelectorAll('li.active')).toHaveLength(1);
        expect(activePage(container)).toBe('4');
      });

      test('[Pagination-NAV-002] boundary operators carry the disabled class per D-02', async () => {
        // Break this catches: inverting getDisableCls, or comparing the wrong bound so the
        // back arrows stay live on page 1 (the class is the only gate the DOM exposes).
        const { container } = widget.render();
        await waitFor(() => expect(activePage(container)).toBe('1'));

        expect(operator(container, 'Go to first page')).toHaveClass('disabled');
        expect(operator(container, 'Go to previous page')).toHaveClass('disabled');
        expect(operator(container, 'Go to next page')).not.toHaveClass('disabled');
        expect(operator(container, 'Go to last page')).not.toHaveClass('disabled');

        await clickOperator(widget, container, 'Go to last page');

        await waitFor(() => expect(operator(container, 'Go to next page')).toHaveClass('disabled'));
        expect(operator(container, 'Go to last page')).toHaveClass('disabled');
        expect(operator(container, 'Go to previous page')).not.toHaveClass('disabled');
        expect(operator(container, 'Go to first page')).not.toHaveClass('disabled');
      });
    });

    describe('exposed page count', () => {
      test('[Pagination-EXP-001] totalPages tracks numberOfPages and moves the forward bound', async () => {
        // Break this catches: publishing totalPages only once at mount, which leaves both the
        // last-page jump and the disabled bound stuck on the original count.
        const { container } = widget.render();
        await waitFor(() => expect(widget.exposed().totalPages).toBe(5));

        await setProperty(widget, 'numberOfPages', '{{8}}');

        await waitFor(() => expect(widget.exposed().totalPages).toBe(8));
        await clickOperator(widget, container, 'Go to last page');
        expect(widget.exposed().currentPageIndex).toBe(8);
        expect(operator(container, 'Go to next page')).toHaveClass('disabled');
      });

      test('[Pagination-EXP-001] a shrinking total leaves the current page where it is (D-03)', async () => {
        // Break this catches: adding an unapproved clamp that silently moves the user's page
        // when a bound total drops.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{5}}') } });
        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(5));

        await setProperty(widget, 'numberOfPages', '{{3}}');

        await waitFor(() => expect(widget.exposed().totalPages).toBe(3));
        expect(widget.exposed().currentPageIndex).toBe(5);
        expect(pageNumbers(container)).toEqual(['1', '2', '3']);
      });
    });

    describe('events', () => {
      test('[Pagination-EVT-001] onPageChange fires once per move and its handler reads the new index', async () => {
        // Break this catches: firing the event before publishing currentPageIndex (the handler
        // would read the previous page), or firing twice for one click.
        const { container } = widget.render();
        widget.setEvents([
          ...setVariableOn(ID, 'onPageChange', {
            key: 'seenIndex',
            value: '{{components.pagination1.currentPageIndex}}',
          }),
        ]);

        await click(widget, pageItem(container, 3));

        await waitFor(() => expect(widget.variables().seenIndex).toBe(3));
      });

      test('[Pagination-EVT-001] every navigation path fires exactly one page change', async () => {
        // Break this catches: a second fireEvent on one of the operator paths, or an operator
        // that navigates without announcing it.
        const { container } = widget.render();
        widget.setEvents(countPageChanges());

        await clickOperator(widget, container, 'Go to next page');
        await waitFor(() => expect(widget.variables().fired).toBe(1));

        await clickOperator(widget, container, 'Go to last page');
        await waitFor(() => expect(widget.variables().fired).toBe(2));

        await click(widget, pageItem(container, 2));
        await waitFor(() => expect(widget.variables().fired).toBe(3));

        await widget.act('setPage', 4);
        await waitFor(() => expect(widget.variables().fired).toBe(4));
      });

      test('[Pagination-EVT-001] re-selecting the active page fires the event again (D-06)', async () => {
        // Break this catches: an unapproved dedupe that swallows the event apps rely on to
        // refetch the current page.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{2}}') } });
        widget.setEvents(countPageChanges());
        await waitFor(() => expect(activePage(container)).toBe('2'));

        await click(widget, pageItem(container, 2));
        await waitFor(() => expect(widget.variables().fired).toBe(1));

        await widget.act('setPage', 2);
        await waitFor(() => expect(widget.variables().fired).toBe(2));
        expect(widget.exposed().currentPageIndex).toBe(2);
      });
    });

    describe('setPage', () => {
      test('[Pagination-CSA-001] setPage clamps below 1, above the total, and floors fractions', async () => {
        // Break this catches: dropping either clamp (page 0 / page 99 would be published) or
        // rounding instead of flooring a fractional index.
        const { container } = widget.render();
        await waitFor(() => expect(widget.exposed().totalPages).toBe(5));

        await widget.act('setPage', 0);
        expect(widget.exposed().currentPageIndex).toBe(1);

        await widget.act('setPage', -7);
        expect(widget.exposed().currentPageIndex).toBe(1);

        await widget.act('setPage', 99);
        expect(widget.exposed().currentPageIndex).toBe(5);
        expect(activePage(container)).toBe('5');

        await widget.act('setPage', 3.9);
        expect(widget.exposed().currentPageIndex).toBe(3);
        expect(activePage(container)).toBe('3');
      });

      test('[Pagination-CSA-001] setPage clamps against the latest page count', async () => {
        // Break this catches: capturing numberOfPages once, so the clamp keeps using a stale
        // total after the property changes.
        widget.render();
        await waitFor(() => expect(widget.exposed().totalPages).toBe(5));

        await setProperty(widget, 'numberOfPages', '{{9}}');
        await waitFor(() => expect(widget.exposed().totalPages).toBe(9));

        await widget.act('setPage', 99);
        expect(widget.exposed().currentPageIndex).toBe(9);
      });

      test('[Pagination-CSA-002] setPage ignores a non-numeric index and an invalid total', async () => {
        // Break this catches: removing the isFinite guards, which publishes NaN as the page
        // index and fires a page-change event for a move that never happened.
        const { container } = widget.render({ properties: { defaultPageIndex: binding('{{2}}') } });
        widget.setEvents(countPageChanges());
        await waitFor(() => expect(widget.exposed().currentPageIndex).toBe(2));

        await widget.act('setPage', 'abc');
        await widget.act('setPage', undefined);
        expect(widget.exposed().currentPageIndex).toBe(2);
        expect(activePage(container)).toBe('2');

        await setProperty(widget, 'numberOfPages', '{{0}}');
        await waitFor(() => expect(widget.exposed().totalPages).toBe(0));
        await widget.act('setPage', 1);

        expect(widget.exposed().currentPageIndex).toBe(2);
        expect(widget.variables().fired).toBeUndefined();
      });
    });

    describe('state actions', () => {
      test('[Pagination-STA-001] setVisibility, setDisable and setLoading publish and apply their state', async () => {
        // Break this catches: an action that updates the exposed variable without re-rendering
        // the widget (or the reverse), leaving app logic and the canvas disagreeing.
        const { container } = widget.render();
        await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

        await widget.act('setVisibility', false);
        expect(widget.exposed().isVisible).toBe(false);
        expect(pageList(container)).toHaveStyle({ display: 'none' });
        expect(root(container)).toHaveAttribute('aria-hidden', 'true');

        await widget.act('setVisibility', true);
        expect(widget.exposed().isVisible).toBe(true);
        expect(pageList(container)).toHaveStyle({ display: 'flex' });

        await widget.act('setDisable', true);
        expect(widget.exposed().isDisabled).toBe(true);
        expect(root(container)).toHaveAttribute('aria-disabled', 'true');
        expect(root(container)).toHaveAttribute('data-disabled', 'true');

        await widget.act('setLoading', true);
        expect(widget.exposed().isLoading).toBe(true);
        expect(pageList(container)).toHaveStyle({ pointerEvents: 'none' });
      });

      test('[Pagination-STA-001] the state actions coerce their argument to a boolean', async () => {
        // Break this catches: publishing the raw argument, so `isVisible` becomes a string or
        // 0 and every `{{...isVisible === false}}` binding in an app breaks.
        widget.render();

        await widget.act('setVisibility', 0);
        expect(widget.exposed().isVisible).toBe(false);

        await widget.act('setDisable', 'yes');
        expect(widget.exposed().isDisabled).toBe(true);

        await widget.act('setLoading', null);
        expect(widget.exposed().isLoading).toBe(false);
      });

      test('[Pagination-STA-002] a no-op property rewrite does not revert action state', async () => {
        // Break this catches: syncing the property into local state on every resolution, which
        // makes any unrelated re-resolve undo a setVisibility/setDisable/setLoading call.
        const { container } = widget.render();
        await widget.act('setDisable', true);
        await widget.act('setLoading', true);
        expect(widget.exposed().isDisabled).toBe(true);

        await setProperty(widget, 'disabledState', '{{false}}');
        await setProperty(widget, 'loadingState', '{{false}}');
        await setProperty(widget, 'numberOfPages', '{{5}}');

        expect(widget.exposed().isDisabled).toBe(true);
        expect(widget.exposed().isLoading).toBe(true);
        expect(root(container)).toHaveAttribute('aria-disabled', 'true');
      });

      test('[Pagination-STA-002] a genuinely changed property overrides action state', async () => {
        // Break this catches: letting the action latch permanently, so an author can never take
        // control back from a CSA through the inspector or a binding.
        const { container } = widget.render();
        await widget.act('setDisable', false);
        expect(widget.exposed().isDisabled).toBe(false);

        await setProperty(widget, 'disabledState', '{{true}}');

        await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
        expect(root(container)).toHaveAttribute('aria-disabled', 'true');
      });

      test('[Pagination-STA-002] the canvas disabled class follows the action, not only the property', async () => {
        // Break this catches: RenderWidget reading the property ahead of the exposed value, so a
        // CSA-disabled widget stays interactive on the canvas.
        const { container } = widget.render();
        expect(canvasNode(container)).not.toHaveClass('disabled');

        await widget.act('setDisable', true);

        await waitFor(() => expect(canvasNode(container)).toHaveClass('disabled'));

        await widget.act('setDisable', false);
        await waitFor(() => expect(canvasNode(container)).not.toHaveClass('disabled'));
      });
    });

    describe('loading, visibility and disabled properties', () => {
      test('[Pagination-LOAD-001] loading blocks the list and replaces the first item of the window (D-01)', async () => {
        // Break this catches: losing the pointer-events block (navigation stays live behind the
        // spinner) or rendering the loader in addition to every page number.
        const { container } = widget.render({
          properties: { defaultPageIndex: binding('{{3}}'), loadingState: binding('{{true}}') },
        });

        await waitFor(() => expect(pageList(container)).toHaveStyle({ pointerEvents: 'none' }));
        expect(pageList(container)).toHaveStyle({ opacity: '0.4' });
        expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
        expect(pageNumbers(container)).toEqual(['', '2', '3', '4', '5']);

        await setProperty(widget, 'loadingState', '{{false}}');

        await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeNull());
        expect(pageNumbers(container)).toEqual(['1', '2', '3', '4', '5']);
        expect(activePage(container)).toBe('3');
      });

      test('[Pagination-VIS-001] visibility hides the widget without unmounting and restores its styling', async () => {
        // Break this catches: unmounting on hide (the current page would reset), or leaving the
        // box shadow painted around an invisible widget.
        const { container } = widget.render({
          properties: { defaultPageIndex: binding('{{4}}') },
          styles: { boxShadow: binding(SHADOW), alignment: binding('center') },
        });
        await waitFor(() => expect(activePage(container)).toBe('4'));
        expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

        await setProperty(widget, 'visibility', '{{false}}');

        await waitFor(() => expect(pageList(container)).toHaveStyle({ display: 'none' }));
        expect(root(container)).toHaveAttribute('aria-hidden', 'true');
        expect(root(container)).toHaveStyle({ boxShadow: 'none' });
        expect(widget.exposed().isVisible).toBe(false);

        await setProperty(widget, 'visibility', '{{true}}');

        await waitFor(() => expect(pageList(container)).toHaveStyle({ display: 'flex' }));
        expect(root(container)).toHaveStyle({ boxShadow: SHADOW, justifyContent: 'center' });
        expect(activePage(container)).toBe('4');
      });

      test.each(['edit', 'view'])(
        '[Pagination-VIS-001] visibility behaves the same in %s mode',
        async (currentMode) => {
          // Break this catches: gating the hide on the editor, which would leak a hidden widget
          // into the deployed app (or the reverse).
          const { container } = widget.render({ currentMode, properties: { visibility: binding('{{false}}') } });

          await waitFor(() => expect(pageList(container)).toHaveStyle({ display: 'none' }));
          expect(root(container)).toHaveAttribute('aria-hidden', 'true');

          await setProperty(widget, 'visibility', '{{true}}');
          await waitFor(() => expect(pageList(container)).toHaveStyle({ display: 'flex' }));
        }
      );

      test('[Pagination-DIS-001] disable publishes the state to the widget and the canvas', async () => {
        // Break this catches: dropping the aria/data attributes, or the canvas class that carries
        // the pointer-events lock, either of which leaves a "disabled" pagination usable.
        const { container } = widget.render();
        expect(root(container)).toHaveAttribute('aria-disabled', 'false');
        expect(canvasNode(container)).not.toHaveClass('disabled');

        await setProperty(widget, 'disabledState', '{{true}}');

        await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'true'));
        expect(root(container)).toHaveAttribute('data-disabled', 'true');
        expect(canvasNode(container)).toHaveClass('disabled');
        expect(widget.exposed().isDisabled).toBe(true);

        await setProperty(widget, 'disabledState', '{{false}}');

        await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'false'));
        expect(canvasNode(container)).not.toHaveClass('disabled');
      });
    });

    describe('page window', () => {
      test('[Pagination-PGL-001] every page is listed when the window is wide enough', async () => {
        // Break this catches: an off-by-one in the start/end window that drops the first or last
        // page, or an ellipsis appearing when everything already fits.
        const { container } = widget.render({ properties: { numberOfPages: binding('{{12}}') } });

        await waitFor(() => expect(pageNumbers(container)).toHaveLength(12));
        expect(pageNumbers(container)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
        expect(within(pageList(container)).queryByText('...')).toBeNull();
        expect(pageList(container).querySelectorAll('li.active')).toHaveLength(1);
      });
    });

    describe('styles', () => {
      test('[Pagination-STY-001] alignment positions the control row', async () => {
        // Break this catches: writing the alignment value to the wrong CSS property, or losing it
        // on the next style resolution.
        const { container } = widget.render();
        expect(root(container)).toHaveStyle({ justifyContent: 'left' });

        await setStyle(widget, 'alignment', 'center');
        await waitFor(() => expect(root(container)).toHaveStyle({ justifyContent: 'center' }));

        await setStyle(widget, 'alignment', 'right');
        await waitFor(() => expect(root(container)).toHaveStyle({ justifyContent: 'right' }));
      });

      test('[Pagination-STY-002] the box shadow survives unrelated changes', async () => {
        // Break this catches: rebuilding the container style from scratch on a page or alignment
        // change and forgetting the shadow.
        const { container } = widget.render({ styles: { boxShadow: binding(SHADOW) } });
        await waitFor(() => expect(root(container)).toHaveStyle({ boxShadow: SHADOW }));

        await clickOperator(widget, container, 'Go to next page');
        expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

        await setStyle(widget, 'alignment', 'right');
        await waitFor(() => expect(root(container)).toHaveStyle({ justifyContent: 'right' }));
        expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

        await setProperty(widget, 'loadingState', '{{true}}');
        await waitFor(() => expect(pageList(container)).toHaveStyle({ pointerEvents: 'none' }));
        expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
      });
    });

    describe('accessibility', () => {
      test('[Pagination-A11Y-001] the widget publishes navigation semantics and operator labels', async () => {
        // Break this catches: losing the landmark role/name screen-reader users navigate by, or
        // renaming the operator labels that are the only text on those icon buttons.
        const { container } = widget.render();
        const nav = await screen.findByRole('navigation', { name: 'Pagination' });

        expect(nav).toBe(root(container));
        expect(nav).toHaveAttribute('aria-hidden', 'false');
        expect(nav).toHaveAttribute('aria-disabled', 'false');
        ['Go to first page', 'Go to previous page', 'Go to next page', 'Go to last page'].forEach((label) => {
          expect(within(nav).getByLabelText(label)).toBeInTheDocument();
        });
      });
    });

    describe('instance isolation', () => {
      test('[Pagination-ISO-001] instances keep their own page, totals and state', async () => {
        // Break this catches: module-level state shared between widgets, which would move or
        // hide every Pagination on the page when one of them is acted on.
        const { container } = widget.render({
          properties: { defaultPageIndex: binding('{{2}}') },
          extraComponents: {
            [ID2]: paginationDefinition(ID2, HANDLE2, {
              numberOfPages: binding('{{7}}'),
              defaultPageIndex: binding('{{3}}'),
            }),
          },
          also: [{ id: ID2, componentType: 'Pagination', widgetWidth: 600 }],
        });

        await waitFor(() => expect(activePage(container, HANDLE2)).toBe('3'));
        expect(activePage(container, HANDLE)).toBe('2');
        expect(widget.exposed(ID2).totalPages).toBe(7);
        expect(widget.exposed(ID).totalPages).toBe(5);

        await clickOperator(widget, container, 'Go to last page');

        await waitFor(() => expect(widget.exposed(ID).currentPageIndex).toBe(5));
        expect(widget.exposed(ID2).currentPageIndex).toBe(3);
        expect(activePage(container, HANDLE2)).toBe('3');

        await widget.session.store.act(async () => {
          await widget.exposed(ID2).setVisibility(false);
        });

        await waitFor(() => expect(pageList(container, HANDLE2)).toHaveStyle({ display: 'none' }));
        expect(pageList(container, HANDLE)).toHaveStyle({ display: 'flex' });
        expect(widget.exposed(ID).isVisible).toBe(true);
      });
    });

    describe('registration', () => {
      test('[Pagination-CMP-001] frontend and server registrations agree on Pagination defaults', () => {
        // Break this catches: editing one registry, so apps created in the editor and apps loaded
        // from the server get different Pagination defaults, actions or exposed variables.
        expect(serverConfig).toEqual(frontendConfig);
        expect(frontendConfig).toMatchObject({
          name: 'Pagination',
          component: 'Pagination',
          defaultSize: { width: 10, height: 30 },
          properties: {
            numberOfPages: { validation: { defaultValue: '{{5}}' } },
            defaultPageIndex: { validation: { defaultValue: '{{1}}' } },
          },
          events: { onPageChange: { displayName: 'On Page Change' } },
          styles: { alignment: { validation: { defaultValue: 'left' } } },
          exposedVariables: {
            totalPages: null,
            currentPageIndex: null,
            isVisible: true,
            isDisabled: false,
            isLoading: false,
          },
          definition: {
            properties: {
              numberOfPages: { value: '{{5}}' },
              defaultPageIndex: { value: '{{1}}' },
              loadingState: { value: '{{false}}' },
              visibility: { value: '{{true}}' },
              disabledState: { value: '{{false}}' },
            },
            styles: { alignment: { value: 'left' }, boxShadow: { value: '0px 0px 0px 0px #00000040' } },
          },
        });
        expect(frontendConfig.actions.map((action) => action.handle)).toEqual([
          'setPage',
          'setVisibility',
          'setDisable',
          'setLoading',
        ]);
        expect(frontendConfig.actions[0].params).toEqual([
          { handle: 'page', displayName: 'Page', defaultValue: '{{1}}' },
        ]);
      });
    });
  });

  describe('narrow layout', () => {
    beforeEach(() => narrow.setup());
    afterEach(() => narrow.teardown());

    test('[Pagination-PGL-002] a narrow window collapses to an ellipsis and keeps the last page reachable', async () => {
      // Break this catches: dropping the trailing ellipsis/last-page pair, which strands the user
      // with no way to reach the end of a long range in a narrow widget.
      const { container } = narrow.render({ properties: { numberOfPages: binding('{{20}}') } });

      await waitFor(() => expect(within(pageList(container)).getByText('...')).toBeInTheDocument());
      expect(pageNumbers(container)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '...', '20']);

      await click(narrow, pageItem(container, 20));

      await waitFor(() => expect(narrow.exposed().currentPageIndex).toBe(20));
      expect(activePage(container)).toBe('20');
    });

    test('[Pagination-PGL-002] the window follows the current page and keeps page 1 reachable', async () => {
      // Break this catches: a window that never scrolls with the current page, or losing the
      // leading "1 ..." pair once the user is deep in the range.
      const { container } = narrow.render({
        properties: { numberOfPages: binding('{{20}}'), defaultPageIndex: binding('{{20}}') },
      });

      await waitFor(() => expect(activePage(container)).toBe('20'));
      expect(pageNumbers(container)).toEqual(['1', '...', '13', '14', '15', '16', '17', '18', '19', '20']);
      expect(within(pageList(container)).getAllByText('...')).toHaveLength(1);

      await click(narrow, pageItem(container, 1));

      await waitFor(() => expect(narrow.exposed().currentPageIndex).toBe(1));
      expect(pageNumbers(container)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '...', '20']);
    });
  });
});
