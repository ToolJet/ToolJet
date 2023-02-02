import React from 'react';
import './AppCard.scss';
import '../../_styles/typography.scss';
import { ButtonSolid } from '../AppButton/AppButton';
import { AppMenu } from '../../HomePage/AppMenu';

function AppCard(props) {
  const { appname, editTime, className, leftButtonName, rightButtonName } = props;
  return (
    <div className={`tj-app-card ${className && className}`}>
      <img src="https://cdn-icons-png.flaticon.com/512/748/748113.png" />

      <div className="tj-app-card-menu">
        <AppMenu />
      </div>

      <p className="tj-para-md tj-app-card-name">{appname}</p>
      <p className="tj-text-xsm tj-app-card-time">{editTime}</p>
      <div className="tj-app-card-btn-wrap">
        <div>
          <ButtonSolid variant="primary" className="appcard-btn appcard-edit tj-text-xsm">
            {leftButtonName}
          </ButtonSolid>
        </div>
        <div style={{ marginLeft: '0px' }}>
          <ButtonSolid variant="tertiary" className="appcard-btn appcard-launch tj-text-xsm" size="sm">
            {rightButtonName}
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
}

export default AppCard;
