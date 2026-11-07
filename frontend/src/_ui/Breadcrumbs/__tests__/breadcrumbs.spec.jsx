import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import { Breadcrumbs, isSameAsSection } from '../index';

jest.mock('../../Icon/SolidIcons', () => () => <span data-testid="chevron" />);

const renderAt = (path, sidebarNav) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BreadCrumbContext.Provider value={{ sidebarNav, updateSidebarNAV: () => {} }}>
        <Breadcrumbs darkMode={false} />
      </BreadCrumbContext.Provider>
    </MemoryRouter>
  );

test('the home page says "Home" once, not "Home > Home"', () => {
  const { container } = renderAt('/my-workspace/home', 'Home');
  expect(container).toHaveTextContent(/^Home$/);
  expect(screen.queryByTestId('chevron')).toBeNull();
  expect(container.querySelector('[data-cy="breadcrumb-page-title"]')).toHaveTextContent('Home');
});

test('a page under a section keeps "Section > Page"', () => {
  const { container } = renderAt('/my-workspace/modules', 'All modules');
  expect(container).toHaveTextContent('Modules');
  expect(container).toHaveTextContent('All modules');
  expect(screen.getByTestId('chevron')).toBeInTheDocument();
});

test('isSameAsSection compares the labels, ignoring case and spaces', () => {
  expect(isSameAsSection('Home', ' home ')).toBe(true);
  expect(isSameAsSection('Applications', 'All apps')).toBe(false);
  expect(isSameAsSection(undefined, 'Home')).toBe(false);
});
