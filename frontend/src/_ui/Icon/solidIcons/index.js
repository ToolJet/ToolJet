import React from 'react';

import Apps from './Apps.jsx';
import Bug from './Bug.jsx';
import Notification from './Notification.jsx';
import Grid from './Grid.jsx';
import NotificationUnread from './NotificationUnread.jsx';
import Server from './Server.jsx';
import Setting from './Setting.jsx';
import Table from './Table.jsx';
import Datasource from './Datasource.jsx';
import DarkMode from './DarkMode.jsx';

// import CheveronLeft from './CheveronLeft.svg';
// import CheveronUp from './CheveronUp.svg';
// import CheveronRight from './CheveronRight.svg';
// import CheveronDown from './CheveronDown.svg';
// import Database from './Database.svg';
// import Debugger from './Debugger.svg';
// import Direction from './Direction.svg';
// import Diamond from './Diamond.svg';
// import Layers from './Layers.svg';
// import Plus from './Plus.svg';

const Icon = (props) => {
  console.log('props', props);
  switch (props.name) {
    case 'apps':
      return <Apps {...props} />;
    case 'bug':
      return <Bug {...props} />;
    case 'notification':
      return <Notification {...props} />;
    case 'grid':
      return <Grid {...props} />;
    case 'notificationUnread':
      return <NotificationUnread {...props} />;
    case 'server':
      return <Server {...props} />;
    case 'setting':
      return <Setting {...props} />;
    case 'table':
      return <Table {...props} />;
    case 'datasource':
      return <Datasource {...props} />;
    case 'darkmode':
      return <DarkMode {...props} />;
    // case 'cheverondown':
    //   return <CheveronDown {...props} />;
    // case 'cheveronup':
    //   return <CheveronUp {...props} />;
    // case 'cheveronleft':
    //   return <CheveronLeft {...props} />;
    // case 'cheveronright':
    //   return <CheveronRight {...props} />;
    // case 'bug':
    //   return <Bug {...props} />;
    // case 'database':
    //   return <Database {...props} />;
    // case 'debugger':
    //   return <Debugger {...props} />;
    // case 'diamond':
    //   return <Diamond {...props} />;
    // case 'direction':
    //   return <Direction {...props} />;
    // case 'layers':
    //   return <Layers {...props} />;
    // case 'plus':
    //   return <Plus {...props} />;
    default:
      return <div />;
  }
};
export default Icon;
