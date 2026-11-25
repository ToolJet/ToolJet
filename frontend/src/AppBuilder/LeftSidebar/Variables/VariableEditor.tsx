import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, InfoIcon } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as RawButton } from '@/components/ui/Button/Button';
import RawInputComponent from '@/components/ui/Input/Index';
import {
  Button as RawRocketButton,
  ToggleGroup as RawToggleGroup,
  ToggleGroupItem as RawToggleGroupItem,
} from '@/components/ui/Rocket';
import { copyToClipboard } from '@/_helpers/appUtils';
import { toExpression, validateVariableName } from '@/AppBuilder/_utils/variableDefinitions';
import { previewOf, referenceOf } from './variableRows';
import VariableReferencesDialog, { computeVariableReferences } from './VariableReferencesDialog';
import type { VariableReference } from './variableReferences';
import type { VariableRow, VariableScope } from './variableRows';

const ButtonComponent = RawButton as React.ComponentType<any>;
const InputComponent = RawInputComponent as React.ComponentType<any>;
const CodeHinterComponent = CodeHinter as React.ComponentType<any>;
const RocketButton = RawRocketButton as React.ComponentType<any>;
const RocketToggleGroup = RawToggleGroup as React.ComponentType<any>;
const RocketToggleGroupItem = RawToggleGroupItem as React.ComponentType<any>;
// Plain JS helper: `selfId` defaults to null, which TS infers as its only type.
const validateName = validateVariableName as (
  name: string,
  scope: VariableScope,
  definitions: Array<{ id: string; scope: VariableScope; name: string }>,
  selfId?: string | null,
  pageName?: string
) => string | null;

type SaveResult = { ok: true; definition: any } | { ok: false; field: 'name' | 'value'; error: string };

// Styled like the Code mode command blocks: a code block with an icon-only copy button in its corner.
export const ReferenceBox = ({ scope, name }: { scope: VariableScope; name: string }) => {
  const reference = referenceOf(scope, name || 'name');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className="variables-reference" data-cy="variable-reference">
      <pre>
        <code>{reference}</code>
      </pre>
      <RocketButton
        variant="ghost"
        size="small"
        iconOnly
        className="variables-reference-copy"
        onClick={() => {
          copyToClipboard(reference);
          setCopied(true);
        }}
        aria-label={`Copy reference ${reference}`}
        title={copied ? 'Copied' : 'Copy'}
        data-cy="variable-reference-copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </RocketButton>
    </div>
  );
};

const Note = ({ scope }: { scope: VariableScope }) => (
  <div className="variables-note">
    <InfoIcon size={14} />
    <span>
      Set on {scope === 'app' ? 'app' : 'page'} load, and recalculated whenever anything it reads changes. Scripts and
      Set {scope === 'app' ? 'variable' : 'page variable'} actions can change it until then.
    </span>
  </div>
);

const FieldError = ({ message, dataCy }: { message?: string | null; dataCy: string }) =>
  message ? (
    <span className="variables-field-error" data-cy={dataCy}>
      {message}
    </span>
  ) : null;

