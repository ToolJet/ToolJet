import React from 'react';
import { render, screen } from '@testing-library/react';
import LockedBranchBanner from '../LockedBranchBanner';

// The lock banner names the workspace's configured default branch (was hardcoded "Master").
describe('the default-branch lock banner', () => {
  it('names the configured default branch', () => {
    render(<LockedBranchBanner isVisible reason="main_config_branch" branchName="main" pageContext="apps" />);

    expect(screen.getByText('main is locked. Create a branch to add or edit apps.')).toBeInTheDocument();
  });

  it('falls back to a generic name while the branch name is unknown', () => {
    render(<LockedBranchBanner isVisible reason="main_config_branch" pageContext="apps" />);

    expect(screen.getByText('Default branch is locked. Create a branch to add or edit apps.')).toBeInTheDocument();
  });
});
