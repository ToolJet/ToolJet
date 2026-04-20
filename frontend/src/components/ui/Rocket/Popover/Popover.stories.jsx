import React from 'react';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverTrigger } from './Popover';
import { Button } from '../Button/Button';

export default {
  title: 'Rocket/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ──────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the width and height for the layer.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

// ── Title only ───────────────────────────────────────────────────────────────

export const TitleOnly = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Title only</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Quick settings</PopoverTitle>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

// ── With body content ────────────────────────────────────────────────────────

export const WithBodyContent = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Share this page</PopoverTitle>
          <PopoverDescription>Anyone with the link can view.</PopoverDescription>
        </PopoverHeader>
        <div className="tw-flex tw-gap-2">
          <Button variant="outline" size="small" className="tw-flex-1">
            Copy link
          </Button>
          <Button variant="primary" size="small" className="tw-flex-1">
            Share
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// ── Alignment ────────────────────────────────────────────────────────────────

export const Alignment = {
  render: () => (
    <div className="tw-flex tw-gap-3">
      {['start', 'center', 'end'].map((align) => (
        <Popover key={align}>
          <PopoverTrigger asChild>
            <Button variant="outline">align=&quot;{align}&quot;</Button>
          </PopoverTrigger>
          <PopoverContent align={align}>
            <PopoverHeader>
              <PopoverTitle>Aligned: {align}</PopoverTitle>
              <PopoverDescription>Content is anchored to the {align} edge of the trigger.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

// ── Sides ────────────────────────────────────────────────────────────────────

export const Sides = {
  render: () => (
    <div className="tw-grid tw-grid-cols-2 tw-gap-6 tw-p-24">
      {['top', 'right', 'bottom', 'left'].map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="outline">side=&quot;{side}&quot;</Button>
          </PopoverTrigger>
          <PopoverContent side={side}>
            <PopoverHeader>
              <PopoverTitle>Side: {side}</PopoverTitle>
              <PopoverDescription>Popover opens to the {side} of the trigger.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};
