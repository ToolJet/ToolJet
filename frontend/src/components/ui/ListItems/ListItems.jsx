import React, { useState } from 'react';
import {
  EditTrailingAction,
  ErrorIcon,
  Indentation,
  Input,
  ListItemsAddon,
  ListItemsContent,
  SupportingText,
  TrailingAction,
} from './ListItemsUtils/ListItemsUtils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { cn } from '@/lib/utils';

const ListItems = (props) => {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [edit, setEdit] = useState(false);

  return (
    <div
      className={cn(
        `tw-h-[32px] tw-group tw-relative tw-flex ${
          props.disabled
            ? 'tw-bg-interactive-disabled'
            : props.background
            ? 'tw-bg-[#CCD1D5]/30 active:tw-bg-[#ACB2B9]/45'
            : 'active:tw-bg-[#CCD1D5]/30'
        } hover:tw-bg-[#ACB2B9]/35 tw-py-[7px] tw-px-[8px] tw-items-center tw-rounded-[6px]`,
        props.className
      )}
      style={{ width: props.width }}
    >
      {props.indexed && !props.leadingIcon && <Indentation />}
      {props.leadingIcon && (
        <SolidIcon
          name={props.leadingIcon}
          height="16px"
          width="16px"
          fill={props.disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'}
          className="tw-h-[16px] tw-w-[16px] tw-mr-[6px]"
        />
      )}
      {!edit && props.label && <ListItemsContent title={title} label={props.label} disabled={props.disabled} />}
      {!edit && props.addon && <ListItemsAddon addon={props.addon} disabled={props.disabled} />}
      {!edit && props.error && (
        <div className="tw-flex tw-items-center tw-ml-[8px]">
          <ErrorIcon />
        </div>
      )}
      {!edit && props.supportingVisuals && (
        <SupportingText supportingText={props.supportingText} disabled={props.disabled} />
      )}
      {!edit &&
        (props.trailingActionEdit ||
          props.trailingActionDelete ||
          props.trailingActionMenu ||
          props.trailingActionDuplicate) && (
          <TrailingAction
            trailingActionEdit={props.trailingActionEdit}
            trailingActionDelete={props.trailingActionDelete}
            trailingActionMenu={props.trailingActionMenu}
            trailingActionDuplicate={props.trailingActionDuplicate}
            onEdit={() => setEdit(true)}
            onDelete={props.onDelete}
            onMenu={props.onMenu}
            onDuplicate={props.onDuplicate}
          />
        )}
      {edit && <Input value={value} onChange={(e) => setValue(e.target.value)} />}
      {edit && (
        <EditTrailingAction
          indexed={props.indexed}
          onCancel={() => setEdit(false)}
          onSave={() => {
            setTitle(value);
            setEdit(false);
            props.onSaveEdit(value);
          }}
        />
      )}
    </div>
  );
};

export default ListItems;
