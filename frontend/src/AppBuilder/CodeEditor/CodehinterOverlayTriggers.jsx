/* eslint-disable import/no-unresolved */
import React from 'react';
import { openSearchPanel } from '@codemirror/search';
import './SearchBox.scss';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

export const CodeHinterBtns = ({ view, isPanelOpen, renderCopilot }) => {
  return (
    <div
      className="d-flex tw-flex-col align-items-end tw-gap-[2.5px] w-100 position-absolute tw-pt-[4px] tw-pr-[4px]"
      style={{ top: isPanelOpen ? '44px' : 0 }}
    >
      {!isPanelOpen && (
        <ButtonComponent
          iconOnly
          trailingIcon="search01"
          size="small"
          variant="outline"
          ariaLabel="Open search panel"
          className="codehinter-search-btn"
          onClick={() => openSearchPanel(view)}
        />
      )}
      {renderCopilot && renderCopilot()}
    </div>
  );
};
