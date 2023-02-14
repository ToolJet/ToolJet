import React from 'react';
import Annotation from 'react-image-annotation';
import { PointSelector, RectangleSelector, OvalSelector } from 'react-image-annotation/lib/selectors';

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

// function renderHighlight({ annotation, active }) {
//   const { geometry } = annotation;
//   if (!geometry) return null;

//   return (
//     <Box
//       key={annotation.data.id}
//       geometry={geometry}
//       style={{
//         border: 'solid 1px black',
//         boxShadow: active && '0 0 20px 20px rgba(255, 255, 255, 0.3) inset',
//       }}
//     >
//       Custom Highlight
//     </Box>
//   );
// }

// function renderEditor(props) {
//   const { geometry } = props.annotation;
//   if (!geometry) return null;

//   return (
//     <div
//       style={{
//         background: 'white',
//         borderRadius: 3,
//         position: 'absolute',
//         left: `${geometry.x}%`,
//         top: `${geometry.y + geometry.height}%`,
//       }}
//     >
//       <div>Custom Editor</div>
//       <input
//         onChange={(e) =>
//           props.onChange({
//             ...props.annotation,
//             data: {
//               ...props.annotation.data,
//               text: e.target.value,
//             },
//           })
//         }
//       />
//       <button onClick={props.onSubmit}>Comment</button>
//     </div>
//   );
// }

// function renderOverlay() {
//   return (
//     <div
//       style={{
//         background: 'rgba(0, 0, 0, 0.3)',
//         color: 'white',
//         padding: 5,
//         pointerEvents: 'none',
//         position: 'absolute',
//         top: 5,
//         left: 5,
//       }}
//     >
//       Custom Overlay
//     </div>
//   );
// }

class BoundedBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      annotations: [],
      annotation: {},
    };
  }

  onChange = (annotation) => {
    this.setState({ annotation });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.properties.selector !== this.props.properties.selector) {
      let selector = undefined;
      switch (this.props.properties.selector) {
        case 'rectangle':
          selector = RectangleSelector.TYPE;
          break;
        case 'oval':
          selector = OvalSelector.TYPE;
          break;
        case 'point':
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

  onSubmit = (annotation) => {
    const { geometry, data } = annotation;

    this.setState({
      annotation: {},
      annotations: this.state.annotations.concat({
        geometry,
        data: {
          ...data,
          id: Math.random(),
        },
      }),
    });
  };

  renderContent = ({ annotation }) => {
    const { geometry } = annotation;
    const { data } = annotation;
    return (
      <div key={annotation.data.id}>
        <div
          style={{
            background: 'black',
            color: 'white',
            padding: 10,
            position: 'absolute',
            fontSize: 12,
            left: `${geometry.x}%`,
            top: `${geometry.y + geometry.height}%`,
          }}
        >
          {annotation.data && annotation.data.text}
        </div>
        <div
          onClick={(event) => {
            event.persist();
            console.log('annotations before filter ---bb', '---bb');
            this.setState((prevState) => {
              const annotations = prevState.annotations.reduce((acc, annotation) => {
                console.log(annotation, 'annotation set state', data, 'data', geometry, 'geo', '---bb');
                if (
                  annotation.data.id !== data.id &&
                  annotation.geometry.x !== geometry.x &&
                  annotation.geometry.y !== geometry.y
                ) {
                  acc.push(annotation);
                }
                return acc;
              }, []);
              console.log(annotations, 'annotations ---bb');
              return {
                annotations: annotations,
              };
            });
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
          delete
        </div>
      </div>
    );
  };
  render() {
    return (
      <div onMouseDown={(e) => e.stopPropagation()}>
        <Annotation
          src={'https://pbs.twimg.com/media/Fohuj6xaUAYu8uL?format=jpg&name=4096x4096'}
          alt="Two pebbles anthropomorphized holding hands"
          annotations={this.state.annotations}
          type={this.state.type}
          value={this.state.annotation}
          onChange={this.onChange}
          onSubmit={this.onSubmit}
          renderSelector={renderSelector}
          // renderEditor={renderEditor}
          // renderHighlight={renderHighlight}
          renderContent={this.renderContent}
          // renderOverlay={renderOverlay}
        />
      </div>
    );
  }
}
export { BoundedBox };
