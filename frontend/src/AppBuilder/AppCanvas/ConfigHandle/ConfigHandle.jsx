import React from 'react';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import './configHandle.scss';
import useStore from '@/AppBuilder/_stores/store';
import { findHighestLevelofSelection } from '../Grid/gridUtils';

export const ConfigHandle = ({
  id,
  position,
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
  let height = visibility === false ? 10 : widgetHeight;
  return (
    <div
      className={`config-handle ${customClassName}`}
      style={{
        top: position === 'top' ? '-20px' : widgetTop + height - (widgetTop < 10 ? 15 : 10),
        visibility: showHandle && !isMultipleComponentsSelected ? 'visible' : 'hidden',
        left: '-1px',
      }}
    >
      <span
        style={{
          background: componentType === 'Modal' && isModalOpen ? '#c6cad0' : '#4D72FA',
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
