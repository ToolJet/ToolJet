/**
 * UI 2.0 Pagination: a pager of page numbers with Previous and Next, from a page count or from records and page size.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Pagination itself does. Titles carry [ShadPagination-<AREA>-<NNN>] scenario ids.
 * The registered defaults apply: ten pages, starting on page 1, one page either side of the current one.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pg1';
const widget = createWidgetHarness({
  componentType: 'ShadPagination',
  handle: 'pagination1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 640,
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const pager = () => screen.getByRole('navigation', { name: 'pagination' });
/** The pager as read left to right: page numbers, '…' for a gap. */
const pages = () =>
  [...pager().querySelectorAll('li')]
    .filter((li) => !li.querySelector('[aria-label^="Go to"]'))
    .map((li) => (li.getAttribute('aria-hidden') ? '…' : li.textContent));
const press = async (label) => {
  await act(async () => fireEvent.click(screen.getByLabelText(label)));
};

describe('UI 2.0 Pagination', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadPagination-DEF-001] shows the first pages, a gap and the last, on page 1, with Previous and Next', async () => {
    render();

    await waitFor(() => expect(pages()).toEqual(['1', '2', '3', '4', '5', '…', '10']));
    expect(screen.getByLabelText('Page 1')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    expect(pager()).toHaveTextContent(/Previous/);
    expect(pager()).toHaveTextContent(/Next/);
    expect(exposed()).toMatchObject({ totalPages: 10, currentPageIndex: 1 });
  });

  test('[ShadPagination-PROP-001] numberOfPages sets the page count', async () => {
    render({ properties: { numberOfPages: binding('{{3}}') } });

    await waitFor(() => expect(pages()).toEqual(['1', '2', '3']));
    expect(exposed().totalPages).toBe(3);
  });

  test('[ShadPagination-PROP-002] totalRecords and pageSize count the pages, and a shrinking count keeps the pager on its last page', async () => {
    render({
      properties: { totalRecords: binding('{{95}}'), pageSize: binding('{{20}}'), defaultPageIndex: binding('{{5}}') },
    });
    await waitFor(() => expect(exposed()).toMatchObject({ totalPages: 5, currentPageIndex: 5 }));

    await act(async () =>
      render({
        properties: {
          totalRecords: binding('{{30}}'),
          pageSize: binding('{{20}}'),
          defaultPageIndex: binding('{{5}}'),
        },
      })
    );

    await waitFor(() => expect(exposed()).toMatchObject({ totalPages: 2, currentPageIndex: 2 }));
    expect(screen.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page');
  });

  test('[ShadPagination-PROP-003] defaultPageIndex starts on that page, and changing it later moves the pager and fires onPageChange', async () => {
    render({ properties: { defaultPageIndex: binding('{{4}}') } });
    await waitFor(() => expect(exposed().currentPageIndex).toBe(4));
    expect(screen.getByLabelText('Page 4')).toHaveAttribute('aria-current', 'page');
    await handle(setVariableOn(ID, 'onPageChange', { value: '{{components.pagination1.currentPageIndex}}' }));

    await act(async () => render({ properties: { defaultPageIndex: binding('{{7}}') } }));

    await waitFor(() => expect(widget.variables().seen).toBe(7));
  });

  test('[ShadPagination-PROP-004] siblingCount sets how many pages show either side of the current one', async () => {
    render({
      properties: {
        numberOfPages: binding('{{20}}'),
        defaultPageIndex: binding('{{10}}'),
        siblingCount: binding('{{2}}'),
      },
    });
    await waitFor(() => expect(pages()).toEqual(['1', '…', '8', '9', '10', '11', '12', '…', '20']));

    await act(async () =>
      render({
        properties: {
          numberOfPages: binding('{{20}}'),
          defaultPageIndex: binding('{{10}}'),
          siblingCount: binding('{{0}}'),
        },
      })
    );
    await waitFor(() => expect(pages()).toEqual(['1', '…', '10', '…', '20']));
  });

  test('[ShadPagination-PROP-005] showFirstLast adds first- and last-page buttons; showLabels off drops the words', async () => {
    render({ properties: { showFirstLast: binding('{{true}}'), showLabels: binding('{{false}}') } });

    expect(await screen.findByLabelText('Go to first page')).toBeDisabled();
    expect(pager()).not.toHaveTextContent(/Previous|Next/);

    await press('Go to last page');
    await waitFor(() => expect(exposed().currentPageIndex).toBe(10));
    expect(screen.getByLabelText('Go to last page')).toBeDisabled();
  });

  test('[ShadPagination-PROP-006] size sm draws the smaller buttons', async () => {
    render({ properties: { size: binding('sm') } });

    expect(await screen.findByLabelText('Page 1')).toHaveClass('h-8');
    await act(async () => render({ properties: { size: binding('default') } }));
    expect(screen.getByLabelText('Page 1')).toHaveClass('h-9');
  });

  // A ten-page pager at 445px put Next on a second line, below the widget's box. jsdom has no layout, so every list
  // measures as wrapped here.
  test('[ShadPagination-PROP-007] too narrow for the whole pager, it drops the Previous and Next words before it wraps', async () => {
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.tagName === 'UL' ? 80 : 36;
      },
    });
    try {
      render();
      await screen.findByLabelText('Page 1');
      await waitFor(() => expect(pager()).not.toHaveTextContent(/Previous|Next/));
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height);
    }
  });

  test('[ShadPagination-EVT-001] clicking a page fires onPageChange, whose handler reads the new page', async () => {
    render();
    await handle(setVariableOn(ID, 'onPageChange', { value: '{{components.pagination1.currentPageIndex}}' }));

    await screen.findByLabelText('Page 2');
    await press('Page 2');

    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(screen.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page');
  });

  test('[ShadPagination-EVT-002] Previous and Next move one page; the current page clicked again fires nothing', async () => {
    render({ properties: { defaultPageIndex: binding('{{9}}') } });
    await handle(countInvocationsOn(ID, 'onPageChange'));
    await screen.findByLabelText('Page 9');

    await press('Go to next page');
    await waitFor(() => expect(exposed().currentPageIndex).toBe(10));
    expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    await press('Page 10');
    await press('Go to previous page');

    await waitFor(() => expect(exposed().currentPageIndex).toBe(9));
    expect(widget.variables().calls).toBe(2);
  });

  test('[ShadPagination-ACT-001] setPage moves to a page and fires onPageChange, clamped to the pages there are', async () => {
    render();
    await handle(setVariableOn(ID, 'onPageChange', { value: '{{components.pagination1.currentPageIndex}}' }));

    await widget.act('setPage', 3);
    await waitFor(() => expect(widget.variables().seen).toBe(3));
    expect(screen.getByLabelText('Page 3')).toHaveAttribute('aria-current', 'page');

    await widget.act('setPage', 99);
    await waitFor(() => expect(exposed().currentPageIndex).toBe(10));
    expect(widget.variables().seen).toBe(10);
  });

  test('[ShadPagination-STY-001] colour and radius styles reach the pager as CSS variables, and alignment moves it', async () => {
    const { container } = render({
      styles: {
        textColor: binding('#334155'),
        hoverBackgroundColor: binding('#f1f5f9'),
        activeBackgroundColor: binding('#e11d48'),
        activeTextColor: binding('#ffffff'),
        activeBorderColor: binding('#be123c'),
        borderRadius: binding('{{12}}'),
        alignment: binding('right'),
      },
    });

    await screen.findByLabelText('Page 1');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#334155');
    expect(root.style.getPropertyValue('--lk-hover')).toBe('#f1f5f9');
    expect(root.style.getPropertyValue('--lk-on-bg')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-on-fg')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--lk-on-border')).toBe('#be123c');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('12px');
    expect(pager()).toHaveClass('justify-end');
  });
});
