import React from 'react';
import Tooltip from '../../Tooltip/Tooltip';
import { Button } from '../../Button/Button';

export const Indentation = () => {
  return <div className="tw-h-[16px] tw-w-[16px] tw-mr-[6px]"></div>;
};

export const ListItemsContent = ({ title, label, disabled }) => {
  return (
    <div
      className={`tw-line-clamp-1 tw-max-w-[118px] tw-text-[12px]/[18px] tw-font-normal ${
        disabled ? 'tw-text-text-disabled' : 'tw-text-text-default'
      }`}
    >
      {title === '' ? label : title}
    </div>
  );
};

export const ListItemsAddon = ({ addon, disabled }) => {
  return (
    <div
      className={`tw-ml-[6px] tw-text-[12px]/[18px] tw-font-normal ${
        disabled ? 'tw-text-text-disabled' : 'tw-text-text-placeholder'
      }`}
    >
      {addon}
    </div>
  );
};

export const SupportingText = ({ supportingText, disabled }) => {
  return (
    <div className="tw-relative tw-flex tw-flex-col tw-items-center tw-ml-[4px]">
      <InfoIcon fill={disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'} />
      {supportingText && (
        <Tooltip
          arrow="Top Center"
          className="tw-hidden peer-hover:tw-flex tw-absolute tw-top-full"
          theme="dark"
          tooltipLabel={supportingText}
        />
      )}
    </div>
  );
};

export const Input = (props) => {
  return (
    <input
      className={`tw-h-[28px] tw-flex tw-py-[7px] tw-px-[6px] tw-items-center tw-w-full tw-bg-background-surface-layer-01 tw-rounded-[6px] tw-text-[12px]/[18px] tw-text-text-default tw-font-medium tw-mr-[8px] tw-border-transparent tw-ring-[1px] tw-ring-interactive-focus-outline tw-ring-offset-[1px] tw-ring-offset-interactive-focus-outline tw-line-clamp-1 disabled:tw-cursor-not-allowed disabled:tw-border-transparent`}
      {...props}
    />
  );
};

export const ErrorIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="tw-h-[16px] tw-w-[16px]"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8.00004 14.6666C4.31814 14.6666 1.33337 11.6818 1.33337 7.99992C1.33337 4.31802 4.31814 1.33325 8.00004 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992ZM10.2392 10.2391C10.044 10.4343 9.72738 10.4343 9.53211 10.2391L8.00005 8.70698L6.46797 10.2391C6.27271 10.4343 5.95613 10.4343 5.76087 10.2391C5.56561 10.0438 5.56561 9.72721 5.76087 9.53195L7.29294 7.99988L5.76088 6.46782C5.56561 6.27255 5.56562 5.95597 5.76088 5.76071C5.95614 5.56545 6.27272 5.56545 6.46798 5.76071L8.00005 7.29277L9.5321 5.76071C9.72737 5.56545 10.0439 5.56545 10.2392 5.76071C10.4345 5.95598 10.4345 6.27256 10.2392 6.46782L8.70715 7.99988L10.2392 9.53195C10.4345 9.72721 10.4345 10.0438 10.2392 10.2391Z"
        fill="#D72D39"
      />
    </svg>
  );
};

export const InfoIcon = ({ fill }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="tw-peer tw-h-[16px] tw-w-[16px]"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8.00004 14.6666C4.31814 14.6666 1.33337 11.6818 1.33337 7.99992C1.33337 4.31802 4.31814 1.33325 8.00004 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992ZM8.66671 4.66659C8.66671 5.03478 8.36823 5.33325 8.00004 5.33325C7.63185 5.33325 7.33337 5.03478 7.33337 4.66659C7.33337 4.2984 7.63185 3.99992 8.00004 3.99992C8.36823 3.99992 8.66671 4.2984 8.66671 4.66659ZM7.33337 6.16659C7.05723 6.16659 6.83337 6.39044 6.83337 6.66659C6.83337 6.94273 7.05723 7.16659 7.33337 7.16659H7.50004V11.3333C7.50004 11.6094 7.7239 11.8333 8.00004 11.8333C8.27618 11.8333 8.50004 11.6094 8.50004 11.3333V6.66659C8.50004 6.39044 8.27618 6.16659 8.00004 6.16659H7.33337Z"
        fill={fill}
      />
    </svg>
  );
};

export const TrailingAction = ({
  trailingActionEdit,
  trailingActionDuplicate,
  trailingActionMenu,
  trailingActionDelete,
  onEdit,
  onDuplicate,
  onMenu,
  onDelete,
}) => {
  return (
    <div className="tw-hidden group-hover:tw-flex group-active:tw-flex tw-gap-[2px] tw-absolute tw-right-[8px]">
      {trailingActionEdit && <Button iconOnly leadingIcon="editable" size="small" variant="outline" onClick={onEdit} />}
      {trailingActionDuplicate && (
        <Button iconOnly leadingIcon="copy" onClick={onDuplicate} size="small" variant="outline" />
      )}
      {trailingActionMenu && (
        <Button iconOnly leadingIcon="morevertical" onClick={onMenu} size="small" variant="outline" />
      )}
      {trailingActionDelete && (
        <Button iconOnly leadingIcon="delete" onClick={onDelete} size="small" variant="outline" />
      )}
    </div>
  );
};

export const EditTrailingAction = ({ indexed, onCancel, onDelete, onSave }) => {
  return (
    <div className="tw-flex tw-gap-[2px]">
      <Button iconOnly leadingIcon="remove" size="small" variant="outline" onClick={onCancel} />
      {indexed && <Button iconOnly leadingIcon="delete" onClick={onDelete} size="small" variant="outline" />}
      {!indexed && <Button iconOnly leadingIcon="tick" onClick={onSave} size="small" variant="outline" />}
    </div>
  );
};
