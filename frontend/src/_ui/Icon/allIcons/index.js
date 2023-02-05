import React from 'react';

import Apps from './Apps.svg';
import CheveronDown from './CheveronDown.svg';
import Bug from './Bug.svg';
import CheveronLeft from './CheveronLeft.svg';
import CheveronUp from './CheveronUp.svg';
import CheveronRight from './CheveronRight.svg';
import Database from './Database.svg';
import Debugger from './Debugger.svg';
import Direction from './Direction.svg';
import Diamond from './Diamond.svg';
import Layers from './Layers.svg';

const Icon = (props) => {
  console.log('props', props);
  switch (props.name) {
    case 'apps':
      return <Apps {...props} />;
    case 'cheverondown':
      return <CheveronDown {...props} />;
    case 'cheveronup':
      return <CheveronUp {...props} />;
    case 'cheveronleft':
      return <CheveronLeft {...props} />;
    case 'cheveronright':
      return <CheveronRight {...props} />;
    case 'bug':
      return <Bug {...props} />;
    case 'database':
      return <Database {...props} />;
    case 'debugger':
      return <Debugger {...props} />;
    case 'diamond':
      return <Diamond {...props} />;
    case 'direction':
      return <Direction {...props} />;
    case 'layers':
      return <Layers {...props} />;
    default:
      return <div />;
  }
};
export default Icon;
