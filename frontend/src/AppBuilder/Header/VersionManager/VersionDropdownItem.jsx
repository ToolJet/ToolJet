import React from 'react';
import cx from 'classnames';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import {
  PromoteVersionButton,
  ReleaseVersionButton,
} from '@/modules/common/components/BasePromoteReleaseButton/components';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';

const VersionDropdownItem = ({
  version,
  isSelected,
  onSelect,
  onRelease,
  onEdit,
  onDelete,
  onCreateVersion,
  currentEnvironment,
  environments = [],
  showActions = true,
}) => {
  const releasedVersionId = useStore((state) => state.releasedVersionId);
  const versions = useVersionManagerStore((state) => state.versions);
  const featureAccess = useStore((state) => state.license.featureAccess);

  const isDraft = version.status === 'DRAFT';
  const isPublished = version.status === 'PUBLISHED';
  // A version is released when it matches the releasedVersionId
  const isReleased = version.id === releasedVersionId;

  // Get parent version name if this is a draft
  const parentVersion = version.parentVersionId ? versions.find((v) => v.id === version.parentVersionId) : null;
  const createdFromVersionName = parentVersion?.name || version.createdFromVersion;

  // Determine if we should show promote button based on environment logic
  const currentEnvData = environments.find((env) => env.id === currentEnvironment?.id);
  const currentPriority = currentEnvData?.priority || 1;
  const isInProduction = currentPriority === 3; // Production has priority 3

  // Only show promote button if version is in the current environment
  const isVersionInCurrentEnv = version.currentEnvironmentId === currentEnvironment?.id;

  // In CE edition: show Release button for PUBLISHED versions that are not yet released
  // In EE edition: show Promote button for non-released versions in non-production environments
  const canPromote =
    featureAccess?.multiEnvironment && isVersionInCurrentEnv && !isDraft && !isReleased && !isInProduction;
  const canRelease = !isDraft && !isReleased && (featureAccess?.multiEnvironment ? isInProduction : isPublished);
  const canCreateVersion = isDraft; // Show create version button for drafts

  const renderMenu = (
    <Popover id={`popover-positioned-bottom-end`} style={{ minWidth: '160px' }}>
      <Popover.Body className="d-flex flex-column p-0">
        {canRelease && (
          <div
            className="dropdown-item cursor-pointer tj-text-xsm"
            onClick={(e) => {
              e.stopPropagation();
              onRelease?.(version);
              document.body.click(); // Close popover
            }}
          >
            Release
          </div>
        )}
        <div
          className="dropdown-item cursor-pointer tj-text-xsm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(version);
            document.body.click(); // Close popover
          }}
        >
          Edit details
        </div>
        {!isReleased && (
          <div
            className="dropdown-item cursor-pointer tj-text-xsm text-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(version);
              document.body.click(); // Close popover
            }}
          >
            Delete version
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <div
      className={cx('version-dropdown-item cursor-pointer', {
        selected: isSelected,
      })}
      onClick={() => onSelect(version)}
      style={{ padding: '6px 4px' }}
    >
      <div className="d-flex align-items-start" style={{ gap: '8px' }}>
        {/* Check icon for selected */}
        <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
          {isSelected && <SolidIcon name="tickv3" alt="selected" width="16" height="16" />}
        </div>

        {/* Version content */}
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          {/* Version name and tags */}
          <div className="d-flex align-items-center justify-content-between" style={{ gap: '8px' }}>
            <div className="d-flex align-items-center" style={{ gap: '8px', minWidth: 0 }}>
              {/* Version name */}
              <div
                className="tj-text-sm"
                style={{
                  color: 'var(--text-default)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {version.name}
              </div>

              {/* Draft tag */}
              {isDraft && (
                <span
                  className="tj-text-xsm"
                  style={{
                    backgroundColor: '#FAEFE7',
                    color: '#BF4F03',
                    padding: '0 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    lineHeight: '18px',
                    flexShrink: 0,
                  }}
                >
                  Draft
                </span>
              )}

              {/* Released tag */}
              {isReleased && !isDraft && (
                <span
                  className="tj-text-xsm"
                  style={{
                    backgroundColor: '#E8F3EB',
                    color: '#1E823B',
                    padding: '0 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    lineHeight: '18px',
                    flexShrink: 0,
                  }}
                >
                  Released
                </span>
              )}
            </div>

            {/* Action buttons */}
            {showActions && (
              <div className="d-flex align-items-center" style={{ gap: '4px', flexShrink: 0 }}>
                {/* Promote button - shown for versions that can be promoted */}
                {canPromote && <PromoteVersionButton version={version} variant="inline" />}

                {/* Release button - shown in production environment */}
                {canRelease && <ReleaseVersionButton version={version} variant="inline" />}

                {/* Create version button - shown for drafts */}
                {canCreateVersion && (
                  <button
                    className="btn btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: '1px solid var(--border-weak)',
                      backgroundColor: 'white',
                      color: 'var(--text-default)',
                      borderRadius: '4px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateVersion?.(version);
                    }}
                  >
                    Create version
                  </button>
                )}

                {/* More menu */}
                <OverlayTrigger trigger="click" placement="bottom-end" overlay={renderMenu} rootClose>
                  <button
                    className="btn btn-sm p-1"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '4px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SolidIcon name="morevertical01" />
                  </button>
                </OverlayTrigger>
              </div>
            )}
          </div>

          {/* Version metadata (created from and description combined) */}
          {(createdFromVersionName || version.description) && (
            <div
              className="tj-text-xsm"
              style={{
                color: 'var(--text-placeholder)',
                marginTop: '2px',
                fontSize: '11px',
                lineHeight: '16px',
                maxWidth: '91%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
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
};

export default VersionDropdownItem;
