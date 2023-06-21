import React, { useEffect, useState } from 'react';
import Annotation from 'react-image-annotation';
import { PointSelector, RectangleSelector } from 'react-image-annotation/lib/selectors';
import defaultStyles from '@/_ui/Select/styles';
import { RenderSelector } from './RenderSelector';
import { RenderEditor } from './RenderEditor';
import { RenderHighlight } from './RenderHighlight';
import _ from 'lodash';

export const BoundedBox = ({ properties, fireEvent, darkMode, setExposedVariable, height, styles, boxShadow }) => {
  const [annotationState, setAnnotation] = useState({});
  const [annotationsState, setAnnotations] = useState([]);
  const [typeState, setType] = useState(properties.selector);
  const labels = _.isArray(properties.labels)
    ? [
        ...properties.labels.map((label) => {
          return { name: label, value: label };
        }),
      ]
    : [];
  useEffect(() => {
    let selector = undefined;
    switch (properties.selector) {
      case 'RECTANGLE':
        selector = RectangleSelector.TYPE;
        break;
      case 'POINT':
        selector = PointSelector.TYPE;
        break;
      default:
        selector = RectangleSelector.TYPE;
        break;
    }
    setType(selector);
  }, [properties.selector]);

  const onChange = (annotation) => {
    setAnnotation(annotation);
  };

  const selectElementStyles = (darkMode, width) => {
    return {
      ...defaultStyles(darkMode, width),
      menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
      menuList: (base) => ({
        ...base,
      }),
      menu: (provided) => {
        return {
          ...provided,
          marginTop: 0,
          backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
        };
      },
      option: (provided) => ({
        ...provided,
        backgroundColor: darkMode ? '#2b3547' : '#fff',
        color: darkMode ? '#fff' : '#232e3c',
        cursor: 'pointer',
        ':hover': {
          backgroundColor: darkMode ? '#323C4B' : '#d8dce9',
        },
        fontSize: '12px',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: darkMode ? '#fff' : '#232e3c',
        fontSize: '10px',
      }),
      placeholder: (provided) => ({
        ...provided,
        color: darkMode ? '#fff' : '#808080',
        fontSize: '10px',
      }),
    };
  };
  const getExposedAnnotations = (annotations) =>
    annotations.map((annotation) => {
      return {
        ...annotation.geometry,
        ...annotation.data,
      };
    });

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{ display: styles.visibility ? 'block' : 'none', height: height, boxShadow }}
      className="bounded-box relative"
    >
      <Annotation
        src={`${properties.imageUrl}`}
        annotations={annotationsState}
        type={typeState}
        value={annotationState}
        onChange={(annotation) => onChange(annotation)}
        renderSelector={({ annotation, active }) => (
          <RenderSelector annotation={annotation} active={active} fireEvent={fireEvent} />
        )}
        renderEditor={({ annotation }) => {
          return (
            <RenderEditor
              annotation={annotation}
              labels={labels}
              setAnnotation={setAnnotation}
              setAnnotations={setAnnotations}
              setExposedVariable={setExposedVariable}
              fireEvent={fireEvent}
              darkMode={darkMode}
              selectElementStyles={selectElementStyles}
              getExposedAnnotations={getExposedAnnotations}
            />
          );
        }}
        renderHighlight={({ annotation }) => (
          <RenderHighlight
            annotation={annotation}
            setAnnotations={setAnnotations}
            setExposedVariable={setExposedVariable}
            fireEvent={fireEvent}
            darkMode={darkMode}
            selectElementStyles={selectElementStyles}
            labels={labels}
            getExposedAnnotations={getExposedAnnotations}
          />
        )}
        renderContent={() => null}
        disableAnnotation={styles.disabledState}
      />
    </div>
  );
};
