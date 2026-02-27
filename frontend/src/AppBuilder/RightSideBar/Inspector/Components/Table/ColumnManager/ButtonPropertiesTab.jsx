import React from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { EventManager } from '../../../EventManager';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import Accordion from '@/_ui/Accordion';

export const ButtonPropertiesTab = ({
  button,
  column,
  index,
  darkMode,
  currentState,
  onButtonPropertyChange,
  setColumnPopoverRootCloseBlocker,
  component,
  props,
  columnEventChanged,
  handleEventManagerPopoverCallback,
}) => {
  if (!button) return null;

  const compoundRef = `${column.key || column.name}::${button.id}`;

  return (
    <>
      <div className="field mb-2 px-3">
        <label className="form-label">Button label</label>
        <CodeHinter
          currentState={currentState}
          initialValue={button.buttonLabel ?? 'Button'}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder="Button label"
          onChange={(value) => onButtonPropertyChange('buttonLabel', value)}
          componentName={`table_column_button_${button.id}_buttonLabel`}
          popOverCallback={(showing) => setColumnPopoverRootCloseBlocker('buttonLabel', showing)}
        />
      </div>

      <div className="field mb-2 px-3">
        <label className="form-label">Tooltip</label>
        <CodeHinter
          currentState={currentState}
          initialValue={button.buttonTooltip ?? ''}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder="Enter tooltip text"
          onChange={(value) => onButtonPropertyChange('buttonTooltip', value)}
          componentName={`table_column_button_${button.id}_buttonTooltip`}
          popOverCallback={(showing) => setColumnPopoverRootCloseBlocker('buttonTooltip', showing)}
        />
      </div>

      <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px' }}>
        <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
          <ProgramaticallyHandleProperties
            label="Loading state"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
            property="loadingState"
            props={button}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Loading state' }}
            paramType="properties"
          />
        </div>
      </div>

      <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px', marginTop: '-8px' }}>
        <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
          <ProgramaticallyHandleProperties
            label="Visibility"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
            property="buttonVisibility"
            props={button}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Visibility' }}
            paramType="properties"
          />
        </div>
      </div>

      <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px', marginTop: '-8px' }}>
        <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
          <ProgramaticallyHandleProperties
            label="Disable action button"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
            property="disableButton"
            props={button}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Disable action button' }}
            paramType="properties"
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-weak)' }}>
        <Accordion
          items={[
            {
              title: 'Events',
              isOpen: true,
              children: (
                <EventManager
                  sourceId={props?.component?.id}
                  eventSourceType="table_column"
                  customEventRefs={{ ref: compoundRef }}
                  hideEmptyEventsAlert={false}
                  eventMetaDefinition={{ events: { onClick: { displayName: 'On click' } } }}
                  currentState={currentState}
                  dataQueries={props.dataQueries}
                  components={props.components}
                  eventsChanged={(events) => columnEventChanged(column, events)}
                  apps={props.apps}
                  popOverCallback={(showing) => handleEventManagerPopoverCallback(showing)}
                  pages={props.pages}
                />
              ),
            },
          ]}
        />
      </div>
    </>
  );
};
