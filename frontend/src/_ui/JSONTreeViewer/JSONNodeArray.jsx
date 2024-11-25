import React, { useState } from 'react';
import { JSONNode } from './JSONNode';

const JSONTreeArrayNode = ({ data, path, ...restProps }) => {
  const [expandedRanges, setExpandedRanges] = useState(new Set());

  const defaultStyles = {
    transform: 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  const toggleRange = (range) => {
    setExpandedRanges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(range)) {
        newSet.delete(range);
      } else {
        newSet.add(range);
      }
      return newSet;
    });
  };

  const renderNode = (key, index) => {
    const currentPath = [...path, key];
    const props = { ...restProps, currentNode: key };

    return <JSONNode key={`arr-${key}/${index}`} data={data[Number(key)]} path={currentPath} {...props} />;
  };

  const renderRange = (start, end) => {
    const range = `${start}-${end}`;
    const isExpanded = expandedRanges.has(range);

    if (!isExpanded) {
      return (
        <div class="d-flex row-flex mt-1 container-fluid px-1 json-node-element">
          <div className="json-tree-icon-container mx-2">
            <span className="json-tree-node-icon" onClick={() => toggleRange(range)} style={defaultStyles}>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
                  stroke={'#61656F'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div class="false false " style={{ width: 'inherit' }}>
            <div class="d-flex inspector-json-node">
              <span
                class="node-key mx-0 badge badge-outline node-key-outline"
                onClick={() => toggleRange(range)}
                style={{ cursor: 'pointer', marginTop: '1px', textTransform: 'none', fontSize: '11px' }}
              >
                [{start}...{end}]
              </span>
            </div>
          </div>
        </div>
      );
    }

    return Array.from({ length: end - start + 1 }, (_, i) => {
      const index = start + i;
      return renderNode(String(index), index);
    });
  };

  if (data.length > 100) {
    const chunks = [];
    for (let i = 0; i < data.length; i += 100) {
      chunks.push(renderRange(i, Math.min(i + 99, data.length - 1)));
    }
    return <>{chunks}</>;
  }

  // If array length is 100 or less, render normally
  return data.map((_, index) => renderNode(String(index), index));
};

export default JSONTreeArrayNode;
