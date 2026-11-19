import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

/**
 * Renders a component inside a router and a fresh react-query client (the app mounts one at the root, so any
 * component may call useQuery). Feature-specific providers stay explicit in each test or adapter.
 *
 *   render(<MyComponent />, { route: '/workspace/apps' })
 */
function render(ui, { route = '/', ...options } = {}) {
  // One client per render, so no spec reads another's cache; no retries, so a refused request fails at once.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export RTL's public helpers while intentionally replacing its render.
// eslint-disable-next-line import/export
export * from '@testing-library/react';
// eslint-disable-next-line import/export
export { render, userEvent };
