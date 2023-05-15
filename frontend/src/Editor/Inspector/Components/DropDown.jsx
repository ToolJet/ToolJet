import React from 'react';
import { renderElement } from '../Utils';
import Accordion from '@/_ui/Accordion';
import { resolveReferences } from '@/_helpers/utils';
import { EventManager } from '../EventManager';

class DropDown extends React.Component {
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
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState } = this.state;
    const events = Object.keys(componentMeta.events);
    const validations = Object.keys(componentMeta.validation || {});
    const advanced = resolveReferences(this.state.component.component.definition.properties?.advanced?.value) ?? false;

    let items = [];
    items.push({
      title: 'Advanced',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'advanced',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });
    if (advanced !== true) {
      items.push({
        title: 'Display values',
        children: renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'display_values',
          'properties',
          currentState,
          components,
          this.props.darkMode
        ),
      });
    }
    if (advanced !== true) {
      items.push({
        title: 'Values',
        children: renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'values',
          'properties',
          currentState,
          components,
          this.props.darkMode
        ),
      });
    }
    if (advanced == true) {
      items.push({
        title: 'Schema',
        children: renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'schema',
          'properties',
          currentState,
          components,
          this.props.darkMode
        ),
      });
    }
    items.push({
      title: 'Value',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'value',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });
    items.push({
      title: 'Loading state',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'loadingState',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });
    items.push({
      title: 'Label',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'label',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });

    items.push({
      title: 'Placeholder',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'placeholder',
        'properties',
        currentState,
        components,
        this.props.darkMode
      ),
    });
    if (events.length > 0) {
      items.push({
        title: 'Events',
        isOpen: true,
        children: (
          <EventManager
            component={component}
            componentMeta={componentMeta}
            currentState={currentState}
            dataQueries={dataQueries}
            components={this.props.allComponents}
            eventsChanged={this.props.eventsChanged}
            apps={this.props.apps}
            darkMode={this.props.darkMode}
            pages={this.props.pages}
          />
        ),
      });
    }

    if (validations.length > 0) {
      items.push({
        title: `Validation`,
        children: validations.map((property) =>
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            property,
            'validation',
            currentState,
            this.props.allComponents,
            this.props.darkMode
          )
        ),
      });
    }

    items.push({
      title: `General`,
      isOpen: true,
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            this.props.layoutPropertyChanged,
            dataQueries,
            'tooltip',
            'general',
            currentState,
            this.props.allComponents
          )}
        </>
      ),
    });

    items.push({
      title: 'Layout',
      isOpen: false,
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

export { DropDown };
