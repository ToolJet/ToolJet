import React from 'react';
import { Button } from '../Button/Button';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from './Tooltip';

export default {
  title: 'Rocket/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={200}>
        <Story />
      </TooltipProvider>
    ),
  ],
};

// ── Default ──────────────────────────────────────────────────────────────
export const Default = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        This is a tooltip
      </TooltipContent>
    </Tooltip>
  ),
};

// ── Sides ────────────────────────────────────────────────────────────────
export const Sides = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-12 tw-p-16">
      {['top', 'bottom', 'left', 'right'].map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            Tooltip on {side}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Alignments ───────────────────────────────────────────────────────────
export const Alignments = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-12 tw-p-16">
      {['start', 'center', 'end'].map((align) => (
        <Tooltip key={align} defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="secondary">{align}</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align={align}>
            Aligned to {align}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Without arrow ────────────────────────────────────────────────────────
export const WithoutArrow = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="secondary">No arrow</Button>
      </TooltipTrigger>
      <TooltipContent showArrow={false}>
        Tooltip without arrow
      </TooltipContent>
    </Tooltip>
  ),
};

// ── With body text ───────────────────────────────────────────────────────
export const WithBody = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="secondary">With body</Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="tw-max-w-xs">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-font-medium">This is a tooltip title</span>
          <span className="tw-font-normal tw-text-text-on-solid/80">
            Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand the meaning, function or alt-text of an element.
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  ),
};

// ── All sides (composite) ────────────────────────────────────────────────
export const AllSides = {
  render: () => (
    <div className="tw-grid tw-grid-cols-3 tw-gap-8 tw-p-20">
      {[
        { side: 'top', align: 'start', label: 'Top Start' },
        { side: 'top', align: 'center', label: 'Top Center' },
        { side: 'top', align: 'end', label: 'Top End' },
        { side: 'left', align: 'center', label: 'Left' },
        { side: 'bottom', align: 'center', label: 'Bottom Center' },
        { side: 'right', align: 'center', label: 'Right' },
        { side: 'bottom', align: 'start', label: 'Bottom Start' },
        { side: 'bottom', align: 'center', label: 'Bottom' },
        { side: 'bottom', align: 'end', label: 'Bottom End' },
      ].map(({ side, align, label }) => (
        <Tooltip key={label} defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="small">{label}</Button>
          </TooltipTrigger>
          <TooltipContent side={side} align={align}>
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
