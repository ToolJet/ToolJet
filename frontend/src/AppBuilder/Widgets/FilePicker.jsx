import React from 'react';
import PropTypes from 'prop-types';
// Import the new FilePicker component from AppBuilder
import FilePickerComponent from '@/AppBuilder/Widgets/FilePicker/FilePicker';

// This component now acts as a wrapper, passing props to the new implementation
export const FilePicker = (props) => {
  return <FilePickerComponent {...props} />;
};

// Keep PropTypes for the wrapper if needed, or simplify if they match the inner component
FilePicker.propTypes = {
  id: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  component: PropTypes.object,
  fireEvent: PropTypes.func,
  onComponentOptionChanged: PropTypes.func,
  darkMode: PropTypes.bool,
  styles: PropTypes.object,
  properties: PropTypes.object,
  setExposedVariable: PropTypes.func,
  setExposedVariables: PropTypes.func,
  dataCy: PropTypes.string,
};

// Optional: Default props for the wrapper if needed
// FilePicker.defaultProps = { ... };

/* 
  All the original logic (hooks, state, helper functions, effects, rendering)
  has been moved to frontend/src/AppBuilder/Widgets/FilePicker/FilePicker.jsx
*/
