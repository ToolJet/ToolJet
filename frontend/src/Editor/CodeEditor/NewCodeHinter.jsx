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

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const RenderCodeEditor = CODE_EDITOR_TYPE[type];

  return (
    <RenderCodeEditor
      type={type}
      initialValue={initialValue}
      suggestions={suggestions}
      darkMode={darkMode}
      {...restProps}
    />
  );
};

NewCodeHinter.propTypes = {
  type: PropTypes.string.isRequired,
};

export default NewCodeHinter;
