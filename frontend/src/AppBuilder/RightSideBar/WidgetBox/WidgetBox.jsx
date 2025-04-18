import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { useTranslation } from 'react-i18next';

const LEGACY_WIDGETS = ['ToggleSwitch', 'DropDown', 'Multiselect', 'RadioButton', 'Datepicker', 'Modal'];
const NEW_WIDGETS = [
  'ToggleSwitchV2',
  'DropdownV2',
  'MultiselectV2',
  'RadioButtonV2',
  'DatetimePickerV2',
  'DaterangePicker',
  'DatePickerV2',
  'TimePicker',
  'ModalV2',
];

export const WidgetBox = ({ component, darkMode }) => {
  const { t } = useTranslation();
  return (
    <div style={{ height: '100%' }}>
      <div className="component-image-wrapper" style={{ height: '56px', width: '72px', position: 'relative' }}>
        <div
          className="component-image-holder d-flex flex-column justify-content-center"
          style={{ height: '100%' }}
          data-cy={`widget-list-box-${component.displayName.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {LEGACY_WIDGETS.includes(component.component) && <p className="widget-version-old-identifier">Lgcy</p>}
          {NEW_WIDGETS.includes(component.component) && <p className="widget-version-new-identifier">New</p>}
          <center>
            <div
              className="widget-svg-container"
              style={{
                width: '24px',
                height: '24px',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <WidgetIcon
                name={component.name.toLowerCase()}
                version={component?.version}
                fill={darkMode ? '#3A3F42' : '#D7DBDF'}
              />
            </div>
          </center>
        </div>
        <div className="component-title">{t(`widget.${component.name}.displayName`, component.displayName)}</div>
      </div>
    </div>
  );
};
