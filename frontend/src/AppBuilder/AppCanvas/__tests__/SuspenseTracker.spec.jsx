/**
 * Unit coverage for SuspenseCountProvider's remount/key contract, which
 * AppCanvas.jsx's page-switch fix depends on (AppCanvas.jsx:288).
 *
 * onAllResolved only ever fires once PER PROVIDER INSTANCE — hasResolved is a
 * one-shot latch (SuspenseTracker.jsx:19-24) that never resets on its own.
 * React only creates a fresh instance (fresh latch) when the `key` prop
 * changes. AppCanvas.jsx used to key this provider on `currentPageId` alone.
 * A "switch page" CSA targeting the CURRENT page mints a fresh `pageKey`
 * (appSlice.js's isSamePage branch) but leaves `currentPageId` unchanged, so
 * the provider never remounted, onAllResolved never fired again, and the
 * exposed-value batch that switch opened never flushed. Fixed by keying on
 * `${currentPageId}-${pageKey}` instead.
 *
 * This spec tests the underlying mechanism directly rather than through
 * AppCanvas.jsx itself (a large, heavily-wired component) — it reproduces
 * the same before/after key choice with a minimal harness.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SuspenseCountProvider, TrackedSuspense } from '../SuspenseTracker';

/** A React.lazy component the test resolves on demand, instead of racing a real dynamic import. */
function createLazyChild(label) {
  let resolveImport;
  const importPromise = new Promise((resolve) => {
    resolveImport = resolve;
  });
  const LazyChild = React.lazy(() => importPromise.then(() => ({ default: () => <div>{label}</div> })));
  return { LazyChild, resolveImport, label };
}

function Harness({ providerKey, onAllResolved, LazyChild }) {
  return (
    <SuspenseCountProvider key={providerKey} onAllResolved={onAllResolved}>
      <TrackedSuspense fallback={<div>loading</div>}>
        <LazyChild />
      </TrackedSuspense>
    </SuspenseCountProvider>
  );
}

describe('SuspenseCountProvider', () => {
  test('fires onAllResolved once its pending child resolves', async () => {
    const onAllResolved = jest.fn();
    const { LazyChild, resolveImport, label } = createLazyChild('loaded-1');

    render(<Harness providerKey="page-a" onAllResolved={onAllResolved} LazyChild={LazyChild} />);
    expect(onAllResolved).not.toHaveBeenCalled();

    resolveImport();
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());

    expect(onAllResolved).toHaveBeenCalledTimes(1);
  });

  test('regression guard: re-rendering with the SAME key does not fire onAllResolved again — the bug from keying on currentPageId alone', async () => {
    const onAllResolved = jest.fn();
    const first = createLazyChild('loaded-1');

    const { rerender } = render(
      <Harness providerKey="page-a" onAllResolved={onAllResolved} LazyChild={first.LazyChild} />
    );
    first.resolveImport();
    await waitFor(() => expect(screen.getByText(first.label)).toBeInTheDocument());
    expect(onAllResolved).toHaveBeenCalledTimes(1);

    // Simulate a same-page switch under the OLD (buggy) key: a new child
    // suspends again (widgets remount, as AppCanvas's pageKey-driven inner
    // layout does), but the provider's own key is unchanged, so it's the
    // SAME instance — hasResolved is already latched true.
    const second = createLazyChild('loaded-2');
    rerender(<Harness providerKey="page-a" onAllResolved={onAllResolved} LazyChild={second.LazyChild} />);
    second.resolveImport();
    await waitFor(() => expect(screen.getByText(second.label)).toBeInTheDocument());

    expect(onAllResolved).toHaveBeenCalledTimes(1);
  });

  test('fires onAllResolved again when the key changes — the fix (key includes pageKey)', async () => {
    const onAllResolved = jest.fn();
    const first = createLazyChild('loaded-1');

    const { rerender } = render(
      <Harness providerKey="page-a-pagekey1" onAllResolved={onAllResolved} LazyChild={first.LazyChild} />
    );
    first.resolveImport();
    await waitFor(() => expect(screen.getByText(first.label)).toBeInTheDocument());
    expect(onAllResolved).toHaveBeenCalledTimes(1);

    // Simulate a same-page switch under the FIXED key: currentPageId is
    // unchanged, but pageKey is fresh (a new uuid), so the combined key
    // differs — React mounts a brand new provider instance with a fresh latch.
    const second = createLazyChild('loaded-2');
    rerender(<Harness providerKey="page-a-pagekey2" onAllResolved={onAllResolved} LazyChild={second.LazyChild} />);
    second.resolveImport();
    await waitFor(() => expect(screen.getByText(second.label)).toBeInTheDocument());

    expect(onAllResolved).toHaveBeenCalledTimes(2);
  });
});
