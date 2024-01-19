import React, { useEffect } from 'react';
import { useSpring, config, animated } from 'react-spring';
import useHeight from '@/_hooks/use-height-transition';
import { getCurrentNodeType, resolveReferences } from './utils';

export const PreviewBox = ({ currentValue, isFocused, expectedType, setErrorStateActive }) => {
  const [resolvedValue, error] = resolveReferences(currentValue, expectedType);

  const [heightRef, currentHeight] = useHeight();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';

  const getPreviewContent = (content) => {
    if (!content) return currentValue;

    const type = typeof content;
    try {
      switch (type) {
        case 'object':
          return JSON.stringify(content);
        case 'boolean':
          return content.toString();
        default:
          return content;
      }
    } catch (e) {
      return undefined;
    }
  };

  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight : 0,
    },
  });

  let previewType = getCurrentNodeType(resolvedValue);
  let previewContent = resolvedValue;

  const content = getPreviewContent(previewContent);

  useEffect(() => {
    if (error) {
      setErrorStateActive(true);
    } else {
      setErrorStateActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, resolvedValue]);

  return (
    <animated.div className={isFocused ? themeCls : null} style={{ ...slideInStyles, overflow: 'hidden' }}>
      <div ref={heightRef} className={`dynamic-variable-preview px-1 py-1 ${!error ? 'bg-green-lt' : 'bg-red-lt'}`}>
        {!error ? (
          <RenderResolvedValue previewType={previewType} resolvedValue={content} />
        ) : (
          <RenderError error={error} />
        )}
      </div>
    </animated.div>
  );
};

const RenderResolvedValue = ({ previewType, resolvedValue }) => {
  return (
    <div>
      <div className="d-flex my-1">
        <div className="flex-grow-1" style={{ fontWeight: 700, textTransform: 'capitalize' }}>
          {previewType}
        </div>
      </div>
      {resolvedValue}
    </div>
  );
};

const RenderError = ({ error }) => {
  return (
    <div>
      <div className="heading my-1">
        <span>{JSON.stringify(error)}</span>
      </div>
    </div>
  );
};
