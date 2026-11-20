import React, { useEffect } from 'react';
import Select from '@/_ui/Select';
import { v4 as uuid } from 'uuid';
import { getLabelControlPosition } from './labelControlPosition';

export const RenderEditor = ({
  annotation,
  labels,
  setAnnotation,
  setAnnotations,
  setExposedVariable,
  fireEvent,
  darkMode,
  selectElementStyles,
  getExposedAnnotations,
  onLabelCommitted,
}) => {
  useEffect(() => {
    if (geometry) {
      fireEvent('onChange');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { geometry } = annotation;
  if (!geometry) return null;
  return (
    <div style={getLabelControlPosition(annotation.geometry)} className="col">
      <Select
        options={labels}
        onChange={(value) => {
          const id = uuid();
          setAnnotation({});
          onLabelCommitted?.(id);
          setAnnotations((prevState) => {
            const annotations = prevState.concat({
              geometry,
              data: {
                text: value,
                id,
              },
            });

            setExposedVariable('annotations', getExposedAnnotations(annotations));
            fireEvent('onChange');
            return annotations;
          });
        }}
        className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
        aria-label="Label for new annotation"
        useCustomStyles={true}
        // useMenuPortal={false}
        useMenuPortal
        styles={selectElementStyles(darkMode, '100%')}
      />
    </div>
  );
};
