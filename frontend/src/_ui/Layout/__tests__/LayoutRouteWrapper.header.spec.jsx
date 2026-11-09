import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import LayoutRouteWrapper from '../LayoutRouteWrapper';

// The real Layout pulls in the whole dashboard shell; only the prop the wrapper hands it is under test.
const mockLayout = jest.fn(({ children }) => <div>{children}</div>);
jest.mock('../index', () => (props) => mockLayout(props));

const Guard = ({ children }) => children;

function renderAt(path) {
  return render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV: () => {} }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<LayoutRouteWrapper darkMode={false} switchDarkMode={() => {}} guard={Guard} />}>
            <Route path="/:workspaceId/workspace-constants" element={<div>constants</div>} />
            <Route path="/:workspaceId/workspace-constants/extra" element={<div>extra</div>} />
            <Route path="/:workspaceId/workspace-settings/users" element={<div>users</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </BreadCrumbContext.Provider>
  );
}

const lastShowNewHeader = () => mockLayout.mock.calls.at(-1)[0].showNewHeader;

describe('LayoutRouteWrapper header', () => {
  beforeEach(() => mockLayout.mockClear());

  it('shows the redesigned header on the workspace constants page', () => {
    renderAt('/ws-1/workspace-constants');
    expect(lastShowNewHeader()).toBe(true);
  });

  it('keeps the existing header on a page below the constants page', () => {
    renderAt('/ws-1/workspace-constants/extra');
    expect(lastShowNewHeader()).toBe(false);
  });

  it('keeps the existing header on other pages', () => {
    renderAt('/ws-1/workspace-settings/users');
    expect(lastShowNewHeader()).toBe(false);
  });
});
