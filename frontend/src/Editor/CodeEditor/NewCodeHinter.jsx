import React from 'react';
import PropTypes from 'prop-types';
import { useResolveStore } from '@/_stores/resolverStore';
import { shallow } from 'zustand/shallow';
import './styles.scss';
import SingleLineCodeEditor from './SingleLineCodeEditor';
import MultiLineCodeEditor from './MultiLineCodeEditor';
import { resolveReferences } from './utils';

const CODE_EDITOR_TYPE = {
  fxEditor: SingleLineCodeEditor.EditorBridge,
  basic: SingleLineCodeEditor,
  multiline: MultiLineCodeEditor,
};

const NewCodeHinter = ({ type = 'basic', initialValue, ...restProps }) => {
  const { suggestions } = useResolveStore(
    (state) => ({
      suggestions: state.suggestions,
    }),
    shallow
  );

  console.log('piku', { type, x: restProps?.componentName });

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [value, error] = type === 'fxEditor' ? resolveReferences(initialValue) : [];

  const RenderCodeEditor = CODE_EDITOR_TYPE[type];

  return (
    <RenderCodeEditor
      initialValue={initialValue}
      suggestions={suggestions}
      darkMode={darkMode}
      resolvedValue={value}
      errorRef={error}
      {...restProps}
    />
  );
};

NewCodeHinter.propTypes = {
  type: PropTypes.string.isRequired,
};

export default NewCodeHinter;
