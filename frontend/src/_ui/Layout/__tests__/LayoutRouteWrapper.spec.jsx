import React from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import LayoutRouteWrapper from '../LayoutRouteWrapper';

// The real Layout pulls in the whole dashboard shell; only the wrapper's breadcrumb reset is under test.
jest.mock('../index', () => ({ children }) => <div>{children}</div>);

const Guard = ({ children }) => children;
let navigate;
const Page = ({ name }) => {
  navigate = useNavigate();
  return <div>{name}</div>;
};

function renderAt(path, updateSidebarNAV) {
  return render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<LayoutRouteWrapper darkMode={false} switchDarkMode={() => {}} guard={Guard} />}>
            <Route path="/workspace-settings/users" element={<Page name="users" />} />
            <Route path="/profile-settings" element={<Page name="profile" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </BreadCrumbContext.Provider>
  );
}

describe('LayoutRouteWrapper breadcrumb reset', () => {
  test('clears the breadcrumb on first mount', () => {
    const updateSidebarNAV = jest.fn();

    renderAt('/workspace-settings/users', updateSidebarNAV);

    expect(updateSidebarNAV).toHaveBeenCalledWith('');
  });

  test('clears the previous page breadcrumb on the first navigation after mount', () => {
    const updateSidebarNAV = jest.fn();
    renderAt('/workspace-settings/users', updateSidebarNAV);
    updateSidebarNAV.mockClear();

    act(() => navigate('/profile-settings'));

    expect(updateSidebarNAV).toHaveBeenCalledWith('');
  });
});
