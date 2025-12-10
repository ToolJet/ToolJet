import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Rocket/input';
import { Button } from '@/components/ui/Button/Button';
import {
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/Rocket/dropdown-menu';
import { cn } from '@/lib/utils';

export function FolderSelector({
  folders = [],
  currentFolder = null,
  onFolderChange = null,
  onNewFolder = null,
  searchPlaceholder = 'Search folders',
  allAppsLabel = 'All apps',
  newFolderLabel = 'New folder',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize filtered folders - only recompute when folders or searchQuery changes
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }
    const query = searchQuery.toLowerCase();
    return folders.filter((folder) => folder.name?.toLowerCase().includes(query));
  }, [folders, searchQuery]);

  // Check if "All apps" is selected (null, undefined, or empty object)
  const isAllAppsSelected =
    !currentFolder || (typeof currentFolder === 'object' && Object.keys(currentFolder).length === 0);

  const handleFolderSelect = (folder) => {
    onFolderChange?.(folder);
  };

  const handleNewFolder = () => {
    onNewFolder?.();
  };

  return (
    <>
      {/* Search Input */}
      <div className="tw-flex tw-flex-col tw-gap-2 tw-px-0 tw-mt-1">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <div className="tw-flex tw-gap-1.5 tw-items-center tw-h-8 tw-px-3 tw-py-1.5 tw-rounded-md tw-bg-background-surface-layer-01">
            <Search className="tw-shrink-0 tw-w-[14px] tw-h-[14px] tw-text-icon-weak" />
            <Input
              type="text"
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-ring-0 focus-visible:tw-outline-none tw-shadow-none'
              )}
            />
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Folder List */}
      <DropdownMenuGroup className="tw-px-2 tw-pt-2 tw-pb-1">
        {/* All apps option */}
        <DropdownMenuCheckboxItem
          checked={isAllAppsSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              handleFolderSelect(null);
            }
          }}
          onClick={() => handleFolderSelect(null)}
          className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1.5 tw-rounded-md tw-w-full tw-pl-8"
        >
          <span className="tw-font-body-small tw-text-text-default">{allAppsLabel}</span>
        </DropdownMenuCheckboxItem>

        {/* Folder items */}
        {filteredFolders.length > 0 &&
          filteredFolders.map((folder) => (
            <DropdownMenuCheckboxItem
              key={folder.id}
              checked={currentFolder?.id === folder.id}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleFolderSelect(folder);
                }
              }}
              onClick={() => handleFolderSelect(folder)}
              className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1.5 tw-rounded-[6px] tw-w-full tw-pl-8"
            >
              <span className="tw-font-body-small tw-text-text-default">{folder.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      {/* New Folder Button */}
      <DropdownMenuGroup className="tw-px-2 tw-pt-1 tw-pb-2">
        <Button variant="ghost" size="default" className="tw-w-full tw-justify-center" onClick={handleNewFolder}>
          <Plus width={16} height={16} />
          <span className="tw-font-body-default !tw-font-medium tw-text-text-default">{newFolderLabel}</span>
        </Button>
      </DropdownMenuGroup>
    </>
  );
}

FolderSelector.propTypes = {
  folders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  currentFolder: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  onFolderChange: PropTypes.func,
  onNewFolder: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  allAppsLabel: PropTypes.string,
  newFolderLabel: PropTypes.string,
};
