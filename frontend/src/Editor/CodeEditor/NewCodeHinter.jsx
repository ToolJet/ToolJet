import React from 'react';
import PropTypes from 'prop-types';
import { useResolveStore } from '@/_stores/resolverStore';
import { shallow } from 'zustand/shallow';
import './styles.scss';
import SingleLineCodeEditor from './SingleLineCodeEditor';

const CODE_EDITOR_TYPE = {
  basic: SingleLineCodeEditor,
  multi: <>Multi line</>,
};

const NewCodeHinter = ({ type = 'basic', ...restProps }) => {
  const { suggestions } = useResolveStore(
    (state) => ({
      suggestions: state.suggestions,
    }),
    shallow
  );

  console.log('---arpit [new]', { suggestions });

  const RenderCodeEditor = CODE_EDITOR_TYPE[type];

  return <RenderCodeEditor {...restProps} />;
};

NewCodeHinter.propTypes = {
  type: PropTypes.string.isRequired,
};

export default NewCodeHinter;
