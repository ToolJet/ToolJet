import React from 'react';
import _ from 'lodash';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

class DragFromOutsideLayout extends React.Component {
  static defaultProps = {
    className: 'layout',
    rowHeight: 30,
    onLayoutChange: function () {},
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  };

  constructor(props) {
    super(props);

    this.state = {
      currentBreakpoint: 'lg',
      compactType: 'vertical',
      mounted: false,
      layouts: { lg: generateLayout() },
    };
  }

  componentDidMount() {
    this.setState({ mounted: true });
  }

  generateDOM() {
    return _.map(this.state.layouts.lg, function (l, i) {
      return (
        <div key={i} className={l.static ? 'static' : ''} style={{ backgroundColor: 'red' }}>
          {l.static ? (
            <span className="text" title="This item is static and cannot be removed or resized.">
              Static - {i}
            </span>
          ) : (
            <span className="text">{i}</span>
          )}
        </div>
      );
    });
  }

  onBreakpointChange = (breakpoint) => {
    this.setState({
      currentBreakpoint: breakpoint,
    });
  };

  onCompactTypeChange = () => {
    const { compactType: oldCompactType } = this.state;
    const compactType =
      oldCompactType === 'horizontal' ? 'vertical' : oldCompactType === 'vertical' ? null : 'horizontal';
    this.setState({ compactType });
  };

  onLayoutChange = (layout, layouts) => {
    this.props.onLayoutChange(layout, layouts);
  };

  onNewLayout = () => {
    this.setState({
      layouts: { lg: generateLayout() },
    });
  };

  onDrop = (layout, layoutItem, _event) => {
    alert(`Dropped element props:\n${JSON.stringify(layoutItem, ['x', 'y', 'w', 'h'], 2)}`);
  };

  render() {
    return (
      <div>
        <ResponsiveReactGridLayout
          {...this.props}
          layouts={this.state.layouts}
          onBreakpointChange={this.onBreakpointChange}
          onLayoutChange={this.onLayoutChange}
          onDrop={this.onDrop}
          measureBeforeMount={false}
          onDragStart={(a, b, c, d, e) => e.stopPropagation()}
          useCSSTransforms={this.state.mounted}
          // compactType={this.state.compactType}
          verticalCompact={false}
          preventCollision={!this.state.compactType}
          isDroppable={true}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
      </div>
    );
  }
}

function generateLayout() {
  return _.map(_.range(0, 0), function (item, i) {
    var y = Math.ceil(Math.random() * 4) + 1;
    return {
      x: Math.round(Math.random() * 5) * 2,
      y: Math.floor(i / 6) * y,
      w: 2,
      h: y,
      i: i.toString(),
      // static: Math.random() < 0.05,
    };
  });
}

export default DragFromOutsideLayout;
