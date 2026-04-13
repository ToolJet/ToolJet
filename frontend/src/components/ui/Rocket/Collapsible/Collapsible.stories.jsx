import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './Collapsible';

export default {
  title: 'Rocket/Collapsible',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Bordered (default) ──────────────────────────────────────────────────────

export const Bordered = {
  render: () => (
    <div className="tw-w-[400px]">
      <Collapsible>
        <CollapsibleTrigger>
          <span>Missing user groups (5)</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="tw-font-body-default tw-text-text-default">Group 1, Group 2, Group 3, Group 4, Group 5</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

// ── Ghost ───────────────────────────────────────────────────────────────────

export const Ghost = {
  render: () => (
    <div className="tw-w-[400px]">
      <Collapsible variant="ghost">
        <CollapsibleTrigger>
          <span>Advanced settings</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="tw-font-body-default tw-text-text-default">Additional configuration options would go here.</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

// ── Default Open ────────────────────────────────────────────────────────────

export const DefaultOpen = {
  render: () => (
    <div className="tw-w-[400px]">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>
          <span>Missing user groups (5)</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="tw-font-body-default tw-text-text-default">Group 1, Group 2, Group 3, Group 4, Group 5</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

// ── Multiple ────────────────────────────────────────────────────────────────

export const Multiple = {
  render: () => (
    <div className="tw-w-[400px] tw-flex tw-flex-col tw-gap-2">
      <Collapsible>
        <CollapsibleTrigger>
          <span>Section 1</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="tw-font-body-default tw-text-text-default">Content for section 1.</p>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger>
          <span>Section 2</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="tw-font-body-default tw-text-text-default">Content for section 2.</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};
