import React from 'react';
import { render, screen } from '@testing-library/react';
import NewLayoutHeader from '../NewLayoutHeader';

const mockSearch = { hidden: false };
jest.mock('@/modules/dashboard/components', () => ({ OrganizationList: () => <div /> }));
jest.mock('@/modules/common/components/LicenseBanner', () => () => <div />);
jest.mock('../useHeaderSearch', () => ({ useHeaderSearch: () => mockSearch }));
jest.mock('../SearchInput', () => () => <div data-testid="search" />);
jest.mock('../HeaderEnvironmentSelect', () => () => <div data-testid="env-select" />);
jest.mock('../BranchingActionButtons', () => () => <div data-testid="git-controls" />);

describe('NewLayoutHeader', () => {
  beforeEach(() => {
    mockSearch.hidden = false;
  });

  it('keeps the git controls, which decide for themselves which pages show them', () => {
    render(<NewLayoutHeader featureAccess={{}} />);
    expect(screen.getByTestId('git-controls')).toBeInTheDocument();
  });

  it('shows the search unless the page hides it', () => {
    render(<NewLayoutHeader featureAccess={{}} />);
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });

  it('drops the search when the page hides it, and keeps the right group in the last column', () => {
    mockSearch.hidden = true;
    render(<NewLayoutHeader featureAccess={{}} />);
    expect(screen.queryByTestId('search')).not.toBeInTheDocument();
    expect(screen.getByTestId('env-select').parentElement).toHaveClass('tw-col-start-3');
  });
});
