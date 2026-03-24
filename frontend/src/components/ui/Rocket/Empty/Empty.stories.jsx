import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './Empty';
import { Button } from '../Button/Button';

export default {
  title: 'Rocket/Empty',
  component: Empty,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
    },
  },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  render: (args) => (
    <div className="tw-w-96">
      <Empty {...args}>
        <EmptyMedia variant="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No files found</EmptyTitle>
          <EmptyDescription>Upload a file to get started with your project.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">Upload file</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
};

// ── Without action ────────────────────────────────────────────────────────
export const WithoutAction = {
  render: (args) => (
    <div className="tw-w-96">
      <Empty {...args}>
        <EmptyMedia variant="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>Try adjusting your search or filter to find what you're looking for.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
};

// ── With illustration (default media variant) ─────────────────────────────
export const WithIllustration = {
  render: (args) => (
    <div className="tw-w-96">
      <Empty {...args}>
        <EmptyMedia>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tw-text-icon-default"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m9.5 16 2.5-4 2.5 4" />
            <circle cx="12" cy="9" r="1.5" />
          </svg>
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No images</EmptyTitle>
          <EmptyDescription>Drag and drop images here or click to browse.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">Browse files</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-w-[480px]">
      {['large', 'default', 'small'].map((size) => (
        <div key={size}>
          <span className="tw-text-xs tw-text-text-placeholder tw-mb-2 tw-block">{size}</span>
          <Empty size={size}>
            <EmptyMedia variant="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No files found</EmptyTitle>
              <EmptyDescription>Upload a file to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size={size}>
                Upload
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
