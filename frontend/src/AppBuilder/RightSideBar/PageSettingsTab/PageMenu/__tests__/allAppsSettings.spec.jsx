import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AllAppsSettings } from '../AddNewPagePopup';

const allApps = (overrides) => ({
  id: 'p-all',
  type: 'all_apps',
  groupByFolder: true,
  pageGroupId: null,
  ...overrides,
});
// The popup tags its controls with data-cy, like the rest of the page menu.
const byCy = (name) => document.querySelector(`[data-cy="${name}"]`);
const groupByFolderSwitch = () => byCy('all-apps-group-by-folder');

describe('AllAppsSettings', () => {
  it('lets the builder turn Group by folder on and off for a top-level item', () => {
    const onGroupByFolderChange = jest.fn();
    render(<AllAppsSettings page={allApps({ groupByFolder: false })} onGroupByFolderChange={onGroupByFolderChange} />);

    expect(groupByFolderSwitch()).toBeEnabled();
    fireEvent.click(groupByFolderSwitch());

    expect(onGroupByFolderChange).toHaveBeenCalledWith(true);
    expect(byCy('all-apps-group-by-folder-hint')).toBeNull();
  });

  it('shows Group by folder as off and explains why when the item sits inside a nav group', () => {
    render(<AllAppsSettings page={allApps({ pageGroupId: 'g-1' })} onGroupByFolderChange={jest.fn()} />);

    expect(groupByFolderSwitch()).toBeDisabled();
    expect(groupByFolderSwitch()).not.toBeChecked();
    expect(byCy('all-apps-group-by-folder-hint')).toHaveTextContent("Folders can't be grouped inside a nav group");
  });
});
