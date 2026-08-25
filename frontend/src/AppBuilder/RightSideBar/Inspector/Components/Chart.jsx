import React from 'react';
import { renderElement } from '../Utils';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { EventManager } from '../EventManager';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';

class Chart extends React.Component {
  constructor(props) {
    super(props);

    const {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    } = props;

    this.state = {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    };
  }

  componentDidMount() {
    const {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    } = this.props;

    this.setState({
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    });
  }

  render() {
    const {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      components,
      currentState,
      allComponents,
      apps,
      eventsChanged,
      darkMode,
      pages,
    } = this.props;
    const data = this.props.component.component.definition.properties.data; // since component is not unmounting on every render in current scenario

    const jsonDescription = this.props.component.component.definition.properties.jsonDescription;

    const plotFromJson = resolveWidgetFieldValue(
      this.props.component.component.definition.properties.plotFromJson?.value
    );
    const chartType = this.props.component.component.definition.properties.type.value;

    let items = [];
    let additionalActions = [];
    for (const [key] of Object.entries(componentMeta?.properties ?? {})) {
      if (componentMeta?.properties[key]?.section === 'additionalActions') {
        additionalActions.push(key);
      }
    }

    items.push({
      title: 'Title',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'title',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });

    items.push({
      title: 'Plotly JSON chart schema',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'plotFromJson',
        'properties',
        currentState
      ),
    });

    if (plotFromJson) {
      items.push({
        title: 'Bar mode',
        children: renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'barmode',
          'properties',
          currentState
        ),
      });
    }

    if (plotFromJson) {
      items.push({
        title: 'JSON description',
        children: (
          <CodeHinter
            type="basic"
            initialValue={jsonDescription?.value ?? {}}
            className="chart-input pr-2"
            onChange={(value) => this.props.paramUpdated({ name: 'jsonDescription' }, 'value', value, 'properties')}
            componentName={`component/${this.props.component.component.name}::${chartType}`}
          />
        ),
      });
    } else {
      items.push({
        title: 'Properties',
        children: renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'type',
          'properties',
          currentState,
          components
        ),
      });

      items.push({
        title: 'Chart data',
        children: (
          <CodeHinter
            type="basic"
            initialValue={data.value}
            className="chart-input pr-2"
            onChange={(value) => this.props.paramUpdated({ name: 'data' }, 'value', value, 'properties')}
            componentName={`component/${this.props.component.component.name}::${chartType}`}
          />
        ),
      });
    }

    if (chartType !== 'pie') {
      if (!plotFromJson) {
        items.push({
          title: 'Marker color',
          children: renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'markerColor',
            'properties',
            currentState
          ),
        });
      }
    }

    items.push({
      title: 'Options',
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'loadingState',
            'properties',
            currentState
          )}
          {chartType !== 'pie' &&
            renderElement(component, componentMeta, paramUpdated, dataQueries, 'showAxes', 'properties', currentState)}
          {chartType !== 'pie' &&
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'showGridLines',
              'properties',
              currentState
            )}
        </>
      ),
    });

    items.push({
      id: ADDITIONAL_ACTIONS_ACCORDION_ID,
      title: `${i18next.t('widget.common.additionalActions', 'Additional Actions')}`,
      children: additionalActions?.map((property) => {
        const paramType = property === 'Tooltip' ? 'general' : 'properties';
        return renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          paramType,
          currentState,
          components,
          darkMode,
          componentMeta.properties?.[property]?.placeholder
        );
      }),
    });

    items.push({
      title: 'Events',
      children: (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    });

    items.push({
      title: 'Devices',
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            this.props.layoutPropertyChanged,
            dataQueries,
            'showOnDesktop',
            'others',
            currentState,
            components
          )}
          {renderElement(
            component,
            componentMeta,
            this.props.layoutPropertyChanged,
            dataQueries,
            'showOnMobile',
            'others',
            currentState,
            components
          )}
        </>
      ),
    });

    return <Accordion items={items} />;
  }
}

export { Chart };
