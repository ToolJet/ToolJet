import * as React from 'react';
import PropTypes from 'prop-types';
import { DropdownMenuCheckboxItem } from '@/components/ui/Rocket/dropdown-menu';

import { Avatar, AvatarFallback } from '@/components/ui/Rocket/avatar';
import { Badge } from '@/components/ui/Rocket/badge';

/**
 * Generates initials from workspace name
 * @param {string} name - Workspace name
 * @returns {string} - 1 or 2 character initials
 */
function getWorkspaceInitials(name) {
  if (!name) return '';

  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length >= 2) {
    // Take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    // Take first 2 characters of single word
    return words[0].substring(0, 2).toUpperCase();
  }

  return '';
}

/**
 * WorkspaceListItem - A reusable component for rendering a workspace in a dropdown menu
 * @param {Object} props
 * @param {Object} props.workspace - Workspace object with name, logo, and optional plan
 * @param {number} props.index - Index of the workspace (used for keyboard shortcut)
 * @param {Function} props.onClick - Click handler for selecting the workspace
 * @param {boolean} [props.checked] - Whether the workspace is checked/selected
 * @param {Function} [props.onCheckedChange] - Handler for when checked state changes
 */
export function WorkspaceListItem({ workspace, index: _index, onClick, checked, onCheckedChange }) {
  const initials = getWorkspaceInitials(workspace.name);

  return (
    <DropdownMenuCheckboxItem
      onClick={onClick}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="tw-flex tw-justify-between gap-2 tw-px-2 pw-py-1.5 tw-pl-8 tw-w-full tw-rounded-md"
    >
      <div className="tw-flex tw-gap-1.5 tw-max-w-full tw-shrink tw-min-w-0">
        <Avatar className="tw-size-5 tw-rounded-sm">
          <AvatarFallback className="tw-text-sm  tw-rounded-sm">{initials}</AvatarFallback>
        </Avatar>
        <span className="tw-font-body-default tw-text-ellipsis tw-shrink tw-overflow-hidden tw-whitespace-nowrap tw-inline-block">
          {workspace.name}
        </span>
      </div>
      <div className="tw-shrink-0">
        <Badge variant="secondary">{workspace.plan}</Badge>
      </div>
    </DropdownMenuCheckboxItem>
  );
}

WorkspaceListItem.propTypes = {
  workspace: PropTypes.shape({
    name: PropTypes.string.isRequired,
    logo: PropTypes.elementType.isRequired,
    plan: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
};

export default WorkspaceListItem;
