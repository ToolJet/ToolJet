import React, { useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import {
  PromoteVersionButton,
  ReleaseVersionButton,
} from '@/modules/common/components/BasePromoteReleaseButton/components';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import { ToolTip } from '@/_components/ToolTip';
import { Button } from '@/components/ui/Button/Button';

const VersionDropdownItem = ({
  version,
  isSelected,
  isViewingCurrentEnvironment = true, // Default to true for backward compatibility
  onSelect,
  onRelease,
  onEdit,
  onDelete,
  onCreateVersion,
  currentEnvironment,
  environments = [],
  showActions = true,
  darkMode = false,
  openMenuVersionId,
  setOpenMenuVersionId,
}) => {
  const releasedVersionId = useStore((state) => state.releasedVersionId);
  const versions = useVersionManagerStore((state) => state.versions);
  const developmentVersions = useStore((state) => state.developmentVersions);
  const featureAccess = useStore((state) => state.license.featureAccess);

  const isDraft = version.status === 'DRAFT';
  const isPublished = version.status === 'PUBLISHED';
  // A version is released when it matches the releasedVersionId
  const isReleased = version.id === releasedVersionId;

  // Get parent version name - search in both current environment versions and development versions
  // This ensures we can find the parent even if it's in a different environment
  const parentVersion = version.parentVersionId
    ? versions.find((v) => v.id === version.parentVersionId) ||
      developmentVersions.find((v) => v.id === version.parentVersionId)
    : null;
  const createdFromVersionName = parentVersion?.name || version.createdFromVersion;

  const metadataRef = useRef(null);
  const [showMetadataTooltip, setShowMetadataTooltip] = useState(false);
  const [isHoveringActionButtons, setIsHoveringActionButtons] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Close menu when scrolling
  useEffect(() => {
    if (openMenuVersionId === version.id) {
      const handleScroll = () => {
        setOpenMenuVersionId?.(null);
      };

      // Find the scrollable versions list container
      const scrollContainer = document.querySelector('.versions-list');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }
  }, [openMenuVersionId, version.id, setOpenMenuVersionId]);

  // Check if metadata text is overflowing
  useEffect(() => {
    const checkOverflow = () => {
      if (metadataRef.current) {
        const isOverflowing = metadataRef.current.scrollWidth > metadataRef.current.clientWidth;
        setShowMetadataTooltip(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [version.description, createdFromVersionName]);

  // Determine if we should show promote button based on environment logic
  const currentEnvData = environments.find((env) => env.id === currentEnvironment?.id);
  const currentPriority = currentEnvData?.priority || 1;
  const isInProduction = currentPriority === 3; // Production has priority 3

  const isVersionInCurrentEnv = version.currentEnvironmentId === currentEnvironment?.id;
  const shouldShowActionButtons = isViewingCurrentEnvironment && isSelected && isVersionInCurrentEnv;

  // In CE edition: show Release button for PUBLISHED versions that are not yet released
  // In EE edition: show Promote button for non-released versions in non-production environments
  const canPromote =
    shouldShowActionButtons && featureAccess?.multiEnvironment && !isDraft && !isReleased && !isInProduction;
  const canRelease =
    shouldShowActionButtons &&
    !isDraft &&
    !isReleased &&
    (featureAccess?.multiEnvironment ? isInProduction : isPublished);
  const canCreateVersion = isDraft && shouldShowActionButtons; // Show create version button for drafts

  const renderMenu = (
    <Popover
      id={cx(`popover-positioned-bottom-end`, { 'dark-theme theme-dark': darkMode })}
      className={cx({ 'dark-theme theme-dark': darkMode })}
      style={{ minWidth: '160px' }}
    >
      <Popover.Body className={cx('d-flex flex-column p-0', { 'dark-theme theme-dark': darkMode })}>
        <div
          className={cx('dropdown-item tj-text-xsm', {
            'cursor-pointer': isDraft,
            disabled: !isDraft,
            'dark-theme theme-dark': darkMode,
          })}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDraft) return; // disable when not a draft
            onEdit?.(version);
            document.body.click(); // Close popover
          }}
          aria-disabled={!isDraft}
          data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-edit-version-button`}
        >
          Edit details
        </div>
        {!isReleased && (
          <div
            className={cx('dropdown-item cursor-pointer tj-text-xsm text-danger', {
              'dark-theme theme-dark': darkMode,
            })}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(version);
              document.body.click(); // Close popover
            }}
            data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-delete-version-button`}
          >
            Delete version
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  const isDisabled = false;

  const tooltipContent = (createdFromVersionName || version.description) && (
    <div>
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--border-weak)',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '18px',
          color: 'var(--text-default)',
        }}
      >
        {version.name}
      </div>
      <div style={{ padding: '12px 12px 8px' }}>
        {createdFromVersionName && (
          <div
            style={{
              fontSize: '12px',
              lineHeight: '18px',
              color: 'var(--text-default)',
              marginBottom: '4px',
              fontWeight: 400,
            }}
          >
            Version created from {createdFromVersionName}
          </div>
        )}
        {version.description && (
          <div
            style={{
              fontSize: '12px',
              lineHeight: '18px',
              color: 'var(--text-placeholder)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {version.description}
          </div>
        )}
      </div>
    </div>
  );

  const versionItem = (
    <div
      className={cx('version-dropdown-item', {
        disabled: isDisabled,
        'cursor-pointer': !isDisabled,
      })}
      onClick={() => !isDisabled && onSelect(version)}
      style={{ padding: '6px 4px' }}
    >
      <div className="d-flex align-items-start" style={{ gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', flexShrink: 0 }} data-cy="selected-version-icon">
          {isSelected && <SolidIcon name="tickv3" alt="selected" width="16" height="16" />}
        </div>

        <div className="flex-grow-1" style={{ minWidth: '0px' }} data-cy="version-name">
          <div className="d-flex align-items-center justify-content-between" style={{ gap: '8px' }}>
            <div className="d-flex align-items-center" style={{ gap: '8px', minWidth: 0 }}>
              <div
                className="tj-text-sm"
                style={{
                  color: 'var(--text-default)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-version-name`}
              >
                {version.name}
              </div>

              {/* Draft tag */}
              {isDraft && (
                <span
                  className="tj-text-xsm"
                  style={{
                    backgroundColor: 'var(--background-warning-weak)',
                    color: 'var(--text-warning)',
                    padding: '0 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    lineHeight: '18px',
                    flexShrink: 0,
                  }}
                  data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-draft-tag`}
                >
                  Draft
                </span>
              )}

              {/* Released tag */}
              {isReleased && !isDraft && (
                <span
                  className="tj-text-xsm"
                  style={{
                    backgroundColor: 'var(--background-success-weak)',
                    color: 'var(--text-success)',
                    padding: '0 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    lineHeight: '18px',
                    flexShrink: 0,
                  }}
                  data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-released-tag`}
                >
                  Released
                </span>
              )}
            </div>

            {/* Action buttons */}
            {showActions && (
              <div
                className="d-flex align-items-center"
                style={{ gap: '4px', flexShrink: 0 }}
                onMouseEnter={() => setIsHoveringActionButtons(true)}
                onMouseLeave={() => setIsHoveringActionButtons(false)}
              >
                {/* Promote button - shown for versions that can be promoted */}
                {canPromote && <PromoteVersionButton version={version} variant="inline" darkMode={darkMode} />}

                {/* Release button - shown in production environment */}
                {canRelease && <ReleaseVersionButton version={version} variant="inline" darkMode={darkMode} />}

                {/* Create version button - shown for drafts */}
                {canCreateVersion && (
                  <Button
                    variant="outline"
                    size="small"
                    className={cx('version-action-btn', { 'dark-theme theme-dark': darkMode })}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuVersionId?.(null);
                      onCreateVersion?.(version);
                    }}
                    data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-save-version-button`}
                  >
                    Save version
                  </Button>
                )}

                {/* More menu */}
                <OverlayTrigger
                  trigger="click"
                  placement="bottom-end"
                  overlay={renderMenu}
                  rootClose
                  show={openMenuVersionId === version.id}
                  onToggle={(show) => {
                    setIsMoreMenuOpen(show);
                    setOpenMenuVersionId?.(show ? version.id : null);
                  }}
                >
                  <Button
                    variant="ghost"
                    size="small"
                    iconOnly
                    leadingIcon="morevertical01"
                    className={cx({ 'dark-theme theme-dark': darkMode })}
                    onClick={(e) => e.stopPropagation()}
                    data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-version-more-menu-button`}
                  />
                </OverlayTrigger>
              </div>
            )}
          </div>

          {/* Version metadata (created from and description combined) */}
          {(createdFromVersionName || version.description) && (
            <div
              ref={metadataRef}
              className="tj-text-xsm"
              style={{
                color: 'var(--text-placeholder)',
                marginTop: '2px',
                fontSize: '11px',
                lineHeight: '16px',
                maxWidth: '95%',
                minWidth: '95%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              data-cy={`${version.name.toLowerCase().replace(/\s+/g, '-')}-version-creation-details`}
            >
              {createdFromVersionName && `created from ${createdFromVersionName}`}
              {createdFromVersionName && version.description && ' | '}
              {version.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap with tooltip if there's overflow metadata and not hovering action buttons or menu open
  if (showMetadataTooltip && tooltipContent && !isHoveringActionButtons && !isMoreMenuOpen) {
    return (
      <ToolTip
        message={tooltipContent}
        placement="left-start"
        show={true}
        tooltipClassName="version-tooltip"
        width="300px"
      >
        {versionItem}
      </ToolTip>
    );
  }

  return versionItem;
};

export default VersionDropdownItem;
