/**
 * FolderDeleteBlockedModal — what the user sees when deleting a data-source folder is refused
 * because the folder still holds data sources on some branch.
 *
 * Bug this guards: the refusal used to surface as a bare toast ("Folder with data sources cannot be
 * deleted"). On a folder that looks empty on the current branch that reads as a lie, and gives the
 * user nowhere to go. The backend has always sent the owning branch names alongside the message;
 * this modal is where they finally get shown.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FolderDeleteBlockedModal } from '../FolderDeleteBlockedModal';

const mount = (props) =>
  render(<FolderDeleteBlockedModal show folderName="Folder A" branches={['main']} onClose={jest.fn()} {...props} />);

describe('FolderDeleteBlockedModal', () => {
  it('should list every branch that still holds the folder data sources', () => {
    mount({ branches: ['main', 'feature-1', 'release-3'] });

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('feature-1')).toBeInTheDocument();
    expect(screen.getByText('release-3')).toBeInTheDocument();
  });

  it('should name the folder being deleted, so the message is not generic', () => {
    mount({ folderName: 'Payments' });

    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('should phrase a single owning branch in the singular', () => {
    mount({ branches: ['main'] });

    expect(screen.getByTestId('folder-delete-blocked-message')).toHaveTextContent(
      /still has data sources on the following branch:/i
    );
  });

  it('should phrase several owning branches in the plural', () => {
    mount({ branches: ['main', 'feature-1'] });

    expect(screen.getByTestId('folder-delete-blocked-message')).toHaveTextContent(
      /still has data sources on the following branches:/i
    );
  });

  it('should render nothing until it is shown', () => {
    mount({ show: false, branches: ['main'] });

    expect(screen.queryByText('main')).not.toBeInTheDocument();
  });

  it('should close on the dismiss button', () => {
    const onClose = jest.fn();
    mount({ onClose });

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('should survive a refusal that arrives without a branch list', () => {
    mount({ branches: undefined });

    expect(screen.getByTestId('folder-delete-blocked-message')).toBeInTheDocument();
  });
});
