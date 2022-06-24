import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';

export const Text = ({ componentMeta, ...restProps }) => {
  const { component, paramUpdated, dataQueries, style, currentState, allComponents } = restProps;

  const styles = Object.keys(componentMeta.styles);

  let items = [];

  items.push({
    title: 'Text Size',
    isOpen: true,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'textSize',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Text Color',
    isOpen: true,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'textColor',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Text Align',
    isOpen: true,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'textAlign',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Font Weight',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'fontWeight',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Text Decoration',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'decoration',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Text Transformation',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'transformation',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Font Style',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'fontStyle',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Font Variant',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'fontVariant',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Text Spacing',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'lineHeight',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'textIndent',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'letterSpacing',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'wordSpacing',
          'styles',
          currentState,
          allComponents
        )}
      </>
    ),
  });
  items.push({
    title: 'Text Shadow',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'verticalShadow',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'horizontalShadow',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'blur',
          'styles',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'shadowColor',
          'styles',
          currentState,
          allComponents
        )}
      </>
    ),
  });
  items.push({
    title: 'Visibility',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'visibility',
      'styles',
      currentState,
      allComponents
    ),
  });
  items.push({
    title: 'Disable State',
    isOpen: false,
    children: renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      'disabledState',
      'styles',
      currentState,
      allComponents
    ),
  });

  return <Accordion items={items} />;
};
export default Text;
