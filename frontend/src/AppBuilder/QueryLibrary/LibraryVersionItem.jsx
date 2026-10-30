import React, { useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Button } from '@/components/ui/Button/Button';

// One row of the library version dropdown. Looks like the module dropdown's VersionDropdownItem, but takes
// callbacks instead of reading app versions from the store. A missing callback hides its action.
// `version`: a LibraryVersionView, or the draft row `{ id: 'draft', name, isDraft: true, createdFrom, description }`.
const LibraryVersionItem = ({
  version,
  isViewed,
  onView,
  onSave,
  onPromote,
  onRelease,
  onDelete,
  onCreateDraft,
  isSaveDisabled = false,
  darkMode = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slug = version.name.toLowerCase().replace(/\s+/g, '-');
  const details = [version.createdFrom && `created from ${version.createdFrom}`, version.description]
    .filter(Boolean)
    .join(' | ');

  const menuItems = version.isDraft
    ? [{ label: 'Delete draft', onClick: onDelete, danger: true }]
    : [
        { label: 'Promote', onClick: onPromote },
        { label: 'Release', onClick: onRelease },
        { label: 'Create draft version from this', onClick: onCreateDraft },
        { label: 'Delete version', onClick: version.isReleased ? undefined : onDelete, danger: true },
      ];
  const visibleItems = menuItems.filter((item) => item.onClick);

  return (
    <div
      className="version-dropdown-item tw-cursor-pointer tw-rounded-md tw-p-1.5 hover:tw-bg-interactive-hover"
      onClick={() => onView?.(version)}
      data-cy={`${slug}-library-version-item`}
    >
      <div className="tw-flex tw-items-start tw-gap-2">
        <div className="tw-h-4 tw-w-4 tw-shrink-0">
          {isViewed && <SolidIcon name="tickv3" alt="selected" width="16" height="16" />}
        </div>

        <div className="tw-min-w-0 tw-flex-grow">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
              <span
                className="tw-truncate tw-font-body-default tw-font-medium tw-text-text-default"
                data-cy={`${slug}-library-version-name`}
              >
                {version.name}
              </span>
              {version.isDraft && (
                <span className="tw-shrink-0 tw-rounded tw-bg-background-warning-weak tw-px-2 tw-font-body-small tw-font-medium tw-text-text-warning">
                  Draft
                </span>
              )}
              {version.isReleased && (
                <span className="tw-shrink-0 tw-rounded tw-bg-background-success-weak tw-px-2 tw-font-body-small tw-font-medium tw-text-text-success">
                  Released
                </span>
              )}
            </div>

            <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1" onClick={(e) => e.stopPropagation()}>
              {version.isDraft && onSave && (
                <Button
                  variant="outline"
                  size="small"
                  disabled={isSaveDisabled}
                  className={cx('version-action-btn', { 'dark-theme theme-dark': darkMode })}
                  onClick={() => onSave(version)}
                  data-cy={`${slug}-save-version-button`}
                >
                  Save version
                </Button>
              )}
              {visibleItems.length > 0 && (
                <Popover.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <Popover.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="small"
                      iconOnly
                      leadingIcon="morevertical01"
                      aria-label={`More actions for ${version.name}`}
                      className={cx({ 'dark-theme theme-dark': darkMode })}
                      data-cy={`${slug}-version-more-menu-button`}
                    />
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      align="end"
                      sideOffset={4}
                      className={cx(
                        'tw-z-[1065] tw-flex tw-min-w-40 tw-flex-col tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-py-1 tw-shadow-md',
                        { 'dark-theme theme-dark': darkMode }
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visibleItems.map(({ label, onClick, danger }) => (
                        <button
                          key={label}
                          type="button"
                          className={cx(
                            'tw-border-0 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-left tw-font-body-small hover:tw-bg-interactive-hover',
                            danger ? 'tw-text-text-danger' : 'tw-text-text-default'
                          )}
                          onClick={() => {
                            setIsMenuOpen(false);
                            onClick(version);
                          }}
                          data-cy={`${slug}-${label.toLowerCase().replace(/\s+/g, '-')}-button`}
                        >
                          {label}
                        </button>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )}
            </div>
          </div>

          {details && (
            <div
              className="tw-mt-0.5 tw-truncate tw-font-body-small tw-text-text-placeholder"
              title={details}
              data-cy={`${slug}-version-creation-details`}
            >
              {details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryVersionItem;
