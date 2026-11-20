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

export const BoundedBox = ({ properties, fireEvent, darkMode, setExposedVariable, height, width, styles }) => {
  const [annotationState, setAnnotation] = useState({});
  const [annotationsState, setAnnotations] = useState([]);
  const [outerDivHeight, setOuterDivHeight] = useState();
  const [outerDivWidth, setOuterDivWidth] = useState();
  const [naturalSize, setNaturalSize] = useState(null);
  const [fittedSize, setFittedSize] = useState(null);

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
    // react-image-annotation's generated class names change between builds, so locate the image structurally
    const imageElement = rootRef.current?.querySelector('img');
    if (!imageElement) return;

    const handleImageLoad = () => {
      // Measured frame until the fit below runs; an image without a natural size keeps this.
      const wrapperRect = imageElement.parentElement?.getBoundingClientRect();
      if (wrapperRect) {
        setOuterDivWidth(wrapperRect.width);
        setOuterDivHeight(wrapperRect.height);
      }
      setNaturalSize({ width: imageElement.naturalWidth, height: imageElement.naturalHeight });
    };

    imageElement.addEventListener('load', handleImageLoad);
    // a cached image can finish loading before this effect attaches the listener
    if (imageElement.complete && imageElement.naturalWidth > 0) handleImageLoad();

    return () => imageElement.removeEventListener('load', handleImageLoad);
  }, []);

  // Fit the whole image inside the widget box, keeping its shape; the annotation frame takes the same size,
  // so drawn boxes stay aligned with the image.
  useEffect(() => {
    const box = rootRef.current?.getBoundingClientRect();
    if (!naturalSize?.width || !naturalSize?.height || !box?.width || !box?.height) return;
    const scale = Math.min(box.width / naturalSize.width, box.height / naturalSize.height);
    const fitted = { width: naturalSize.width * scale, height: naturalSize.height * scale };
    setFittedSize(fitted);
    setOuterDivWidth(fitted.width);
    setOuterDivHeight(fitted.height);
  }, [naturalSize, height, width]);

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
    if (properties?.defaultValue?.length === 0 || !properties?.imageUrl) {
      setAnnotations([]);
      setExposedVariable('annotations', []);
    } else if (
      Array.isArray(properties?.defaultValue) &&
      properties?.defaultValue?.length > 0 &&
      properties?.defaultValue.some((item) => typeof item === 'object' && item !== null)
    ) {
      if (outerDivWidth && outerDivHeight) {
        const defaultValueAnnotation = properties?.defaultValue?.map((item) => {
          // Calculate the rightmost and bottommost coordinates of the inner div

          const innerDivRight = (item.x + item.width) * (1 / 100) * outerDivWidth; //px -> %
          const innerDivBottom = (item.y + item.height) * (1 / 100) * outerDivHeight;
          // Check if the inner div exceeds the boundaries of the outer div
          const exceedsBoundaries = innerDivRight > outerDivWidth || innerDivBottom > outerDivHeight;

          // keeping coordinates inside boundary
          if (item.x < 0) item.x = 0;
          if (item.y < 0) item.y = 0;
          if (item.x > 100) item.x = 100;
          if (item.y > 100) item.y = 100;

          if (item.width < 0) item.width = 0;
          if (item.height < 0) item.height = 0;

          if (exceedsBoundaries) {
            if (innerDivRight > outerDivWidth) {
              if (item.width <= 100) item.x = 100 - item.width;
              else {
                const newWidth = 100 - item.x;
                item.width = newWidth;
              }
            }
            if (innerDivBottom > outerDivHeight) {
              if (item.height <= 100) item.y = 100 - item.height;
              else {
                const newHeight = 100 - item.y;
                item.height = newHeight;
              }
            }
          }

          return {
            geometry: {
              type: item.type,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
            },
            data: {
              text: item.text,
              id: uuid(),
            },
          };
        });

        setExposedVariable('annotations', getExposedAnnotations(defaultValueAnnotation));
        setAnnotations(defaultValueAnnotation || []);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(properties?.defaultValue), properties?.imageUrl, outerDivWidth, outerDivHeight]);

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
      style={{ display: styles.visibility ? 'block' : 'none', height: height, boxShadow: styles.boxShadow }}
      className="bounded-box relative"
    >
      <Annotation
        src={`${properties.imageUrl}`}
        annotations={annotationsState}
        type={typeState}
        ref={annotateRef}
        value={annotationState}
        style={fittedSize ? { width: fittedSize.width, height: fittedSize.height, margin: '0 auto' } : undefined}
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
