import React, { useState, useEffect } from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { defaults } from 'lodash';
import { Card } from 'react-bootstrap';
import ParameterList from './ParameterList';

const Runjs = (props) => {
  const initialOptions = defaults({ ...props.options }, { code: '//Type your JavaScript code here', parameters: [] });
  const [options, setOptions] = useState(initialOptions);

  const handleAddParameter = (newParameter) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      parameters: [...prevOptions.parameters, newParameter],
    }));
  };

  useEffect(() => {
    props.optionsChanged(options);
  }, [options]);

  const handleParameterChange = (index, updatedParameter) => {
    setOptions((prevOptions) => {
      const updatedParameters = [...prevOptions.parameters];
      updatedParameters[index] = updatedParameter;
      return { ...prevOptions, parameters: updatedParameters };
    });
  };

  const handleParameterRemove = (index) => {
    setOptions((prevOptions) => {
      const updatedParameters = prevOptions.parameters.filter((param, i) => index !== i);
      return { ...prevOptions, parameters: updatedParameters };
    });
  };

  return (
    <Card className="runjs-editor">
      <ParameterList
        parameters={options.parameters}
        handleAddParameter={handleAddParameter}
        handleParameterChange={handleParameterChange}
        handleParameterRemove={handleParameterRemove}
        currentState={props.currentState}
        darkMode={props.darkMode}
      />

      <CodeHinter
        currentState={props.currentState}
        initialValue={props.options.code}
        mode="javascript"
        theme={props.darkMode ? 'monokai' : 'base16-light'}
        lineNumbers={true}
        height={400}
        className="query-hinter"
        ignoreBraces={true}
        onChange={(value) => setOptions({ ...options, code: value })}
        isMultiLineJs={false}
        enablePreview={false}
        componentName="Runjs"
        cyLabel={`runjs`}
      />
    </Card>
  );
};

export default Runjs;

// import React, { useState, useEffect } from 'react';
// import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
// import { defaults } from 'lodash';
// import { Card } from 'react-bootstrap';
// import ArgumentList from './ArgumentList';

// const Runjs = (props) => {
//   const initialOptions = defaults({ ...props.options }, { code: '//Type your JavaScript code here', arguments: [] });
//   const [options, setOptions] = useState(initialOptions);

//   const handleAddArgument = (newArgument) => {
//     setOptions((prevOptions) => ({
//       ...prevOptions,
//       arguments: [...prevOptions.arguments, newArgument],
//     }));
//   };

//   useEffect(() => {
//     props.optionsChanged(options);
//   }, [options]);

//   const handleArgumentChange = (index, updatedArgument) => {
//     setOptions((prevOptions) => {
//       const updatedArguments = [...prevOptions.arguments];
//       updatedArguments[index] = updatedArgument;
//       return { ...prevOptions, arguments: updatedArguments };
//     });
//   };

//   const handleArgumentRemove = (index) => {
//     setOptions((prevOptions) => {
//       const updatedArguments = prevOptions.arguments.filter((arg, i) => index !== i);
//       return { ...prevOptions, arguments: updatedArguments };
//     });
//   };

//   return (
//     <Card className="runjs-editor">
//       <ArgumentList
//         args={options.arguments}
//         handleAddArgument={handleAddArgument}
//         handleArgumentChange={handleArgumentChange}
//         handleArgumentRemove={handleArgumentRemove}
//         currentState={props.currentState}
//         darkMode={props.darkMode}
//       />

//       <CodeHinter
//         currentState={props.currentState}
//         initialValue={props.options.code}
//         mode="javascript"
//         theme={props.darkMode ? 'monokai' : 'base16-light'}
//         lineNumbers={true}
//         height={400}
//         className="query-hinter"
//         ignoreBraces={true}
//         onChange={(value) => setOptions({ ...options, code: value })}
//         isMultiLineJs={false}
//         enablePreview={false}
//         componentName="Runjs"
//         cyLabel={`runjs`}
//       />
//     </Card>
//   );
// };

// export default Runjs;
