import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import _, { isEmpty, uniqueId } from 'lodash';
import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDragLayer } from 'react-dnd';
import { v4 as uuid } from 'uuid';
import CanvasGridNested from './CanvasGridNested';

function CanvasGrid(props) {
  const boxes = props.boxes;

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [compactType, setCompactType] = useState('vertical');
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState({});
  const [items, setItems] = useState({});
  const itemsRefs = useRef([]);
  const [activeItemId, setActiveItemId] = useState(null);

  // console.log('ALL ITEMS =>', items);

  useEffect(() => {
    console.log('====>ITEMS CHANGED', boxes);
    setItems({ ...boxes });
  }, [boxes]);

  useEffect(() => {
    const gridBoxes = Object.keys(items)
      .filter((boxId) => {
        const box = items[boxId].layouts.desktop;
        if (!props.isNested && items[boxId].parent) {
          return false;
        }
        return box.top && box.left && box.height && box.width;
      })
      .map((key, i) => {
        const currLayout = items[key].layouts.desktop;
        return {
          i: i + '',
          // y: Math.round((currLayout.top / 660) * 66),
          // x: Math.round((currLayout.left / 100) * 48),
          // h: Math.round((currLayout.height / 660) * 66),
          // w: Math.round((currLayout.width / 100) * 48),
          y: currLayout.top,
          x: currLayout.left,
          h: currLayout.height,
          w: currLayout.width,
          id: key,
        };
      });
    setLayouts({ lg: gridBoxes, md: gridBoxes });
  }, [items]);

  const { itemType, isDragging, item, initialOffset, currentOffset, delta, initialClientOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      initialClientOffset: monitor.getInitialClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
      delta: monitor.getDifferenceFromInitialOffset(),
    })
  );

  console.log('isDragging', props.isNested, isDragging);

  // console.log('itemType, isDragging, item, initialOffset, currentOffset, delta, initialClientOffset', {
  //   itemType,
  //   isDragging,
  //   item,
  //   initialOffset,
  //   currentOffset,
  //   delta,
  //   initialClientOffset,
  // });

  const layout = item?.component?.defaultSize || { height: 358, width: 20 };
  // console.log('layout====>', item?.component?.defaultSize);
  // useEffect(() => {
  //   if (!isEmpty(props.initialLayout)) {
  //     setLayouts(props.initialLayout);
  //   }
  // }, [JSON.stringify(props.initialLayout)]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function generateDOM() {
    return _.map(layouts.lg, function (l, i) {
      const { id } = l;
      return (
        <div key={i} className={`bg-info`} widgetid={id}>
          <div className="h-100" ref={(element) => (itemsRefs.current[i] = element)} widgetid={id}>
            {/* {i == 0 && <CanvasGridNested />}
            {i != 0 && props.renderWidget(id, itemsRefs?.current[i]?.offsetHeight)} */}
            {props.renderWidget(id, itemsRefs?.current[i]?.offsetHeight)}
          </div>
        </div>
      );
    });
  }

  function onBreakpointChange(breakpoint) {
    setCurrentBreakpoint(breakpoint);
  }

  function onCompactTypeChange() {
    const oldCompactType = compactType;
    const newCompactType =
      oldCompactType === 'horizontal' ? 'vertical' : oldCompactType === 'vertical' ? null : 'horizontal';
    setCompactType(newCompactType);
  }

  function onLayoutChange(layout, layouts) {
    console.log('onLayoutChange', isDragging, activeItemId);
    const index = Object.keys(items)
      .filter((boxId) => {
        const box = items[boxId].layouts.desktop;
        return box.top && box.left && box.height && box.width;
      })
      .findIndex((itemId) => itemId === activeItemId);
    const newLayout = layout?.[index];
    !isDragging && activeItemId && props.onLayoutChange(newLayout, activeItemId);
  }

  function onNewLayout() {
    setLayouts({ lg: generateLayout() });
  }

  function onOlLayout() {
    setLayouts({ lg: props.initialLayout });
  }

  window.onNewLayout = onNewLayout;
  window.onOlLayout = onOlLayout;

  const onDrop = (layout, layoutItem, _event) => {
    // alert(`Dropped element props:\n${JSON.stringify(layoutItem, null, 2)}`);
    console.log('DROPPED ITEM =>', item, items, layout, layoutItem);
    const newLayout = {
      // top: (layoutItem.y * 660) / 66,
      // left: (layoutItem.x * 100) / 48,
      // height: (layoutItem.h * 660) / 66,
      // width: (layoutItem.w * 100) / 48,
      top: layoutItem.y,
      left: layoutItem.x,
      height: layoutItem.h,
      width: layoutItem.w,
    };
    // return {
    //   i: i + '',
    //   y: Math.round((currLayout.top / 660) * 66),
    //   x: Math.round((currLayout.left / 100) * 48),
    //   h: Math.round((currLayout.height / 660) * 66),
    //   w: Math.round((currLayout.width / 100) * 48),
    //   id: key,
    // };
    // setItems((itms) => ({ ...itms, [uuid()]: { ...item, layouts: { desktop: newLayout } } }));
    props.onDrop(item, newLayout);
  };

  const overlayStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    zIndex: 9999,
    height: '300px',
    width: '300px',
    top: 0,
    left: 0,
  };
  return (
    <div style={{ height: '660px', width: props.isNested ? '1020px' : `${props.canvasWidth}px` }}>
      <ResponsiveReactGridLayout
        style={{ minHeight: 660 }}
        {...props}
        layouts={layouts}
        onBreakpointChange={onBreakpointChange}
        onResizeStop={onLayoutChange}
        margin={[1, 1]}
        onDragStop={(...p) => {
          console.log('===>DRAG STOP', props.isNested);
          onLayoutChange(...p);
        }}
        onDragStart={(...params) => {
          console.log('===>DRAG START', props.isNested);
          setActiveItemId(params[5].getAttribute('widgetid'));
          if (props.isNested) {
            params[4].stopPropagation();
            params[4].preventDefault();
          }
        }}
        // onDrag={(...params) => {
        //   // console.log('===>DRAGGED 1', params[5].offsetParent.getBoundingClientRect().left, layouts);
        //   params[5].style.backgroundColor = '#4FFFB0 !important';
        //   const computedStyles = window.getComputedStyle(params[5]);
        //   const resultObject = {};
        //   for (const key in computedStyles) {
        //     // Check if the value is truthy
        //     if (computedStyles[key]) {
        //       resultObject[key] = computedStyles[key];
        //     }
        //   }

        //   const placeholder = document.getElementsByClassName('react-grid-placeholder')[0];
        //   if (placeholder?.style) {
        //     const regex = /translate\((\d+)px, (\d+)px\)/;
        //     const match = placeholder.style.transform.match(regex);
        //     console.log('====>: Match', match);
        //     if (match) {
        //       const [_, xPixels, yPixels] = match;
        //       console.log('====>: PIXELS', xPixels, yPixels);
        //       let xPixelValue = +xPixels; // Convert to a number
        //       let yPixelValue = +yPixels; // Convert to a number
        //       xPixelValue = xPixelValue - params[5].offsetParent.getBoundingClientRect().left;
        //       yPixelValue = yPixelValue - params[5].offsetParent.getBoundingClientRect().top;
        //       console.log('====>: Bounding', params[5].offsetParent.getBoundingClientRect());
        //       console.log('====>: FINALPIXELS', xPixelValue, `translate(${xPixelValue}px, ${yPixelValue}px)`);
        //       document.getElementById(
        //         'custom-placeholder'
        //       ).style.transform = `translate(${xPixelValue}px, ${yPixelValue}px)`;
        //     }
        //     console.log(
        //       '====>: PIXELS',
        //       document.getElementById('custom-placeholder').style.transform,
        //       placeholder.style.transform
        //     );
        //   }
        // }}
        onResizeStart={(...params) => {
          let currentElement = params[5].parentNode;
          while (currentElement !== null) {
            if (currentElement.hasAttribute('widgetid')) {
              return setActiveItemId(currentElement.getAttribute('widgetid'));
            }
            currentElement = currentElement.parentNode;
          }
        }}
        measureBeforeMount={false}
        // onDragStart={e => e.dataTransfer.setData('text/plain', '')}
        // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
        // and set `measureBeforeMount={true}`.
        useCSSTransforms={mounted}
        // compactType={compactType}
        verticalCompact={false}
        preventCollision={!compactType}
        allowOverlap
        isDroppable={true}
        onDrop={onDrop}
        droppingItem={{ i: '10', w: Math.ceil((layout.width * 48) / 43), h: Math.round(layout.height / 10) }}
      >
        {generateDOM()}
      </ResponsiveReactGridLayout>
      {/* {isDragging && } */}
      {/* {isDragging && <div style={overlayStyle} id="custom-placeholder"></div>} */}
      {/* {isDragging && <div style={overlayStyle} id="custom-placeholder"></div>} */}
    </div>
  );
}

CanvasGrid.propTypes = {
  onLayoutChange: PropTypes.func.isRequired,
};

CanvasGrid.defaultProps = {
  className: 'layout',
  rowHeight: 10,
  onLayoutChange: function () {},
  cols: { lg: 48, md: 48, sm: 48, xs: 48, xxs: 48 },
  initialLayout: generateLayout(),
};

function generateLayout() {
  return _.map(_.range(0, 25), function (item, i) {
    var y = Math.ceil(Math.random() * 4) + 1;
    return {
      x: (_.random(0, 5) * 2) % 12,
      y: Math.floor(i / 6) * y,
      w: 2,
      h: y,
      i: i.toString(),
      static: Math.random() < 0.05,
    };
  });
}

export default CanvasGrid;
