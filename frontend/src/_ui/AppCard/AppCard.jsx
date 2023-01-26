import React from 'react';
import './AppCard.scss';
import '../../_styles/typography.scss';
function AppCard(props) {
  const { appname, editTime, className } = props;
  return (
    <div className={`tj-app-card ${className && className}`}>
      <img />
      <p className="tj-para-md tj-app-card-name">{appname}</p>
      <p className="tj-text-xsm tj-app-card-time">{editTime}</p>
    </div>
  );
}

export default AppCard;
