import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { useTranslation } from 'react-i18next';
import { getWidgetVersionLabel } from './widgetVersionLabel';

export const WidgetBox = ({ component, darkMode }) => {
  const { t } = useTranslation();
  const versionLabel = getWidgetVersionLabel(component.component);
  return (
    <div style={{ height: '100%' }}>
      <div className="component-image-wrapper" style={{ height: '56px', width: '72px', position: 'relative' }}>
        <div
          className="component-image-holder d-flex flex-column justify-content-center"
          style={{ height: '100%' }}
          data-cy={`widget-list-box-${component.displayName.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {versionLabel && <p className="widget-version-beta-identifier">{versionLabel}</p>}
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
