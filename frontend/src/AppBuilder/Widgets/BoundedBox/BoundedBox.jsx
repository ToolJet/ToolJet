import React, { useEffect, useState, useRef } from 'react';
import Annotation from 'react-image-annotation';
import { PointSelector, RectangleSelector } from 'react-image-annotation/lib/selectors';
import defaultStyles from '@/_ui/Select/styles';
import { RenderSelector } from './RenderSelector';
import { RenderEditor } from './RenderEditor';
import { RenderHighlight } from './RenderHighlight';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { getSafeRenderableValue } from '../utils';

const isAnnotationInput = (item) => typeof item === 'object' && item !== null && !Array.isArray(item);
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

// Geometry is a percentage of the image (0..100); returns a clamped copy, never touching the input.
const normalizeGeometry = (item) => {
  let x = clampPercent(item.x);
  let y = clampPercent(item.y);
  let width = Math.max(0, Number(item.width) || 0);
  let height = Math.max(0, Number(item.height) || 0);
  if (x + width > 100) {
    if (width <= 100) x = 100 - width;
    else width = 100 - x;
  }
  if (y + height > 100) {
    if (height <= 100) y = 100 - height;
    else height = 100 - y;
  }
  return { type: item.type, x, y, width, height };
};

export const BoundedBox = ({ properties, fireEvent, darkMode, setExposedVariable, height, styles }) => {
  const [annotationState, setAnnotation] = useState({});
  const [annotationsState, setAnnotations] = useState([]);
  const [outerDivHeight, setOuterDivHeight] = useState();
  const [outerDivWidth, setOuterDivWidth] = useState();
  const isDisabled = !!properties.disabledState;

  const [typeState, setType] = useState(properties.selector);
  const labels = _.isArray(properties.labels)
    ? [
        ...properties.labels.map((label) => {
          return { name: getSafeRenderableValue(label), value: label };
        }),
      ]
    : [];
  const annotateRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    // Scoped to this instance; generated styled-component class names are not stable.
    const imageElement = rootRef.current?.querySelector('img');
    const handleImageLoad = () => {
      const { width, height } = imageElement.getBoundingClientRect();
      setOuterDivWidth(width);
      setOuterDivHeight(height);
    };
    imageElement?.addEventListener('load', handleImageLoad);
    return () => imageElement?.removeEventListener('load', handleImageLoad);
  }, []);

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

  useEffect(() => {
    const defaultValue = properties?.defaultValue;
    const validItems = Array.isArray(defaultValue) ? defaultValue.filter(isAnnotationInput) : [];
    if (!properties?.imageUrl || validItems.length === 0) {
      setAnnotations([]);
      setExposedVariable('annotations', []);
    } else if (outerDivWidth && outerDivHeight) {
      const defaultValueAnnotation = validItems.map((item) => ({
        geometry: normalizeGeometry(item),
        data: { text: item.text, id: uuid() },
      }));
      setExposedVariable('annotations', getExposedAnnotations(defaultValueAnnotation));
      setAnnotations(defaultValueAnnotation);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(properties?.defaultValue), properties?.imageUrl, outerDivWidth, outerDivHeight]);

  // Publish before firing so onChange handlers read the committed list.
  const commitAnnotations = (next) => {
    setAnnotations(next);
    setExposedVariable('annotations', getExposedAnnotations(next));
    fireEvent('onChange');
  };

  const createAnnotation = (geometry, text) => {
    if (isDisabled) return;
    setAnnotation({});
    commitAnnotations(annotationsState.concat({ geometry, data: { text, id: uuid() } }));
  };

  const relabelAnnotation = (id, text) => {
    if (isDisabled) return;
    commitAnnotations(
      annotationsState.map((annotation) =>
        annotation.data.id === id ? { ...annotation, data: { ...annotation.data, text } } : annotation
      )
    );
  };

  const deleteAnnotation = (id) => {
    if (isDisabled) return;
    commitAnnotations(annotationsState.filter((annotation) => annotation.data.id !== id));
  };

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
      ref={rootRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ display: properties.visibility ? 'block' : 'none', height: height, boxShadow: styles.boxShadow }}
      className="bounded-box relative"
      aria-disabled={isDisabled || undefined}
    >
      <Annotation
        src={`${properties.imageUrl}`}
        alt="Image to annotate"
        annotations={annotationsState}
        type={typeState}
        ref={annotateRef}
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
              onCreate={createAnnotation}
              darkMode={darkMode}
              selectElementStyles={selectElementStyles}
            />
          );
        }}
        renderHighlight={({ annotation }) => (
          <RenderHighlight
            annotation={annotation}
            position={annotationsState.findIndex((item) => item.data.id === annotation.data.id) + 1}
            onRelabel={relabelAnnotation}
            onDelete={deleteAnnotation}
            disabled={isDisabled}
            darkMode={darkMode}
            selectElementStyles={selectElementStyles}
            labels={labels}
          />
        )}
        renderContent={() => null}
        disableAnnotation={isDisabled}
      />
    </div>
  );
};
