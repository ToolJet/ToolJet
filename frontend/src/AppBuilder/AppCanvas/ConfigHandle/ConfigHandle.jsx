import React, { useState, useRef } from 'react';
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
import MentionComponentInChat from './MentionComponentInChat';
import ConfigHandleButton from '../../../_components/ConfigHandleButton';
import { SquareDashedMousePointer, PencilRuler, Lock, VectorSquare, EyeClosed, Trash } from 'lucide-react';
import Popover from '@/_ui/Popover';
import DynamicHeightInfo from '@assets/images/dynamic-height-info.svg';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const CONFIG_HANDLE_HEIGHT = 20;
const BUFFER_HEIGHT = 1;

export const ConfigHandle = ({
  id,
  readOnly,
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
  isDynamicHeightEnabled,
}) => {
  const { moduleId } = useModuleContext();
  const isModulesEnabled = useStore((state) => state.license.featureAccess?.modulesEnabled, shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const componentName = useStore((state) => state.getComponentDefinition(id, moduleId)?.component?.name || '', shallow);
  const isMultipleComponentsSelected = useStore(
    (state) => (findHighestLevelofSelection(state?.selectedComponents)?.length > 1 ? true : false),
    shallow
  );
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);
  const currentTab = useStore(
    (state) => componentType === 'Tabs' && state.getExposedValueOfComponent(id)?.currentTab,
    shallow
  );
  const [hideDynamicHeightInfo, setHideDynamicHeightInfo] = useState(
    localStorage.getItem('hideDynamicHeightInfo') === 'true'
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const timeoutRef = useRef(null);
  const position = widgetTop < 15 ? 'bottom' : 'top';

  const setComponentToInspect = useStore((state) => state.setComponentToInspect);
  const isModal = componentType === 'Modal' || componentType === 'ModalV2';
  const _showHandle = useStore((state) => {
    const isWidgetHovered = state.getHoveredComponentForGrid() === id || state.hoveredComponentBoundaryId === id;
    const anyComponentHovered = state.getHoveredComponentForGrid() !== '' || state.hoveredComponentBoundaryId !== '';
    // If one component is hovered and one is selected, show the handle for the hovered component
    return (
      ((subContainerIndex === 0 || subContainerIndex === null) && (isModuleContainer || (isModal && isModalOpen))) ||
      isWidgetHovered ||
      (showHandle && !isMultipleComponentsSelected && !anyComponentHovered)
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

  const deleteComponents = () => {
    const selectedComponents = getSelectedComponents();
    if (selectedComponents.length > 0) {
      setWidgetDeleteConfirmation(true);
    }
  };

  const getTooltip = () => {
    const permission = component.permissions?.[0];
    if (!permission) return 'Access restricted';

    const users = permission.groups || permission.users || [];
    if (users.length === 0) return 'Access restricted';

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

    return 'Access restricted';
  };

  const isHiddenOrModalOpen = visibility === false || (componentType === 'Modal' && isModalOpen);
  const getConfigHandleButtonStyle = isHiddenOrModalOpen
    ? {
      background: 'var(--interactive-selected)',
      color: 'var(--text-default)',
      padding: '2px 6px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '6px',
      height: '24px',
    }
    : {
      color: 'var(--text-on-solid)',
      padding: '2px 6px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '6px',
      height: '24px',
    };
  if (isDynamicHeightEnabled && !isHiddenOrModalOpen) {
    getConfigHandleButtonStyle.background = '#9747FF';
  }

  const iconOnlyButtonStyle = {
    height: '24px',
    width: '24px',
    cursor: 'pointer',
    background: 'var(--background-surface-layer-01)',
    border: '1px solid var(--border-weak)',
  };

  const handleMouseEnter = () => {
    if (hideDynamicHeightInfo) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    if (hideDynamicHeightInfo) return;
    timeoutRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 50); // Small delay to allow moving mouse to popover
  };

  const popoverContent = (
    <div className="dynamic-height-info-wrapper" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="dynamic-height-info-image">
        <DynamicHeightInfo />
      </div>
      <div className="dynamic-height-info-body">
        <p className="dynamic-height-info-text-title">Dynamic Height enabled</p>
        <p className="dynamic-height-info-text-description">
          Your component expands based on content but won&apos;t shrink below the height you set on canvas.
        </p>
      </div>
      <div className="dynamic-height-info-button">
        <ButtonComponent
          size="medium"
          variant="outline"
          onClick={() => {
            localStorage.setItem('hideDynamicHeightInfo', 'true');
            setIsPopoverOpen(false);
            setHideDynamicHeightInfo(true);
          }}
        >
          Never show this again
        </ButtonComponent>
      </div>
    </div>
  );

  if (readOnly) {
    return null;
  }


  return (
    <div
      className={`config-handle ${customClassName}`}
      widget-id={id}
      style={{
        top:
          componentType === 'Modal' && isModalOpen
            ? '0px'
            : position === 'top'
              ? '-26px'
              : `${height - (CONFIG_HANDLE_HEIGHT + BUFFER_HEIGHT)}px`,
        visibility: _showHandle || visibility === false ? 'visible' : 'hidden',
        left: '-1px',
        display: 'flex',
        flexDirection: 'row',
        gap: '2px',
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
      <ConfigHandleButton customStyles={getConfigHandleButtonStyle} className="no-hover component-name-btn">
        {isDynamicHeightEnabled && (
          <Popover
            open={isPopoverOpen}
            side="bottom-start"
            popoverContent={popoverContent}
            popoverContentClassName="dynamic-height-info-popover"
          >
            <div
              style={{ cursor: 'pointer' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <ToolTip message="Dynamic height enabled" show={hideDynamicHeightInfo} delay={{ show: 500, hide: 50 }}>
                <VectorSquare
                  size={14}
                  color={
                    isDynamicHeightEnabled && !isHiddenOrModalOpen ? 'var(--icon-on-solid)' : 'var(--icon-default)'
                  }
                />
              </ToolTip>
            </div>
          </Popover>
        )}
        {!visibility && (
          <div>
            <EyeClosed
              size={14}
              color={isDynamicHeightEnabled && !isHiddenOrModalOpen ? 'var(--icon-on-solid)' : 'var(--icon-default)'}
            />
          </div>
        )}
        <span>{componentName}</span>
      </ConfigHandleButton>

      <ConfigHandleButton
        customStyles={iconOnlyButtonStyle}
        onClick={() => setComponentToInspect(componentName)}
        message="State inspector"
        show={true}
        dataCy={`${componentName.toLowerCase()}-inspect-button`}
      >
        <SquareDashedMousePointer size={14} color="var(--icon-strong)" />
      </ConfigHandleButton>

      <ConfigHandleButton
        customStyles={iconOnlyButtonStyle}
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
          setRightSidebarOpen(true);
        }}
        message="Properties & Styles"
        show={true}
        dataCy={`${componentName.toLowerCase()}-properties-styles-button`}
      >
        <PencilRuler size={14} color="var(--icon-strong)" />
      </ConfigHandleButton>

      {licenseValid && isRestricted && (
        <ConfigHandleButton
          customStyles={iconOnlyButtonStyle}
          message={getTooltip()}
          show={licenseValid && isRestricted && !draggingComponentId}
          dataCy={`${componentName.toLowerCase()}-permissions-button`}
        >
          <Lock size={14} color="var(--icon-strong)" />
        </ConfigHandleButton>
      )}
      {!isMultipleComponentsSelected && !shouldFreeze && <MentionComponentInChat componentName={componentName} />}
      <ConfigHandleButton
        customStyles={iconOnlyButtonStyle}
        onClick={() => {
          !shouldFreeze && deleteComponents();
        }}
        message="Delete component"
        show={true}
        dataCy={`${componentName.toLowerCase()}-delete-component-button`}
        shouldHide={shouldFreeze}
      >
        <Trash size={14} color="var(--icon-strong)" />
      </ConfigHandleButton>
      {/* Tooltip for invalid license on ModuleViewer */}
      {(componentType === 'ModuleViewer' || componentType === 'ModuleContainer') && !isModulesEnabled && (
        <Tooltip
          delay={{ show: 500, hide: 50 }}
          id={`invalid-license-modules-${componentName?.toLowerCase()}`}
          className="tooltip"
          isOpen={_showHandle && (componentType === 'ModuleViewer' || componentType === 'ModuleContainer')}
          style={{ textAlign: 'center' }}
        />
      )}
    </div>
  );
};