const typeOf = (value: unknown) => {
  if (value === null) return 'Null';
  if (Array.isArray(value)) return `Array (${value.length})`;
  const t = typeof value;
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export type ValueEvaluation = { value: unknown; error: string | null };

/** What the initial value evaluates to right now, or why it can't be evaluated. */
const ValuePreview = ({ evaluation }: { evaluation: ValueEvaluation }) =>
  evaluation.error ? (
    <div className="variables-preview error" data-cy="variable-value-evaluation-error">
      <span className="variables-preview-type">Can’t evaluate</span>
      <code>{evaluation.error}</code>
    </div>
  ) : (
    <div className="variables-preview" data-cy="variable-value-preview">
      <span className="variables-preview-type">{typeOf(evaluation.value)}</span>
      <code>{previewOf(evaluation.value, 220)}</code>
    </div>
  );

/**
 * A variable saved with the old fx toggle on may hold an expression without braces; show it as {{ }}
 * so the field, like every Inspector code field, reads anything in braces as an expression.
 */
const editableValueOf = (definition: { value?: string; fxActive?: boolean }) => {
  const text = definition.value ?? '';
  return definition.fxActive && text.trim() && !(text.includes('{{') && text.includes('}}'))
    ? toExpression({ value: text })
    : text;
};

/**
 * Initial value: a single-line code field that works like the Inspector's property fields. Text in
 * {{ }} is an expression with autocomplete; anything else is a static value.
 */
const ValueField = ({
  value,
  onChange,
  error,
  optional = false,
  evaluation = null,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  optional?: boolean;
  evaluation?: ValueEvaluation | null;
}) => (
  <div className="variables-field" data-cy="variable-initial-value">
    <span className="variables-label">
      Initial value {optional && <span className="variables-hint">Optional</span>}
    </span>
    <div className="variables-value-row">
      <div className="variables-value-editor">
        <CodeHinterComponent
          type="basic"
          initialValue={value}
          // The basic editor's onChange is a blur commit. Keep this form's
          // draft current while typing; a second commit on blur would duplicate
          // edit saves and undo entries.
          onInputChange={(next: unknown) => onChange(next === undefined || next === null ? '' : String(next))}
          onChange={() => {}}
          usePortalEditor={false}
          delayOnChange={false}
          // The default left placement suits the right-hand Inspector; in the left sidebar it covers the field.
          previewPlacement="bottom-start"
          placeholder="e.g. 5, open, [] or {{ }}"
          cyLabel="variable-initial-value"
        />
      </div>
    </div>
    <FieldError message={error} dataCy="variable-value-error" />
    {!error && evaluation && <ValuePreview evaluation={evaluation} />}
  </div>
);

type CreateProps = {
  moduleId: string;
  pageName: string;
  /** Every declared variable in scope (app + current page), for name validation. */
  definitions: Array<{ id: string; scope: VariableScope; name: string }>;
  initialScope: VariableScope;
  /** Prefilled when adding an initial value to a runtime-only variable; the name and scope are then fixed. */
  runtimeVariable?: VariableRow;
  onCreated: (scope: VariableScope, name: string) => void;
};

/** "New variable" form, and "Add initial value" for a variable a script creates. */
export const CreateVariableForm = ({
  moduleId,
  pageName,
  definitions,
  initialScope,
  runtimeVariable,
  onCreated,
}: CreateProps) => {
  const saveVariableDefinition = useStore((state: any) => state.saveVariableDefinition);
  const evaluateWithError = useStore((state: any) => state.evaluateVariableDefinitionWithError);
  const [scope, setScope] = useState<VariableScope>(runtimeVariable?.scope ?? initialScope);
  const [name, setName] = useState(runtimeVariable?.name ?? '');
  const [nameTouched, setNameTouched] = useState(false);
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<{ name?: string | null; value?: string | null }>({});
  const [saving, setSaving] = useState(false);

  const liveNameError = nameTouched ? validateName(name, scope, definitions, null, pageName) : null;
  const nameError = errors.name ?? liveNameError;

  const create = async () => {
    setNameTouched(true);
    if (validateName(name, scope, definitions, null, pageName)) return;
    setSaving(true);
    const result: SaveResult = await saveVariableDefinition({ scope, name, value, fxActive: false }, moduleId);
    setSaving(false);
    if (!result.ok) {
      setErrors({ [result.field]: result.error });
      return;
    }
    toast.success(`Created ${referenceOf(scope, name)}`);
    onCreated(scope, name);
  };

  return (
    <div className="variables-form" data-cy="variable-create-form">
      <div className="variables-field">
        <span className="variables-label">Scope</span>
        <RocketToggleGroup
          type="single"
          value={scope}
          onValueChange={(next: VariableScope) => next && !runtimeVariable && setScope(next)}
          className="tw-w-full"
          disabled={!!runtimeVariable}
          data-cy="variable-scope-toggle"
        >
          <RocketToggleGroupItem value="app" className="tw-flex-1">
            App
          </RocketToggleGroupItem>
          <RocketToggleGroupItem value="page" className="tw-flex-1">
            Page · {pageName}
          </RocketToggleGroupItem>
        </RocketToggleGroup>
        <span className="variables-hint">
          {scope === 'app' ? 'Available on every page.' : `Available only on ${pageName}.`}
        </span>
      </div>

      <div className="variables-field">
        <InputComponent
          label="Name"
          size="medium"
          placeholder="e.g. selectedOrderId"
          value={name}
          disabled={!!runtimeVariable}
          onChange={(e: any) => {
            setName(e.target.value);
            setNameTouched(true);
            setErrors((prev) => ({ ...prev, name: null }));
          }}
          onKeyDown={(e: any) => e.key === 'Enter' && create()}
          isValidatedMessages={nameError ? { valid: false, message: nameError } : { valid: null, message: '' }}
          data-cy="variable-name-input"
          autoFocus={!runtimeVariable}
        />
      </div>

      <ValueField
        value={value}
        onChange={(next) => {
          setValue(next);
          setErrors((prev) => ({ ...prev, value: null }));
        }}
        error={errors.value}
        optional
        evaluation={value.trim() ? evaluateWithError({ value, fxActive: false, scope }, moduleId) : null}
      />

      <div className="variables-field">
        <span className="variables-label">Reference</span>
        <ReferenceBox scope={scope} name={name} />
      </div>

      <Note scope={scope} />

      <div className="variables-form-actions">
        <ButtonComponent
          variant="primary"
          size="medium"
          onClick={create}
          disabled={saving || !!validateName(name, scope, definitions, null, pageName)}
          data-cy="variable-create-button"
        >
          {runtimeVariable ? 'Save initial value' : 'Create variable'}
        </ButtonComponent>
      </div>
    </div>
  );
};

type EditProps = {
  moduleId: string;
  pageName: string;
  definitions: Array<{ id: string; scope: VariableScope; name: string }>;
  row: VariableRow;
  onRenamed: (scope: VariableScope, name: string) => void;
};

/** Detail view of a declared variable: rename on blur or Enter, value changes apply as you type. */
export const EditVariableForm = ({ moduleId, pageName, definitions, row, onRenamed }: EditProps) => {
  const saveVariableDefinition = useStore((state: any) => state.saveVariableDefinition);
  const replaceIdsWithName = useStore((state: any) => state.replaceIdsWithName);
  const evaluateWithError = useStore((state: any) => state.evaluateVariableDefinitionWithError);
  const definition = row.definition!;
  const currentValue = useStore((state: any) => {
    const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
    return row.scope === 'app' ? exposed?.variables?.[definition.name] : exposed?.page?.variables?.[definition.name];
  });
  const [name, setName] = useState(definition.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);

  useEffect(() => {
    setName(definition.name);
    setNameError(null);
  }, [definition.id, definition.name]);

  const [pendingRename, setPendingRename] = useState<VariableReference[] | null>(null);

  const rename = async () => {
    setPendingRename(null);
    const result: SaveResult = await saveVariableDefinition({ id: definition.id, name }, moduleId);
    if (!result.ok) {
      setNameError(result.error);
      return;
    }
    setNameError(null);
    toast.success(`Renamed ${definition.name} to ${name}. References that build the name dynamically aren't updated.`);
    onRenamed(row.scope, name);
  };

  const commitName = () => {
    if (name === definition.name || pendingRename) return;
    const error = validateName(name, row.scope, definitions, definition.id, pageName);
    if (error) {
      setNameError(error);
      return;
    }
    const references = computeVariableReferences(moduleId, row.scope, definition.name);
    if (references.length) setPendingRename(references);
    else rename();
  };

  const saveValue = async (value: string) => {
    // Braces now mark an expression, so a value saved from this field never needs the old fx flag.
    const result: SaveResult = await saveVariableDefinition({ id: definition.id, value, fxActive: false }, moduleId);
    setValueError(result.ok ? null : result.error);
  };

  return (
    <div className="variables-form" data-cy="variable-detail-form">
      <div className="variables-field">
        <span className="variables-label">
          Scope <span className="variables-hint">Created in the builder</span>
        </span>
        <RocketToggleGroup type="single" value={row.scope} className="tw-w-full" disabled>
          <RocketToggleGroupItem value="app" className="tw-flex-1">
            App
          </RocketToggleGroupItem>
          <RocketToggleGroupItem value="page" className="tw-flex-1">
            Page · {pageName}
          </RocketToggleGroupItem>
        </RocketToggleGroup>
      </div>

      <div className="variables-field">
        <InputComponent
          label="Name"
          size="medium"
          value={name}
          onChange={(e: any) => {
            setName(e.target.value);
            setNameError(null);
          }}
          onBlur={commitName}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') {
              setName(definition.name);
              setNameError(null);
            }
          }}
          isValidatedMessages={nameError ? { valid: false, message: nameError } : { valid: null, message: '' }}
          data-cy="variable-name-input"
        />
      </div>

      <ValueField
        key={definition.id}
        value={replaceIdsWithName(editableValueOf(definition))}
        onChange={saveValue}
        error={valueError}
        evaluation={{
          value: currentValue,
          error: evaluateWithError({ ...definition, scope: row.scope }, moduleId).error,
        }}
      />

      <ReferenceBox scope={row.scope} name={definition.name} />

      {pendingRename && (
        <VariableReferencesDialog
          open
          mode="rename"
          scope={row.scope}
          name={definition.name}
          newName={name}
          references={pendingRename}
          moduleId={moduleId}
          onCancel={() => {
            setPendingRename(null);
            setName(definition.name);
          }}
          onConfirm={rename}
        />
      )}
    </div>
  );
};

/** Detail view of a variable only a script or event creates. */
export const RuntimeVariableDetail = ({
  row,
  onAddInitialValue,
}: {
  row: VariableRow;
  onAddInitialValue: () => void;
}) => (
  <div className="variables-form" data-cy="variable-runtime-detail">
    <div className="variables-note warning">
      <InfoIcon size={14} />
      <span>
        No initial value. This variable only exists after {row.setBy ? <b>{row.setBy}</b> : 'a script or event'} runs,
        so bindings read <code>undefined</code> until then.
      </span>
    </div>
    <div>
      <ButtonComponent variant="outline" size="medium" onClick={onAddInitialValue} data-cy="variable-add-initial-value">
        Add initial value
      </ButtonComponent>
    </div>
    <ReferenceBox scope={row.scope} name={row.name} />
  </div>
);
