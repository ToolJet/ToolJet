import React, { useEffect, useRef } from 'react';
import get from 'lodash/get';
import OptionLister from './OptionLister';
import AddGrayIcon from '../../../../assets/images/icons/add-gray.svg';
import './styles.scss';

const BlockOptions = (props) => {
  const { onNewNode, editorSession, style, onClose } = props;
  const availableDataSources = get(editorSession, 'dataSources', []);
  const node = useRef(); // Create a ref to the node

  // this useEffect helps with closing of BlockOptions, when a click
  // happens outside the list modal.
  useEffect(() => {
    // Define the click handler
    const handleClickOutside = (e) => {
      if (node.current.contains(e.target)) {
        // Inside click
        return;
      }
      // Outside click
      onClose(); // or any other handler function
    };

    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <div className="block-option-container" style={style} ref={node}>
        <div className="add-new">
          <AddGrayIcon />
          <span>Add new block</span>
        </div>
        <OptionLister sources={availableDataSources} onOptionClick={onNewNode} />
      </div>
    </div>
  );
};

export default BlockOptions;
