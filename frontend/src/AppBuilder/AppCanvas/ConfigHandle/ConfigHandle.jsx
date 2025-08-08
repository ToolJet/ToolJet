import React from 'react';
import { shallow } from 'zustand/shallow';
import './configHandle.scss';
import useStore from '@/AppBuilder/_stores/store';
import { findHighestLevelofSelection } from '../Grid/gridUtils';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
import { ToolTip } from '@/_components/ToolTip';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { DROPPABLE_PARENTS } from '../appCanvasConstants';
import { Tooltip } from 'react-tooltip';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const CONFIG_HANDLE_HEIGHT = 20;
const BUFFER_HEIGHT = 1;

export const ConfigHandle = ({
  id,
  widgetTop,
  widgetHeight,
  setSelectedComponentAsModal = () => null, //! Only Modal widget passes this uses props down. All other widgets use selecto lib
  isModalOpen = false,
  customClassName = '',
  showHandle,
  componentType,
  visibility,
  isModuleContainer,
  subContainerIndex,
}) => {
  const { moduleId } = useModuleContext();
  const isLicenseValid = useStore((state) => state.isLicenseValid(), shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const componentName = useStore((state) => state.getComponentDefinition(id, moduleId)?.component?.name || '', shallow);
  const isMultipleComponentsSelected = useStore(
    (state) => (findHighestLevelofSelection(state?.selectedComponents)?.length > 1 ? true : false),
    shallow
  );
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);
  const currentTab = useStore(
    (state) => componentType === 'Tabs' && state.getExposedValueOfComponent(id)?.currentTab,
    shallow
  );
  const position = widgetTop < 15 ? 'bottom' : 'top';

  const setComponentToInspect = useStore((state) => state.setComponentToInspect);
  const isModal = componentType === 'Modal' || componentType === 'ModalV2';
  const _showHandle = useStore((state) => {
    const isWidgetHovered = state.getHoveredComponentForGrid() === id || state.hoveredComponentBoundaryId === id;
    const anyComponentHovered = state.getHoveredComponentForGrid() !== '' || state.hoveredComponentBoundaryId !== '';
    // If one component is hovered and one is selected, show the handle for the hovered component
    return (
      (subContainerIndex === 0 || subContainerIndex === null) &&
      (isWidgetHovered ||
        isModuleContainer ||
        (showHandle && (!isMultipleComponentsSelected || (isModal && isModalOpen)) && !anyComponentHovered))
    );
  }, shallow);

  const currentPageIndex = useStore((state) => state.modules.canvas.currentPageIndex);
  const component = useStore((state) => state.modules.canvas.pages[currentPageIndex]?.components[id]);
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const isRestricted = component?.permissions && component?.permissions?.length !== 0;
  const draggingComponentId = useStore((state) => state.draggingComponentId);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);

  let height = visibility === false ? 10 : widgetHeight;

  const getTooltip = () => {
    const permission = component.permissions?.[0];
    if (!permission) return null;

    const users = permission.groups || permission.users || [];
    if (users.length === 0) return null;

    const isSingle = permission.type === 'SINGLE';
    const isGroup = permission.type === 'GROUP';

    if (isSingle) {
      return users.length === 1
        ? `Access restricted to ${users[0].user.email}`
        : `Access restricted to ${users.length} users`;
    }

    if (isGroup) {
      return users.length === 1
        ? `Access restricted to ${users[0].permission_group?.name || users[0].permissionGroup?.name} group`
        : `Access restricted to ${users.length} user groups`;
    }

    return null;
  };

  return (
    <div
      className={`config-handle ${customClassName}`}
      widget-id={id}
      style={{
        top:
          componentType === 'Modal' && isModalOpen
            ? '0px'
            : position === 'top'
            ? '-20px'
            : `${height - (CONFIG_HANDLE_HEIGHT + BUFFER_HEIGHT)}px`,
        visibility: _showHandle || visibility === false ? 'visible' : 'hidden',
        left: '-1px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (componentType === 'Tabs') {
          setFocusedParentId(`${id}-${currentTab}`);
        } else {
          if (DROPPABLE_PARENTS.has(componentType)) {
            setFocusedParentId(id);
          }
        }
      }}
      data-tooltip-id={`invalid-license-modules-${componentName?.toLowerCase()}`}
      data-tooltip-html="Your plan is expired. <br/> Renew to use the modules."
      data-tooltip-place="right"
    >
      {licenseValid && isRestricted && (
        <ToolTip message={getTooltip()} show={licenseValid && isRestricted && !draggingComponentId}>
          <span
            style={{
              background:
                visibility === false ? '#c6cad0' : componentType === 'Modal' && isModalOpen ? '#c6cad0' : '#4D72FA',
              border: position === 'bottom' ? '1px solid white' : 'none',
              color: visibility === false && 'var(--text-placeholder)',
              marginRight: '4px',
            }}
            className="badge handle-content"
          >
            <SolidIcon width="12" name="lock" fill="var(--icon-on-solid)" />
          </span>
        </ToolTip>
      )}
      <span
        style={{
          background:
            visibility === false ? '#c6cad0' : componentType === 'Modal' && isModalOpen ? '#c6cad0' : '#4D72FA',
          border: position === 'bottom' ? '1px solid white' : 'none',
          color: visibility === false && 'var(--text-placeholder)',
        }}
        className="badge handle-content"
      >
        <div
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.preventDefault();
            setSelectedComponentAsModal(id);
          }}
          role="button"
          data-cy={`${componentName?.toLowerCase()}-config-handle`}
          className="text-truncate"
        >
          {/* Settings Icon */}
          <span
            onClick={() => {
              setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
              setRightSidebarOpen(true);
            }}
            style={{ cursor: 'pointer', marginRight: '5px' }}
          >
            <SolidIcon
              name="propertiesstyles"
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill={visibility === false ? 'var(--text-placeholder)' : '#fff'}
            />
          </span>
          <span>{componentName}</span>
          {/* Divider */}
          <hr
            style={{
              marginLeft: '10px',
              height: '12px',
              width: '2px',
              backgroundColor: visibility === false ? 'var(--text-placeholder)' : '#fff',
              opacity: 0.5,
            }}
          />
        </div>
        {/* Delete Button */}
        {!isMultipleComponentsSelected && !shouldFreeze && (
          <div>
            <img
              style={{ cursor: 'pointer', marginLeft: '5px' }}
              src="assets/images/icons/inspect.svg"
              width="12"
              role="button"
              height="12"
              draggable="false"
              onClick={() => setComponentToInspect(componentName)}
              data-cy={`${componentName.toLowerCase()}-inspect-button`}
              className="config-handle-inspect"
            />
            {!isModuleContainer && (
              <span
                style={{ cursor: 'pointer', marginLeft: '5px' }}
                onClick={() => {
                  deleteComponents([id]);
                }}
                data-cy={`${componentName.toLowerCase()}-delete-button`}
              >
                <SolidIcon
                  name="trash"
                  width="12"
                  height="12"
                  fill={visibility === false ? 'var(--text-placeholder)' : '#fff'}
                />
              </span>
            )}
          </div>
        )}
      </span>
      {/* Tooltip for invalid license on ModuleViewer */}
      {!isLicenseValid && componentType === 'ModuleViewer' && (
        <Tooltip
          id={`invalid-license-modules-${componentName?.toLowerCase()}`}
          className="tooltip"
          isOpen={_showHandle && componentType === 'ModuleViewer'}
          style={{ textAlign: 'center' }}
        />
      )}
    </div>
  );
};
