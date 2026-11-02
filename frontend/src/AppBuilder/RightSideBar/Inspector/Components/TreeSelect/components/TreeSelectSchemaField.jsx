import React, { useCallback, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { logOptionProblem } from '@/AppBuilder/Widgets/TreeSelect/optionProblems';
import { Code } from '../../../Elements/Code';
import { validateComponentProperty } from '@/AppBuilder/CodeEditor/utils';
import { findSchemaProblems, readsAppState } from '../hooks/treeSelectOptionValidation';

export const TreeSelectSchemaField = ({ component, componentMeta, paramUpdated, dataQueries, darkMode }) => {
  const param = 'data';
  const definition = component.component.definition.properties?.[param] || {};
  const getResolvedValue = useStore.getState().getResolvedValue;
  // Text being typed; the message under the field follows it before anything is saved.
  const [draft, setDraft] = useState(undefined);
  const [resetKey, setResetKey] = useState(0);

  const problemsFor = (text) => findSchemaProblems(getResolvedValue(text), getResolvedValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const draftProblems = useMemo(() => (draft === undefined ? [] : problemsFor(draft)), [draft]);

  // Keeps a saved binding's bad data visible after blur (D-13); stable, since a new function resets the editor text.
  const validateSchema = useCallback(
    (resolved) => {
      const [isType, typeErrors] = validateComponentProperty(resolved, componentMeta.properties?.[param]?.validation);
      if (!isType) return [false, typeErrors];
      const problems = findSchemaProblems(resolved, getResolvedValue);
      return [problems.length === 0, problems.join(' ')];
    },
    [componentMeta, getResolvedValue]
  );

  const logRefusal = (message) =>
    logOptionProblem({ componentId: component.id, componentName: component.component.name, field: 'Schema', message });

  // Data that used to crash the tree is not saved; the field remounts on the stored value, as Steps and Tabs do.
  const handleChange = (paramArg, attr, value, paramType) => {
    if (attr === 'value') {
      setDraft(undefined);
      const problems = readsAppState(value) ? [] : problemsFor(value);
      if (problems.length > 0) {
        problems.forEach(logRefusal);
        setResetKey((key) => key + 1);
        return;
      }
    }
    paramUpdated(paramArg, attr, value, paramType);
  };

  return (
    <>
      <Code
        key={resetKey}
        param={{ name: param, ...component.component.properties?.[param] }}
        definition={definition}
        dataQueries={dataQueries}
        onChange={handleChange}
        onInputChange={setDraft}
        validationFn={validateSchema}
        paramType="properties"
        componentMeta={componentMeta}
        darkMode={darkMode}
        componentName={component.component.name || null}
        type={componentMeta.properties?.[param]?.type}
        fxActive={definition.fxActive ?? false}
        onFxPress={(active) =>
          paramUpdated({ name: param, ...component.component.properties?.[param] }, 'fxActive', active, 'properties')
        }
        component={component}
      />
      {draftProblems.length > 0 && (
        <div className="tw-text-text-danger tw-mt-1 tw-mb-2" data-cy="inspector-treeselect-schema-error">
          {draftProblems.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}
    </>
  );
};
