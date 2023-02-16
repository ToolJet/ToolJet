import React from 'react';
import Annotation from 'react-image-annotation';
import { PointSelector, RectangleSelector } from 'react-image-annotation/lib/selectors';
import Select from '../../_ui/Select';

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
      <div
        key={annotation.data.id}
        style={{
          position: 'absolute',
          left: `${geometry.x}%`,
          top: `${geometry.y + geometry.height}%`,
          width: `${geometry.w}%`,
        }}
        className="d-flex justify-content-between"
      >
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
          className="d-flex align-items-center cursor-pointer col-1"
        >
          <svg width="20" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
              fill="#DB4324"
            />
          </svg>
        </div>
        <div>
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
            value={annotation.data.text}
            className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
          />
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
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: this.props.styles.visibility ? 'block' : 'none', width: '100%', height: this.props.height }}
      >
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
          disableAnnotation={this.props.styles.disabledState}
        />
      </div>
    );
  }
}
export { BoundedBox };
