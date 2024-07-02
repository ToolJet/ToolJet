import React, { useState } from 'react';
import { ErrorIcon, InfoIcon, Input } from './ListItemsUtils/ListItemsUtils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Button } from '../Button/Button';
import { cn } from '@/lib/utils';
import Tooltip from '../Tooltip/Tooltip';

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
      {props.indexed && !props.leadingIcon && <div className="tw-h-[16px] tw-w-[16px] tw-mr-[6px]"></div>}
      {props.leadingIcon && (
        <SolidIcon
          name={props.leadingIcon}
          height="16px"
          width="16px"
          fill={props.disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'}
          className="tw-h-[16px] tw-w-[16px] tw-mr-[6px]"
        />
      )}
      {!edit && props.label && (
        <div
          className={`tw-line-clamp-1 tw-max-w-[118px] tw-text-[12px]/[18px] tw-font-normal ${
            props.disabled ? 'tw-text-text-disabled' : 'tw-text-text-default'
          }`}
        >
          {title === '' ? props.label : title}
        </div>
      )}
      {!edit && props.addon && (
        <div
          className={`tw-ml-[6px] tw-text-[12px]/[18px] tw-font-normal ${
            props.disabled ? 'tw-text-text-disabled' : 'tw-text-text-placeholder'
          }`}
        >
          {props.addon}
        </div>
      )}
      {!edit && props.error && (
        <div className="tw-flex tw-items-center tw-ml-[8px]">
          <ErrorIcon />
        </div>
      )}
      {!edit && props.supportingVisuals && (
        <div className="tw-relative tw-flex tw-flex-col tw-items-center tw-ml-[4px]">
          <InfoIcon fill={props.disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'} />
          {props.supportingText && (
            <Tooltip
              arrow="Top Center"
              className="tw-hidden peer-hover:tw-flex tw-absolute tw-top-full"
              theme="dark"
              tooltipLabel={props.supportingText}
            />
          )}
        </div>
      )}
      {!edit &&
        (props.trailingActionEdit ||
          props.trailingActionDelete ||
          props.trailingActionMenu ||
          props.trailingActionDuplicate) && (
          <div className="tw-hidden group-hover:tw-flex group-active:tw-flex tw-gap-[2px] tw-absolute tw-right-[8px]">
            {props.trailingActionEdit && (
              <Button iconOnly leadingIcon="editable" size="small" variant="outline" onClick={() => setEdit(true)} />
            )}
            {props.trailingActionDuplicate && (
              <Button iconOnly leadingIcon="copy" onClick={() => {}} size="small" variant="outline" />
            )}
            {props.trailingActionMenu && (
              <Button iconOnly leadingIcon="morevertical" onClick={() => {}} size="small" variant="outline" />
            )}
            {props.trailingActionDelete && (
              <Button iconOnly leadingIcon="delete" onClick={() => {}} size="small" variant="outline" />
            )}
          </div>
        )}
      {edit && <Input value={value} onChange={(e) => setValue(e.target.value)} />}
      {edit && (
        <div className="tw-flex tw-gap-[2px]">
          <Button iconOnly leadingIcon="remove" size="small" variant="outline" onClick={() => setEdit(false)} />
          {props.indexed && <Button iconOnly leadingIcon="delete" onClick={() => {}} size="small" variant="outline" />}
          {!props.indexed && (
            <Button
              iconOnly
              leadingIcon="tick"
              onClick={() => {
                setTitle(value);
                setEdit(false);
              }}
              size="small"
              variant="outline"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ListItems;
