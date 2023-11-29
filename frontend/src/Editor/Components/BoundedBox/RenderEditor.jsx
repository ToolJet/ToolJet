import React, { useEffect } from 'react';
import Select from '@/_ui/Select';
import { v4 as uuid } from 'uuid';

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
        left: `${annotation.geometry.x}%`,
        top: `${annotation.geometry.y + annotation.geometry.height}%`,
        right: `${annotation.geometry.x + annotation.geometry.width}%`,
        width: `${annotation.geometry.width}%`,
        minWidth: '125px',
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
        useMenuPortal={false}
        styles={selectElementStyles(darkMode, '100%')}
      />
    </div>
  );
};
