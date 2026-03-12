import React from 'react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/Rocket/empty';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function WorkflowsEmptyStateSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="175" height="121" viewBox="0 0 175 121" fill="none">
      <g clip-path="url(#clip0_1586_88975)">
        <rect width="174.29" height="120.26" rx="9.29547" fill="#EAF1FA" />
        <rect width="174.29" height="112.127" rx="9.29547" fill="white" />
        <circle cx="11.9093" cy="11.9093" r="2.61435" fill="#D8E6FF" />
        <circle cx="19.462" cy="11.9093" r="2.61435" fill="#D8E6FF" />
        <circle cx="27.0147" cy="11.9093" r="2.61435" fill="#D8E6FF" />
        <rect x="9" y="19" width="155.699" height="84.8211" rx="2.32387" fill="#EAF1FA" />
        <rect
          x="17.4091"
          y="56.4091"
          width="32.7272"
          height="8.1818"
          rx="1.22727"
          fill="white"
          stroke="#CFE1FF"
          stroke-width="0.81818"
        />
        <path d="M52.9775 60.5H62.7957" stroke="#CFE1FF" stroke-width="0.40909" stroke-linecap="round" />
        <circle cx="64.8299" cy="60.4998" r="0.40909" fill="#CECBDE" stroke="#CFE1FF" stroke-width="0.81818" />
        <rect
          x="67.2733"
          y="56.4091"
          width="32.7272"
          height="8.1818"
          rx="1.22727"
          fill="white"
          stroke="#CFE1FF"
          stroke-width="0.81818"
        />
        <path d="M103.43 58.6411L119.793 44.3229" stroke="#CFE1FF" stroke-width="0.40909" stroke-linecap="round" />
        <path d="M102.843 61.5391L119.615 76.6754" stroke="#CFE1FF" stroke-width="0.40909" stroke-linecap="round" />
        <circle cx="122.248" cy="42.2791" r="0.40909" fill="#CECBDE" stroke="#CFE1FF" stroke-width="0.81818" />
        <circle cx="121.661" cy="78.7225" r="0.40909" fill="#CECBDE" stroke="#CFE1FF" stroke-width="0.81818" />
        <rect
          x="123.475"
          y="38.4091"
          width="32.7272"
          height="8.1818"
          rx="1.22727"
          fill="white"
          stroke="#CFE1FF"
          stroke-width="0.81818"
        />
        <rect
          x="123.475"
          y="74.4091"
          width="32.7272"
          height="8.1818"
          rx="1.22727"
          fill="white"
          stroke="#CFE1FF"
          stroke-width="0.81818"
        />
      </g>
      <rect x="0.3" y="0.3" width="173.69" height="119.66" rx="8.99547" stroke="#BCD2F5" stroke-width="0.6" />
      <defs>
        <clipPath id="clip0_1586_88975">
          <rect width="174.29" height="120.26" rx="9.29547" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function EmptyState({
  title = "You don't have any resources yet",
  description = 'You can start creating resources using the options available in your interface.',
  iconName = '',
  className = 'tw-h-full',
  children,
  resourceType = 'default', // 'workflows', 'datasources', 'modules', or 'default'
  isError = false, // Whether this is an error state
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  // Determine the icon name based on resourceType, isError, and theme
  const resolvedIconName = () => {
    // If a custom iconName is provided and it's not the default, use it
    if (iconName) return iconName;

    // Handle error state
    if (isError) return darkMode ? 'failed-to-load-dark' : 'failed-to-load';

    // Handle resource-specific icons
    switch (resourceType) {
      case 'workflows':
        return <WorkflowsEmptyStateSVG />;
      // return darkMode ? 'workflows-empty-state-dark' : 'workflows-empty-state';
      case 'datasources':
        return darkMode ? 'data-sources-empty-state-dark' : 'data-sources-empty-state';
      case 'modules':
        return darkMode ? 'modules-empty-state-dark' : 'modules-empty-state';
      default:
        return darkMode ? 'mobile-empty-state-dark' : 'mobile-empty-state';
    }
  };

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="default">
          {resolvedIconName()}
          {/* <SolidIcon name={resolvedIconName()} width="200" height="140" fill="var(--icon-default)" /> */}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
        <EmptyContent>{children}</EmptyContent>
      </EmptyHeader>
    </Empty>
  );
}
