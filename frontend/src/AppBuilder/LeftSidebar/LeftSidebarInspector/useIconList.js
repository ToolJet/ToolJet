import React, { useMemo } from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';
import DataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';

const useIconList = ({ exposedComponentsVariables, componentIdNameMapping, exposedQueries }) => {
  const dataQueries = useStore((state) => state.dataQuery.queries.modules.canvas, shallow);
  const queryIcons = Object.keys(exposedQueries).map((queryId) => {
    const query = dataQueries.find((dataQuery) => dataQuery.id === queryId);
    if (!isEmpty(query)) {
      return { iconName: query?.name, jsx: () => <DataSourceIcon source={query} height={16} /> };
    }
  });

  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(), shallow);
  const componentIcons = Object.entries(componentIdNameMapping).map(([key]) => {
    const component = currentPageComponents[key]?.component ?? {};
    if (!isEmpty(component)) {
      return {
        iconName: component?.name,
        iconPath: `assets/images/icons/widgets/${component?.component?.toLowerCase()}.svg`,
        className: 'component-icon',
      };
    }
  });

  const deprecatedIcons = Object.entries(exposedComponentsVariables)
    .map(([key, value]) => {
      const component = currentPageComponents[key]?.component ?? {};
      const componentExposedVariables = value;

      if (!isEmpty(component) && component.component === 'TextInput') {
        const icons = [];

        if (componentExposedVariables.disable) {
          icons.push({
            iconName: 'disable',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setDisable as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.visibility) {
          icons.push({
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }
      if (!isEmpty(component) && component.component === 'Checkbox') {
        const icons = [];

        if (componentExposedVariables.setChecked) {
          icons.push({
            iconName: 'setChecked',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setValue as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }

      if (!isEmpty(component) && component.component === 'Button') {
        const icons = [];

        if (componentExposedVariables.disable) {
          icons.push({
            iconName: 'disable',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setDisable as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.visibility) {
          icons.push({
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.loading) {
          icons.push({
            iconName: 'loading',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setLoading as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }

      if (!isEmpty(component) && component.component === 'Text' && componentExposedVariables?.visibility) {
        return [
          {
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          },
        ];
      }

      return [];
    })
    .flat()
    .filter((value) => value !== undefined); // Remove undefined values

  const iconsList = useMemo(
    () => [...queryIcons, ...componentIcons, ...deprecatedIcons],
    [queryIcons, componentIcons, deprecatedIcons]
  );

  return iconsList;
};

export default useIconList;
