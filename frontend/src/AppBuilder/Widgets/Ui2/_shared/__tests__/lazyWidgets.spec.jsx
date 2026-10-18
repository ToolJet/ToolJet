/**
 * A List view's rows mounted their lazy widgets in a Suspense retry of their own, outside the batch the list opens
 * for its rows: the list now waits, on its first render only, until its row template's widgets have loaded.
 */
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import React, { Suspense, lazy } from 'react';
import { act, render, screen } from '@testing-library/react';
import { loadLazy, useLazyLoadedFirst } from '../lazyWidgets';

const Word = () => <span>word</span>;
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('loadLazy', () => {
  test('loads a lazy component not loaded yet, then has nothing left to load', async () => {
    const load = deferred();
    const LazyWord = lazy(() => load.promise);
    const pending = loadLazy([LazyWord, Word, null]);
    expect(pending).not.toBeNull();
    load.resolve({ default: Word });
    await pending;
    expect(loadLazy([LazyWord])).toBeNull();
    // Loaded, it renders at once instead of suspending.
    render(
      <Suspense fallback="waiting">
        <LazyWord />
      </Suspense>
    );
    expect(screen.getByText('word')).toBeInTheDocument();
  });

  test('a failed load resolves, and its render reports it', async () => {
    const LazyBroken = lazy(() => Promise.reject(new Error('chunk failed')));
    await loadLazy([LazyBroken]);
    expect(loadLazy([LazyBroken])).toBeNull();
  });
});

describe('useLazyLoadedFirst', () => {
  const Probe = ({ components, label }) => {
    useLazyLoadedFirst(() => components);
    return <span>{label}</span>;
  };

  test('suspends the first render until the components have loaded, and never again', async () => {
    const load = deferred();
    const LazyWord = lazy(() => load.promise);
    const { rerender } = render(
      <Suspense fallback="waiting">
        <Probe components={[LazyWord]} label="drawn" />
      </Suspense>
    );
    expect(screen.getByText('waiting')).toBeInTheDocument();
    await act(async () => load.resolve({ default: Word }));
    expect(screen.getByText('drawn')).toBeInTheDocument();

    // A component added later loads as it first renders: the mounted widget does not suspend again.
    const LazyLater = lazy(() => new Promise(() => {}));
    rerender(
      <Suspense fallback="waiting">
        <Probe components={[LazyLater]} label="still drawn" />
      </Suspense>
    );
    expect(screen.getByText('still drawn')).toBeInTheDocument();
  });

  test('renders at once when nothing is left to load', () => {
    render(
      <Suspense fallback="waiting">
        <Probe components={[Word]} label="drawn" />
      </Suspense>
    );
    expect(screen.getByText('drawn')).toBeInTheDocument();
  });
});
