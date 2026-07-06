import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

export const RadioButton = function RadioButton({
  id,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const { label, value, values, display_values } = properties;

  const { visibility, disabledState, activeColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;

  const isInitialRender = useRef(true);
  const exposedOpts = { resolveIndex, moduleId };

  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for the exposed value; the resolved `value`
  // property is the pre-first-publish fallback (old checkedValue useState).
  const storeValue = useExposedVariable(id, 'value', exposedOpts, undefined);
  const checkedValue =
    isInitialRender.current || storeValue !== undefined ? (storeValue === undefined ? value : storeValue) : storeValue;

  let selectOptions = [];

  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { name: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.error(err);
  }

  // User interaction and the selectOption CSA share the same command pair
  // (old onSelect: expose value, then fireEvent('onSelectionChange')).
  const selectOptionCommands = (selection) => [
    { kind: 'INVOKE_CSA', componentId: id, action: 'selectOption', args: [selection] },
    { kind: 'FIRE_EVENT', componentId: id, event: 'onSelectionChange' },
  ];

  // Property sync: old mount effect had [value] deps, re-exposing the value
  // whenever the resolved property changed.
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Mount shim: initial snapshot + contract-generated CSA dispatcher.
  useEffect(() => {
    setExposedVariables({
      value: value,
      ...csaShims(),
      selectOption: async function (option) {
        dispatch(selectOptionCommands(option));
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-disabled={disabledState}
      className="row py-1"
      style={{ height, display: visibility ? '' : 'none', boxShadow }}
      id={`component-${id}`}
      role="radiogroup"
      aria-labelledby={`${id}-label`}
    >
      <span
        className="form-check-label col-auto py-0"
        style={{ color: textColor }}
        id={`${id}-label`}
        data-cy={`${dataCy}-label`}
      >
        {label}
      </span>
      <div className="col px-1 py-0 mt-0">
        {selectOptions.map((option, index) => (
          <label key={index} className="form-check form-check-inline">
            <input
              data-cy={`${dataCy}-option-input-${index}`}
              style={{
                marginTop: '1px',
                backgroundColor: checkedValue === option.value ? `${activeColor}` : 'var(--cc-surface1-surface)',
              }}
              className="form-check-input"
              checked={checkedValue === option.value}
              type="radio"
              value={option.value}
              name={`${id}-${uuidv4()}`}
              onChange={() => dispatch(selectOptionCommands(option.value))}
              disabled={disabledState}
              aria-disabled={disabledState}
              aria-hidden={!visibility}
              aria-labelledby={`${id}-option-${index}-label`}
            />
            <span
              className="form-check-label"
              style={{ color: textColor }}
              id={`${id}-option-${index}-label`}
              data-cy={`${dataCy}-option-label-${index}`}
            >
              {option.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
