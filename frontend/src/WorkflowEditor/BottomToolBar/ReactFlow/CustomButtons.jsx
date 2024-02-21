import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useReactFlow, Panel } from 'reactflow';
import ZoomIn from '../../BottomToolBar/icons/zoomin.svg';
import ZoomOut from '../../BottomToolBar/icons/zoomout.svg';
import FitView from '../../BottomToolBar/icons/fitview.svg';
import LockIcon from './LockIcon';
import UnlockIcon from './UnlockIcon';
import { useToggleInteractivity } from '../../utils';

function CustomButtons() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isInteractive, setIsInteractive] = useState(false);
  const onToggleInteractivity = useToggleInteractivity();

  const handleInteractivity = () => {
    onToggleInteractivity();
    setIsInteractive(!isInteractive);
  };

  const panelStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Panel position="top-left">
      <div className="custom-react-flow-btns" style={panelStyle}>
        <button onClick={zoomIn} className="controlBtnRf">
          <ZoomIn />
        </button>
        <button onClick={zoomOut} className="controlBtnRf">
          <ZoomOut />
        </button>
        <button onClick={fitView} className="controlBtnRf">
          <FitView />
        </button>
        <button onClick={handleInteractivity} className="controlBtnRf">
          {isInteractive ? <LockIcon /> : <UnlockIcon />}
        </button>
      </div>
    </Panel>
  );
}

export default CustomButtons;
