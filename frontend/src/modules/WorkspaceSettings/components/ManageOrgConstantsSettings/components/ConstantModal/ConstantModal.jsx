import React, { useState } from 'react';
import { Check, Info, Lock, Plus } from 'lucide-react';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  InlineInfo,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/Rocket';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import ActionDialog from '@/components/ui/Rocket/Dialog/ActionDialog';
import ConstantValueRow from './ConstantValueRow';
import { useConstantForm } from './useConstantForm';
import { FALLBACK_ERROR } from '../../helpers/constants';

const DUPLICATE_NAME_ERROR = 'A constant with this name and type already exists';

const TYPE_OPTIONS = [
  {
    value: 'Global',
    label: 'Global constants',
    description: "Reusable values you can use anywhere. Don't store credentials here as these are not masked.",
  },
  {
    value: 'Secret',
    label: 'Secrets',
    description: 'For credentials. Masked in the browser and resolved on the server when a query runs.',
  },
];

function TypeOption({ value, label, description }) {
  const id = `constant-type-${value}`;
  return (
    <div className="tw-flex tw-items-start tw-gap-1.5">
      <RadioGroupItem id={id} value={value} aria-describedby={`${id}-description`} className="tw-mt-0.5" />
      <div className="tw-flex tw-flex-col">
        <label htmlFor={id} className="tw-m-0 tw-font-body-default tw-text-text-default">
          {label}
        </label>
        <span id={`${id}-description`} className="tw-font-body-small tw-text-text-placeholder">
          {description}
        </span>
      </div>
    </div>
  );
}

// Design: a 196px menu (180px rows) with 10px corners; `compact` brings the elevation-300 shadow and 8px padding.
const ENVIRONMENT_MENU_CLASSES = { content: 'tw-w-[196px] tw-rounded-large' };
const ENVIRONMENT_ICON_CLASS = 'tw-text-icon-default';

function AddEnvironmentMenu({ form, lockedPlanName }) {
  const lockedTooltip = lockedPlanName
    ? `Available on ${lockedPlanName} plan`
    : 'Upgrade your plan to use this environment';

  const items = form.availableEnvironments.map((env) => ({
    id: env.id,
    label: env.name,
    disabled: !env.enabled,
    onSelect: () => form.addEnvironment(env.id),
    render: ({ children }) => (
      <span className="tw-flex tw-w-full tw-items-center tw-justify-between">
        {children}
        {env.enabled ? (
          <Plus size={16} className={ENVIRONMENT_ICON_CLASS} />
        ) : (
          <Lock size={16} className={ENVIRONMENT_ICON_CLASS} />
        )}
      </span>
    ),
    wrapper: env.enabled
      ? undefined
      : (node) => (
          <Tooltip content={lockedTooltip} isTooltipForInteractiveDisabledElement>
            {node}
          </Tooltip>
        ),
  }));

  return (
    <DropdownMenu
      trigger={
        <Button
          variant="outline"
          size="medium"
          leadingVisual={<Plus size={14} />}
          disabled={!form.canAddEnvironment}
          data-cy="add-environment-button"
        >
          Add environment
        </Button>
      }
      align="end"
      compact
      classes={ENVIRONMENT_MENU_CLASSES}
      sections={[{ id: 'environments', items }]}
    />
  );
}

