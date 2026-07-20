import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';

/**
 * Renders a component the way the app mounts it: inside a router and the
 * breadcrumb context. Use this instead of @testing-library/react's render
 * for anything that touches routing, links, or breadcrumbs.
 *
 *   render(<MyComponent />, { route: '/workspace/apps' })
 */
function render(ui, { route = '/', breadcrumb = { sidebarNav: null, updateSidebarNAV: jest.fn() }, ...options } = {}) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]}>
      <BreadCrumbContext.Provider value={breadcrumb}>{children}</BreadCrumbContext.Provider>
    </MemoryRouter>
  );
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { render, userEvent };
