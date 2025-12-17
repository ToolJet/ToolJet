import React, { useMemo, useState, useEffect } from 'react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/Rocket/empty';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function EmptyResource({
  title = "You don't have any resources yet",
  description = 'You can start creating resources using the options available in your interface.',
  iconName = 'mobile-empty-state',
  className = 'tw-mt-24',
  children,
  resourceType = 'default', // 'workflows', 'datasources', 'modules', or 'default'
  isError = false, // Whether this is an error state
}) {
  // Detect dark mode from body class with reactive updates
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.body.classList.contains('dark-theme');
  });

  // Watch for dark-theme class changes on body element
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.body.classList.contains('dark-theme'));
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    });

    return () => observer.disconnect();
  }, []);

  // Determine the icon name based on resourceType, isError, and theme
  const resolvedIconName = useMemo(() => {
    // If a custom iconName is provided and it's not the default, use it
    if (iconName !== 'mobile-empty-state') {
      return iconName;
    }

    // Handle error state
    if (isError) {
      return isDarkMode ? 'failed-to-load-dark' : 'failed-to-load';
    }

    // Handle resource-specific icons
    switch (resourceType) {
      case 'workflows':
        return isDarkMode ? 'workflows-empty-state-dark' : 'workflows-empty-state';
      case 'datasources':
        return isDarkMode ? 'data-sources-empty-state-dark' : 'data-sources-empty-state';
      case 'modules':
        return isDarkMode ? 'modules-empty-state-dark' : 'modules-empty-state';
      default:
        return isDarkMode ? 'mobile-empty-state-dark' : 'mobile-empty-state';
    }
  }, [iconName, resourceType, isError, isDarkMode]);

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <SolidIcon name={resolvedIconName} width="200" height="140" fill="var(--icon-default)" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
        <EmptyContent>{children}</EmptyContent>
      </EmptyHeader>
    </Empty>
  );
}

export default EmptyResource;
