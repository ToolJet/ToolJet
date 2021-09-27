import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import { resolveReferences } from '@/_helpers/utils';
import useHeight from '@/_hooks/use-height-transition';

const getPreviewContent = (content, type) => {
  switch (type) {
    case 'object':
      return JSON.stringify(content);
    case 'boolean':
      return content.toString();
    default:
      return content;
  }
};

const CodePreview = ({ currentValue, realState, isFocused }) => {
  const [preview, error] = resolveReferences(currentValue, realState, null, {}, true);
  const previewType = typeof preview;
  const content = getPreviewContent(preview, previewType);
  const [heightRef, currentHeight] = useHeight();

  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight : 0,
    },
  });

  return error ? (
    <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
      <div ref={heightRef} className="dynamic-variable-preview bg-red-lt px-1 py-1">
        <div>
          <div className="heading my-1">
            <span>Error</span>
          </div>
          {error.toString()}
        </div>
      </div>
    </animated.div>
  ) : (
    <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
      <div ref={heightRef} className="dynamic-variable-preview bg-green-lt px-1 py-1">
        <div>
          <div className="heading my-1">
            <span>{previewType}</span>
          </div>
          {content}
        </div>
      </div>
    </animated.div>
  );
};

export default CodePreview;
