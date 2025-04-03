import React from 'react';
import { shallow } from 'zustand/shallow';
import './configHandle.scss';
import useStore from '@/AppBuilder/_stores/store';
import { findHighestLevelofSelection } from '../Grid/gridUtils';
import SolidIcon from '@/_ui/Icon/solidIcons/index';

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
  subContainerIndex,
}) => {
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const componentName = useStore((state) => state.getComponentDefinition(id)?.component?.name || '', shallow);
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
        (showHandle && (!isMultipleComponentsSelected || (isModal && isModalOpen)) && !anyComponentHovered))
    );
  }, shallow);

  let height = visibility === false ? 10 : widgetHeight;

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
        visibility: _showHandle ? 'visible' : 'hidden',
        left: '-1px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (componentType === 'Tabs') {
          setFocusedParentId(`${id}-${currentTab}`);
        } else {
          setFocusedParentId(id);
        }
      }}
    >
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
          <span style={{ cursor: 'pointer', marginRight: '5px' }}>
            <SolidIcon
              name="settings"
              width="12"
              height="12"
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
          </div>
        )}
      </span>
    </div>
  );
};
