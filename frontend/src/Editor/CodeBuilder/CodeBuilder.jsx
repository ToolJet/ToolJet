import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { componentTypes } from '../Components/components';
import { DataSourceTypes } from '../DataSourceManager/DataSourceTypes';
import { debounce } from 'lodash';
import Fuse from 'fuse.js';

export function CodeBuilder({ initialValue, onChange, components, dataQueries }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [codeMirrorInstance, setCodeMirrorInstance] = useState(null);
  const [currentWord, setCurrentWord] = useState('');

  function computeCurrentWord(value, _cursorPosition) {
    const sliced = value
      .replace('{{', '')
      .replace('}}', '')
      .slice(0, _cursorPosition - 2);
    const split = sliced.split(' ');
    return split[split.length - 1];
  }

  const delayedHandleChange = debounce((instance) => computeIfDropDownCanBeShown(instance), 500);

  function computeIfDropDownCanBeShown(instance) {
    const value = instance.getValue();
    onChange(value); // Callback for inspector
    let isCode = false;
    setCurrentValue(value);
    setCodeMirrorInstance(instance);

    // Check if the user is trying to enter code or string
    if (value.startsWith('{{') && value.endsWith('}}')) isCode = true;
    console.log('[CB]', 'isCode', isCode);

    if (isCode && value !== initialValue) {
      setShowDropdown(true);
      setCursorPosition(instance.getCursor().ch);
      setCurrentWord(computeCurrentWord(value, instance.getCursor().ch));
    }
  }

  function handleVariableSelection(type, key, variable) {
    let slice1 = currentValue.slice(0, cursorPosition);
    const slice2 = currentValue.slice(cursorPosition);
    const slice3 = `${type}.${key}.${variable}`;

    if (currentWord !== '') {
      slice1 = currentValue.slice(0, cursorPosition - currentWord.length);
    }

    const newValue = `${slice1}${slice3}${slice2}`;
    codeMirrorInstance.setValue(newValue);
    setShowDropdown(false);
  }

  function handleOnFocus(instance) {
    computeIfDropDownCanBeShown(instance);
  }

  function renderVariable(type, key, variable) {
    return (
      <div
        className="item my-1"
        role="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleVariableSelection(type, key, variable);
        }}
      >
        <div className="row">
          <div className="col">
            {key}.{variable}
          </div>
          <div className="col-auto"></div>
        </div>
      </div>
    );
  }

  function renderVariables(type, key, variables) {
    const filterableData = variables.map((variable) => {
      return { name: variable, key };
    });
    const fuse = new Fuse(filterableData, { keys: ['name', 'key'] });
    let filteredVariables = [];
    if (['', ' ', '{{', '{}}', '{{}', '{{}}', '{', '}'].includes(currentWord)) {
      filteredVariables = filterableData.map((item) => {
        return { item: item };
      });
    } else {
      console.log(currentWord);
      filteredVariables = fuse.search(currentWord);
    }
    return filteredVariables.map((variable) => renderVariable(type, key, variable.item.name));
  }

  function renderComponentVariables(component) {
    const componentType = component.component.component;
    const componentMeta = componentTypes.find((comp) => componentType === comp.component);
    const exposedVariables = componentMeta.exposedVariables;

    return renderVariables('components', component.component.name, Object.keys(exposedVariables));
  }

  function renderQueryVariables(query) {
    const dataSourceMeta = DataSourceTypes.find((source) => query.kind === source.kind);
    const exposedVariables = dataSourceMeta.exposedVariables;

    return renderVariables('queries', query.name, Object.keys(exposedVariables));
  }

  return (
    <div className="code-builder">
      <CodeMirror
        fontSize="2"
        onCursorActivity={(instance) => setCursorPosition(instance.getCursor().ch)}
        // onChange={ (instance, change) => computeIfDropDownCanBeShown(instance) }
        onChange={(instance) => delayedHandleChange(instance)}
        value={currentValue}
        onFocus={(instance) => handleOnFocus(instance)}
        onBlur={() => {
          setShowDropdown(false);
        }}
        options={{
          mode: 'javascript',
          lineWrapping: true,
          scrollbarStyle: null,
          lineNumbers: false,
        }}
      />
      {showDropdown && (
        <div className="variables-dropdown">
          <div className="card">
            <div className="group-header p-2">components</div>
            <div className="group-body p-2">
              {Object.keys(components).map((component) => renderComponentVariables(components[component]))}
            </div>

            <div className="group-header p-1">queries</div>
            <div className="group-body p-2">{dataQueries.map((query) => renderQueryVariables(query))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
