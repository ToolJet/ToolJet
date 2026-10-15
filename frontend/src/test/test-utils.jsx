import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

/**
 * Renders a component inside a router. Feature-specific providers stay
 * explicit in each test or adapter.
 *
 *   render(<MyComponent />, { route: '/workspace/apps' })
 */
function render(ui, { route = '/', ...options } = {}) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </MemoryRouter>
  );
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export RTL's public helpers while intentionally replacing its render.
// eslint-disable-next-line import/export
export * from '@testing-library/react';
// eslint-disable-next-line import/export
export { render, userEvent };
