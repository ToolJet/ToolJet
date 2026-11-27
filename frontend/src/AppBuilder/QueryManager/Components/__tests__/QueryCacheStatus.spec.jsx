import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryCacheStatus } from '../QueryCacheStatus';

describe('query response cache status', () => {
  // Break this catches: treating an unstored response as saved or guessing why storage failed.
  test.each([
    [{ status: 'hit', ageMs: 120000 }, 'Cache hit · saved 2 min before this run'],
    [{ status: 'hit' }, 'Cache hit'],
    [{ status: 'miss', stored: true }, 'Cache miss · saved'],
    [{ status: 'miss', stored: false }, 'Cache miss · not saved'],
    [{ status: 'refresh', stored: true }, 'Cache refresh · saved'],
    [{ status: 'refresh', stored: false }, 'Cache refresh · not saved'],
    [{ status: 'bypass' }, 'Cache bypassed'],
  ])('[QueryCache-STATUS-001] renders the metadata outcome %j', (metadata, label) => {
    render(<QueryCacheStatus cache={metadata} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
    expect(screen.queryByText(/cache full|too large/i)).not.toBeInTheDocument();
  });

  // Break this catches: showing a cache result for CE, a failed run, or absent metadata.
  test.each([undefined, null, {}, { status: 'unknown' }])(
    '[QueryCache-STATUS-002] hides absent or unsupported metadata %j',
    (cache) => {
      const { container } = render(<QueryCacheStatus cache={cache} />);
      expect(container).toBeEmptyDOMElement();
    }
  );
});
