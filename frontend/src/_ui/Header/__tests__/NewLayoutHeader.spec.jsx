import React from 'react';
import { render, screen } from '@testing-library/react';
import NewLayoutHeader from '../NewLayoutHeader';

jest.mock('@/modules/dashboard/components', () => ({ OrganizationList: () => <div /> }));
jest.mock('@/modules/common/components/LicenseBanner', () => () => <div />);
jest.mock('../useHeaderSearch', () => ({ useHeaderSearch: () => ({}) }));
jest.mock('../SearchInput', () => () => <div />);
jest.mock('../HeaderEnvironmentSelect', () => () => <div />);
jest.mock('../BranchingActionButtons', () => () => <div data-testid="git-controls" />);

describe('NewLayoutHeader', () => {
  it('keeps the git controls, which decide for themselves which pages show them', () => {
    render(<NewLayoutHeader featureAccess={{}} />);
    expect(screen.getByTestId('git-controls')).toBeInTheDocument();
  });
});
