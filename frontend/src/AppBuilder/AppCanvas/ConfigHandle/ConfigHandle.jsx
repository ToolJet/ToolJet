import React from 'react';
import { shallow } from 'zustand/shallow';
import './configHandle.scss';
import useStore from '@/AppBuilder/_stores/store';
import { findHighestLevelofSelection } from '../Grid/gridUtils';

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

  let height = visibility === false ? 10 : widgetHeight;

  return (
    <div
      className={`config-handle ${customClassName}`}
      widget-id={id}
      style={{
        top: position === 'top' ? '-20px' : `${height - (CONFIG_HANDLE_HEIGHT + BUFFER_HEIGHT)}px`,
        visibility:
          showHandle && (!isMultipleComponentsSelected || (componentType === 'Modal' && isModalOpen))
            ? 'visible'
            : 'hidden',
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
          background: componentType === 'Modal' && isModalOpen ? '#c6cad0' : '#4D72FA',
          border: position === 'bottom' ? '1px solid white' : 'none',
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
          <img
            style={{ cursor: 'pointer', marginRight: '5px', verticalAlign: 'middle' }}
            src="assets/images/icons/settings.svg"
            width="12"
            height="12"
            draggable="false"
          />
          <span>{componentName}</span>
        </div>
        {!isMultipleComponentsSelected && !shouldFreeze && (
          <div className="delete-part">
            <img
              style={{ cursor: 'pointer', marginLeft: '5px' }}
              src="assets/images/icons/trash-light.svg"
              width="12"
              role="button"
              height="12"
              draggable="false"
              onClick={() => {
                deleteComponents([id]);
              }}
              data-cy={`${componentName.toLowerCase()}-delete-button`}
              className="delete-icon"
            />
          </div>
        )}
      </span>
    </div>
  );
};
