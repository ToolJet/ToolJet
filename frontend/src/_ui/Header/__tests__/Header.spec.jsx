import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../index';

jest.mock('../NewLayoutHeader', () => () => <div data-testid="new-header" />);
jest.mock('../BranchingActionButtons', () => () => <div data-testid="git-controls" />);
jest.mock('../../Breadcrumbs', () => ({ Breadcrumbs: () => <nav aria-label="breadcrumbs" /> }));

const renderHeader = (props) =>
  render(
    <MemoryRouter initialEntries={['/ws-1/data-sources']}>
      <Header featureAccess={{}} {...props} />
    </MemoryRouter>
  );

describe('Header', () => {
  it('shows the existing header, with the page title and git controls, by default', () => {
    renderHeader();
    expect(screen.getByText('Data sources')).toBeInTheDocument();
    expect(screen.getByTestId('git-controls')).toBeInTheDocument();
    expect(screen.queryByTestId('new-header')).not.toBeInTheDocument();
  });

  it('shows only the redesigned header when asked to', () => {
    renderHeader({ showNewHeader: true });
    expect(screen.getByTestId('new-header')).toBeInTheDocument();
    expect(screen.queryByText('Data sources')).not.toBeInTheDocument();
  });
});
