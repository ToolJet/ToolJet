import React, { useState } from 'react';
import { render, screen, fireEvent, userEvent } from '@/test/test-utils';
import { ClosableTabs, type ClosableTabItem } from '../ClosableTabs';

const TABS: ClosableTabItem[] = [
  { id: 'releases', label: 'releases' },
  { id: 'authors', label: 'authors' },
  { id: 'customers', label: 'customers' },
];

function Harness({ initial = 'authors', onClose = jest.fn() }: { initial?: string; onClose?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(initial);
  return <ClosableTabs tabs={TABS} activeId={activeId} onSelect={setActiveId} onClose={onClose} />;
}

// jsdom has no layout: give the scroller a width and let each test say how far it is scrolled.
function mockLayout({ clientWidth, scrollWidth }: { clientWidth: number; scrollWidth: number }) {
  const original = {
    client: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth'),
    scroll: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth'),
  };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => clientWidth });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => scrollWidth });
  return () => {
    if (original.client) Object.defineProperty(HTMLElement.prototype, 'clientWidth', original.client);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    if (original.scroll) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', original.scroll);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
  };
}

describe('ClosableTabs | tabs', () => {
  it('marks the active tab as selected and makes only it a tab stop', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: 'authors' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'releases' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'authors' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'releases' })).toHaveAttribute('tabindex', '-1');
  });

  it('selects a tab on click', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('tab', { name: 'customers' }));

    expect(screen.getByRole('tab', { name: 'customers' })).toHaveAttribute('aria-selected', 'true');
  });

  it('closes a tab from its own close button, without selecting it', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);

    await userEvent.click(screen.getByLabelText('Close releases'));

    expect(onClose).toHaveBeenCalledWith('releases');
    expect(screen.getByRole('tab', { name: 'authors' })).toHaveAttribute('aria-selected', 'true');
  });

  it('closes the focused tab with Delete', async () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);

    screen.getByRole('tab', { name: 'authors' }).focus();
    await userEvent.keyboard('{Delete}');

    expect(onClose).toHaveBeenCalledWith('authors');
  });

  it('moves between tabs with the arrow keys and stops at the ends', async () => {
    render(<Harness initial="releases" />);

    screen.getByRole('tab', { name: 'releases' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'authors' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'customers' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'customers' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'releases' })).toHaveFocus();
  });

  it('makes the first tab the tab stop when none is selected', () => {
    render(<ClosableTabs tabs={TABS} activeId={null} onSelect={() => {}} onClose={() => {}} />);

    expect(screen.getByRole('tab', { name: 'releases' })).toHaveAttribute('tabindex', '0');
  });
});

describe('ClosableTabs | indicator', () => {
  const cellOf = (name: string) => screen.getByRole('tab', { name }).parentElement?.parentElement;

  it('draws the selected tab line on the bottom edge by default', () => {
    render(<Harness />);

    expect(cellOf('authors')).toHaveClass('tw-border-b-2', 'tw-border-border-accent-strong');
    expect(cellOf('releases')).toHaveClass('tw-border-transparent');
  });

  it('draws it on the top edge when asked', () => {
    render(<ClosableTabs tabs={TABS} activeId="authors" indicator="top" onSelect={() => {}} onClose={() => {}} />);

    expect(cellOf('authors')).toHaveClass('tw-border-t-2');
    expect(cellOf('authors')).not.toHaveClass('tw-border-b-2');
  });
});

describe('ClosableTabs | overflow', () => {
  const left = () => screen.getByRole('button', { name: 'Scroll tabs left' });
  const right = () => screen.getByRole('button', { name: 'Scroll tabs right' });

  it('shows no chevrons while every tab fits', () => {
    const restore = mockLayout({ clientWidth: 600, scrollWidth: 600 });
    render(<Harness />);

    expect(screen.queryByRole('button', { name: 'Scroll tabs left' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll tabs right' })).not.toBeInTheDocument();
    restore();
  });

  it('shows no chevrons when there are no tabs', () => {
    const restore = mockLayout({ clientWidth: 600, scrollWidth: 0 });
    render(<ClosableTabs tabs={[]} activeId={null} onSelect={() => {}} onClose={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Scroll tabs left' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll tabs right' })).not.toBeInTheDocument();
    restore();
  });

  it('shows both chevrons once the tabs overflow, enabling only the right one at the start and the left one at the end', () => {
    const restore = mockLayout({ clientWidth: 300, scrollWidth: 600 });
    render(<Harness />);

    expect(left()).toBeDisabled();
    expect(right()).toBeEnabled();

    const list = screen.getByRole('tablist');
    list.scrollLeft = 300;
    fireEvent.scroll(list);

    expect(left()).toBeEnabled();
    expect(right()).toBeDisabled();
    restore();
  });

  it('enables both chevrons in the middle', () => {
    const restore = mockLayout({ clientWidth: 300, scrollWidth: 900 });
    render(<Harness />);

    const list = screen.getByRole('tablist');
    list.scrollLeft = 200;
    fireEvent.scroll(list);

    expect(left()).toBeEnabled();
    expect(right()).toBeEnabled();
    restore();
  });
});

describe('ClosableTabs | selected tab in view', () => {
  // The chevrons take 82px from the list once the tabs overflow, so the list is narrower than it was a moment before.
  function mockSlotLayout() {
    const descriptors = ['clientWidth', 'scrollWidth', 'offsetLeft', 'offsetWidth'].map(
      (key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)] as const
    );
    const define = (key: string, get: (this: HTMLElement) => number) =>
      Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get });
    define('clientWidth', function () {
      return this.getAttribute('role') === 'tablist' && screen.queryByRole('button', { name: 'Scroll tabs left' })
        ? 218
        : 300;
    });
    define('scrollWidth', () => 600);
    define('offsetWidth', () => 200);
    define('offsetLeft', function () {
      return this.parentElement?.getAttribute('role') === 'tablist'
        ? Array.from(this.parentElement.children).indexOf(this) * 200
        : 0;
    });
    return () =>
      descriptors.forEach(([key, descriptor]) => {
        if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
        else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
      });
  }

  it('scrolls a new last tab fully into view, after the chevrons have narrowed the list', () => {
    const restore = mockSlotLayout();
    render(<Harness initial="customers" />);

    // Last tab spans 400-600; the list is 218 wide, so it must start at 600 - 218.
    expect(screen.getByRole('tablist').scrollLeft).toBe(382);
    restore();
  });
});
