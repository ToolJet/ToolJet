import React, { useEffect } from 'react';
import Select from '@/_ui/Select';
import { v4 as uuid } from 'uuid';
import { getAnnotationLabelStyle } from './annotationLabel';

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
  containerSize,
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
    <div
      style={{
        position: 'absolute',
        ...getAnnotationLabelStyle(geometry, containerSize),
      }}
      className="col"
    >
      <Select
        options={labels}
        onChange={(value) => {
          setAnnotation({});
          setAnnotations((prevState) => {
            const annotations = prevState.concat({
              geometry,
              data: {
                text: value,
                id: uuid(),
              },
            });

            setExposedVariable('annotations', getExposedAnnotations(annotations));
            fireEvent('onChange');
            return annotations;
          });
        }}
        className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
        useCustomStyles={true}
        // useMenuPortal={false}
        useMenuPortal
        styles={selectElementStyles(darkMode, '100%')}
      />
    </div>
  );
};
