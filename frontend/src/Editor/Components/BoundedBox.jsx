import React from 'react';
import Annotation from 'react-image-annotation';
import { PointSelector, RectangleSelector } from 'react-image-annotation/lib/selectors';
import Select from '../../_ui/Select';
import defaultStyles from '@/_ui/Select/styles';

const Box = ({ children, geometry, style }) => {
  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        left: `${geometry.x}%`,
        top: `${geometry.y}%`,
        height: `${geometry.height}%`,
        width: `${geometry.width}%`,
      }}
    >
      {children}
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
function renderSelector({ annotation, active }) {
  const { geometry } = annotation;
  if (!geometry) return null;

  return (
    <Box
      geometry={geometry}
      style={{
        background: 'rgba(255, 255, 255, 0.5)',
        border: 'solid 1px red',
      }}
    ></Box>
  );
}

function renderHighlight({ annotation }) {
  let { geometry } = annotation;

  if (!geometry) return null;
  return (
    <Box
      key={annotation.data.id}
      geometry={geometry}
      style={{
        border: '3px solid green',
        backgroundColor: 'rgba(128, 128, 128, 0.5)',
      }}
    ></Box>
  );
}

class BoundedBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      annotations: [],
      annotation: {},
      type: this.props.properties.selector,
    };
  }

  onChange = (annotation) => {
    this.setState({ annotation });
  };

  selectStyles = (width) => {
    return {
      ...defaultStyles(this.props.darkMode, width),
      menuPortal: (provided) => ({ ...provided, zIndex: 999 }),
      menuList: (base) => ({
        ...base,
      }),
    };
  };

  componentDidUpdate(prevProps) {
    if (prevProps.properties.selector !== this.props.properties.selector) {
      let selector = undefined;
      switch (this.props.properties.selector) {
        case 'RECTANGLE':
          selector = RectangleSelector.TYPE;
          break;
        case 'POINT':
          selector = PointSelector.TYPE;
          break;
        default:
          selector = RectangleSelector.TYPE;
          break;
      }
      this.setState({
        annotation: {},
        type: selector,
      });
    }
  }

  renderContent = ({ annotation }) => {
    const { geometry } = annotation;
    const { data } = annotation;
    const selectOptions = this.props.properties.labels.map((label) => {
      return { name: label, value: label };
    });
    return (
      <div key={annotation.data.id}>
        <div
          style={{
            position: 'absolute',
            left: `${geometry.x}%`,
            top: `${geometry.y + geometry.height}%`,
            width: '100%',
          }}
        >
          <Select
            options={selectOptions}
            onChange={(value) => {
              this.setState(
                (prevState) => {
                  const annotations = prevState.annotations.reduce((acc, annotation) => {
                    if (
                      annotation.data.id === data.id &&
                      annotation.geometry.x === geometry.x &&
                      annotation.geometry.y === geometry.y
                    ) {
                      acc.push({
                        ...annotation,
                        data: {
                          ...annotation.data,
                          text: value,
                        },
                      });
                    } else {
                      acc.push(annotation);
                    }
                    return acc;
                  }, []);
                  return {
                    ...prevState,
                    annotations: annotations,
                  };
                },
                () => {
                  this.props.setExposedVariable('annotations', this.state.annotations);
                }
              );
            }}
            styles={this.selectStyles('100%')}
            value={annotation.data.text}
            className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
          />
        </div>
        <div
          onClick={(event) => {
            event.persist();
            this.setState(
              (prevState) => {
                const annotations = prevState.annotations.reduce((acc, annotation) => {
                  if (
                    annotation.data.id !== data.id &&
                    annotation.geometry.x !== geometry.x &&
                    annotation.geometry.y !== geometry.y
                  ) {
                    acc.push(annotation);
                  }
                  return acc;
                }, []);
                return {
                  ...prevState,
                  annotations: annotations,
                };
              },
              () => {
                this.props.setExposedVariable('annotations', this.state.annotations);
              }
            );
          }}
          style={{
            background: 'black',
            color: 'white',
            padding: 10,
            position: 'absolute',
            fontSize: 12,
            left: `${geometry.x}%`,
            top: `${geometry.y - 5}%`,
          }}
        >
          Delete
        </div>
      </div>
    );
  };

  renderEditor = (props) => {
    const { geometry } = props.annotation;
    if (!geometry) return null;
    const selectOptions = this.props.properties.labels.map((label) => {
      return { name: label, value: label };
    });
    return (
      <div
        style={{
          position: 'absolute',
          left: `${geometry.x}%`,
          top: `${geometry.y + geometry.height}%`,
          width: '100%',
        }}
      >
        <Select
          options={selectOptions}
          onChange={(value) => {
            this.setState(
              {
                annotation: {},
                annotations: this.state.annotations.concat({
                  geometry,
                  data: {
                    text: value,
                    id: Math.random(),
                  },
                }),
              },
              () => {
                this.props.setExposedVariable('annotations', this.state.annotations);
                this.props.fireEvent('onChange');
              }
            );
          }}
          className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
          styles={this.selectStyles('100%')}
        />
      </div>
    );
  };
  renderOverlay = () => {
    return (
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          padding: 5,
          pointerEvents: 'none',
          position: 'absolute',
          top: 5,
          left: 5,
        }}
      ></div>
    );
  };
  render() {
    return (
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: '100%', height: this.props.height }}>
        <Annotation
          src={'https://pbs.twimg.com/media/Fohuj6xaUAYu8uL?format=jpg&name=4096x4096'}
          alt="Two pebbles anthropomorphized holding hands"
          annotations={this.state.annotations}
          type={this.state.type}
          value={this.state.annotation}
          onChange={this.onChange}
          renderSelector={renderSelector}
          renderEditor={this.renderEditor}
          renderHighlight={renderHighlight}
          renderContent={this.renderContent}
          renderOverlay={this.renderOverlay}
        />
      </div>
    );
  }
}
export { BoundedBox };
