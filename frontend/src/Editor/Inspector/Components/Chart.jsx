import React from 'react';
import { renderElement } from '../Utils';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

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
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState } = this.state;

    const data = this.state.component.component.definition.properties.data;

    const chartType = this.state.component.component.definition.properties.type.value;

    return (
      <div className="properties-container p-2">
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'title',
          'properties',
          currentState,
          components
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'type',
          'properties',
          currentState,
          components
        )}

        <div className="field mb-3 chart-data-input">
          <label className="form-label">Chart data</label>
          <CodeHinter
            currentState={this.props.currentState}
            initialValue={data.value}
            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
            mode="javascript"
            lineNumbers={false}
            className="chart-input pr-2"
            onChange={(value) => this.props.paramUpdated({ name: 'data' }, 'value', value, 'properties')}
          />
        </div>
        {Object.keys(componentMeta.styles).map((style) =>
          renderElement(component, componentMeta, paramUpdated, dataQueries, style, 'styles', currentState, components)
        )}

        {renderElement(component, componentMeta, paramUpdated, dataQueries, 'loadingState', 'properties', currentState)}

        {chartType !== 'pie' &&
          renderElement(component, componentMeta, paramUpdated, dataQueries, 'markerColor', 'properties', currentState)}

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
      </div>
    );
  }
}

export { Chart };
