export const getCascaderAdvancedToggleUpdates = (value: unknown) => {
  const updates = [{ param: { name: 'advanced' }, attr: 'value', value, paramType: 'properties' }];

  if (value === false) {
    updates.push({
      param: { name: 'optionsLoadingState' },
      attr: 'value',
      value: '{{false}}',
      paramType: 'properties',
    });
  }

  return updates;
};