function ValuesEmptyState({ form }) {
  const quickAdd = form.availableEnvironments.filter((env) => env.enabled);
  return (
    <div className="-tw-mt-0.5 tw-flex tw-min-h-[250px] tw-flex-col tw-items-center tw-justify-center tw-rounded-large tw-border tw-border-dashed tw-border-border-weak tw-py-10">
      <div className="tw-flex tw-w-max tw-min-w-[259px] tw-flex-col tw-gap-3 tw-text-center">
        <div className="tw-flex tw-flex-col">
          <span className="tw-font-title-default tw-text-text-default">No values added yet</span>
          <span className="tw-font-body-small tw-text-text-placeholder">
            Add an environment to create a <br />
            value for this constant.
          </span>
        </div>
        <div className="tw-flex tw-justify-center tw-gap-2">
          {quickAdd.map((env) => (
            <Button
              key={env.id}
              variant="outline"
              size="small"
              className="tw-gap-0.5 tw-rounded-full tw-px-2 tw-font-title-small"
              trailingVisual={<Plus size={12} className="!tw-size-3" />}
              onClick={() => form.addEnvironment(env.id)}
            >
              {env.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConstantModalDialog({
  mode,
  open,
  onOpenChange,
  constant,
  environments,
  lockedPlanName,
  multiEnvironment = true,
  onSubmit,
}) {
  const isEdit = mode === 'edit';
  const form = useConstantForm({ mode, constant, environments, multiEnvironment });
  const [pending, setPending] = useState(false);
  const [duplicateName, setDuplicateName] = useState(false);
  const [serverError, setServerError] = useState(null);

  const nameError = duplicateName ? DUPLICATE_NAME_ERROR : form.nameError;
  // A removed value keeps its row in the form until save (that is what sends the delete) but is no longer shown.
  const visibleRows = form.rows.filter((row) => !row.removed);

  const close = () => {
    if (!pending) onOpenChange(false);
  };

  const handleNameChange = (next) => {
    setDuplicateName(false);
    form.setName(next);
  };
  const handleTypeChange = (next) => {
    setDuplicateName(false);
    form.setType(next);
  };

  const handleSubmit = async () => {
    setPending(true);
    setServerError(null);
    setDuplicateName(false);
    try {
      await onSubmit(form.toApiBody());
      onOpenChange(false);
    } catch (err) {
      if (err?.statusCode === 409) setDuplicateName(true);
      else setServerError(err?.error || FALLBACK_ERROR);
    } finally {
      setPending(false);
    }
  };

  return (
    <ActionDialog
      open={open}
      handleOpenChange={(next) => !next && close()}
      title={isEdit ? 'Edit constant' : 'Create constant'}
      showCloseButton
      showCancelButton={false}
      classes={{
        dialogContent: 'tw-max-w-[min(1056px,calc(100vw-2rem))] tw-border-0',
        dialogHeader: 'tw-h-[72px] tw-px-8 tw-py-3',
        dialogTitle: 'tw-font-title-heavy-large',
        dialogBody: 'tw-h-[min(556px,calc(100vh-10rem))] tw-overflow-y-auto tw-px-8 tw-py-6',
        dialogFooter: 'tw-h-[72px] tw-border-t tw-border-border-weak tw-px-8 tw-py-3',
      }}
      cancelBtnProps={{ onClick: close }}
      footerStart={
        <div className="tw-flex tw-items-center tw-gap-1.5 tw-font-body-default tw-text-text-medium">
          <Info aria-hidden size={16} className="tw-text-icon-accent" />
          Name and type cannot be edited post-creation
        </div>
      }
      submitActions={[
        { label: 'Cancel', variant: 'outline', disabled: pending, onClick: close, 'data-cy': 'cancel-button' },
        {
          label: isEdit ? 'Save changes' : 'Add constant',
          disabled: !form.canSubmit || pending,
          isLoading: pending,
          onClick: handleSubmit,
          'data-cy': 'save-constant-button',
        },
      ]}
    >
      <div className="tw-flex tw-flex-col tw-gap-5">
        <Field className="tw-w-[496px] tw-max-w-full tw-gap-0.5">
          <FieldLabel htmlFor="constant-name" className="tw-pl-0.5">
            Name
          </FieldLabel>
          <Input
            id="constant-name"
            data-cy="constant-name-input"
            placeholder="EXAMPLE_API_KEY"
            value={form.name}
            disabled={isEdit}
            aria-invalid={Boolean(nameError)}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          {nameError ? (
            <FieldError className="tw-pl-0.5">{nameError}</FieldError>
          ) : (
            !isEdit && (
              <FieldDescription className="tw-pl-0.5">Name must be unique and max 50 characters</FieldDescription>
            )
          )}
        </Field>

        <div className="tw-flex tw-flex-col tw-gap-2">
          <span className="tw-flex tw-h-5 tw-items-center tw-font-title-default tw-text-text-default">Type</span>
          <RadioGroup value={form.type} onValueChange={handleTypeChange} disabled={isEdit} className="tw-gap-3">
            {TYPE_OPTIONS.map((option) => (
              <TypeOption key={option.value} {...option} />
            ))}
          </RadioGroup>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-flex-col tw-pl-0.5">
              <span className="tw-font-title-default tw-text-text-default">Values</span>
              <span className="tw-font-body-small tw-text-text-placeholder">
                Configure a value for each environment separately
              </span>
            </div>
            {form.allEnvironmentsAdded ? (
              <span className="tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-[5px] tw-font-title-default tw-text-text-accent">
                <Check size={14} />
                All environments added
              </span>
            ) : (
              <AddEnvironmentMenu form={form} lockedPlanName={lockedPlanName} />
            )}
          </div>

          {visibleRows.length === 0 ? (
            <ValuesEmptyState form={form} />
          ) : (
            visibleRows.map((row) => (
              <ConstantValueRow
                key={row.environmentId}
                row={row}
                canRemove={form.canRemove(row.environmentId)}
                otherEnvironmentNames={visibleRows
                  .filter((other) => other.environmentId !== row.environmentId)
                  .map((other) => other.environmentName)}
                onChange={(value) => form.setValue(row.environmentId, value)}
                onBlur={() => form.touchRow(row.environmentId)}
                onRemove={() => form.removeRow(row.environmentId)}
              />
            ))
          )}
        </div>

        {serverError && <InlineInfo type="danger" variant="filled" description={serverError} />}
      </div>
    </ActionDialog>
  );
}

// Bumps every time the dialog opens, so the form below remounts with fresh state for each open.
function useOpenCount(open) {
  const [count, setCount] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCount((c) => c + 1);
  }
  return count;
}

export default function ConstantModal(props) {
  return <ConstantModalDialog key={useOpenCount(props.open)} {...props} />;
}
