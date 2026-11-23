import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { GitCommitStatusTag, formatCommitTimestamp } from '../index';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn() } }));

const commit = {
  sha: 'a3f9c21b4e7d8f0a1c2b3d4e5f60718293a4b5c6',
  message: 'Add sales dashboard filters',
  at: '2026-11-13T10:42:00.000Z',
};

// The app marks elements with data-cy, not RTL's default data-testid.
const cy = (value) => document.querySelector(`[data-cy="${value}"]`);
const openTag = () => fireEvent.click(cy('uncommitted-changes-tag'));

beforeAll(() => {
  // The timestamp renders in local time; pin the formatter's inputs instead of the machine's zone.
  jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Nov 13, 2026');
  jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:42 AM');
});

afterAll(() => jest.restoreAllMocks());

describe('GitCommitStatusTag', () => {
  describe('with uncommitted changes', () => {
    it('should show the warning tag and open a dropdown over the synced commit', () => {
      render(<GitCommitStatusTag hasUncommittedChanges commit={commit} />);

      expect(cy('uncommitted-changes-tag')).toHaveTextContent('Uncommitted changes');
      openTag();

      expect(cy('git-commit-status-local-changes')).toHaveTextContent('Local changes');
      expect(cy('git-commit-status-local-changes')).toHaveTextContent('Not committed yet');
      expect(cy('git-commit-status-commit')).toHaveTextContent('a3f9c21');
      expect(cy('git-commit-status-commit')).toHaveTextContent('Add sales dashboard filters');
      expect(cy('git-commit-status-commit')).toHaveTextContent('Nov 13, 2026 · 10:42 AM');
    });

    it('should show the extra local-changes line only when one is given', () => {
      const { rerender } = render(<GitCommitStatusTag hasUncommittedChanges commit={commit} />);
      openTag();
      expect(screen.queryByText('3 uncommitted changes in the apps section')).not.toBeInTheDocument();

      rerender(
        <GitCommitStatusTag
          hasUncommittedChanges
          commit={commit}
          localChangesLabel="3 uncommitted changes in the apps section"
        />
      );
      expect(screen.getByText('3 uncommitted changes in the apps section')).toBeInTheDocument();
    });

    it('should keep the tag but not open a dropdown when no commit is recorded', () => {
      render(<GitCommitStatusTag hasUncommittedChanges commit={null} />);

      const tag = cy('uncommitted-changes-tag');
      expect(tag).toHaveTextContent('Uncommitted changes');
      fireEvent.click(tag);
      expect(cy('git-commit-status-popover')).not.toBeInTheDocument();
    });
  });

  describe('without uncommitted changes', () => {
    it('should show the commit SHA and a dropdown that says nothing is uncommitted', () => {
      render(<GitCommitStatusTag hasUncommittedChanges={false} commit={commit} />);

      expect(cy('uncommitted-changes-tag')).toHaveTextContent('a3f9c21');
      openTag();

      expect(screen.getByText('No uncommitted changes')).toBeInTheDocument();
      expect(cy('git-commit-status-local-changes')).not.toBeInTheDocument();
      expect(cy('git-commit-status-connector')).not.toBeInTheDocument();
      expect(cy('git-commit-status-commit')).toHaveTextContent('Add sales dashboard filters');
      expect(cy('git-commit-status-commit').querySelector('.tw-bg-background-success-weak')).toBeTruthy();
    });

    it('should render nothing when no commit is recorded', () => {
      const { container } = render(<GitCommitStatusTag hasUncommittedChanges={false} commit={null} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  it('should copy the full SHA, not the shortened one', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<GitCommitStatusTag hasUncommittedChanges={false} commit={commit} />);
    openTag();

    fireEvent.click(cy('git-commit-status-copy-sha'));

    expect(writeText).toHaveBeenCalledWith(commit.sha);
  });

  it('should mark each timeline entry with a haloed dot in its own tone', () => {
    render(<GitCommitStatusTag hasUncommittedChanges commit={commit} />);
    openTag();

    // Dirty: the local change is the warning entry, the commit it sits above is muted.
    expect(cy('git-commit-status-local-changes').querySelector('.tw-bg-background-warning-weak')).toBeTruthy();
    expect(cy('git-commit-status-commit').querySelector('.tw-bg-icon-weak')).toBeTruthy();
    // The two entries are joined by the painted 1px line, not a (far heavier) dashed border.
    expect(cy('git-commit-status-connector')).toBeInTheDocument();
    expect(cy('git-commit-status-connector')).not.toHaveClass('tw-border-dashed');
  });

  it('should stand as tall as the share button beside it, with no surface until it is open', () => {
    render(<GitCommitStatusTag hasUncommittedChanges={false} commit={commit} />);

    // The shared ghost Button's own height — what keeps the header row aligned.
    expect(cy('uncommitted-changes-tag')).toHaveClass('tw-h-[32px]');
    expect(cy('uncommitted-changes-tag')).not.toHaveClass('tw-bg-button-outline-hover');
    openTag();

    expect(cy('uncommitted-changes-tag')).toHaveClass('tw-bg-button-outline-hover');
  });

  it('should close the dropdown from its close button', () => {
    render(<GitCommitStatusTag hasUncommittedChanges commit={commit} />);
    openTag();

    fireEvent.click(cy('git-commit-status-popover-close'));

    expect(cy('git-commit-status-popover')).not.toBeInTheDocument();
  });
});

describe('formatCommitTimestamp', () => {
  it('should drop the line for a missing or unparseable timestamp', () => {
    expect(formatCommitTimestamp(null)).toBeNull();
    expect(formatCommitTimestamp('not a date')).toBeNull();
  });
});
