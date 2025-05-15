import React, { useEffect } from 'react';
import { ComponentsManagerTab } from '@/AppBuilder/RightSideBar/ComponentsManagerTab';
import { WidgetBox } from '@/AppBuilder/RightSideBar/WidgetBox';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDrag } from 'react-dnd';
import { RightSideBar } from '@/AppBuilder/RightSideBar/RightSideBar';

const component = {
  index: 0,
  component: {
    validate: true,
    name: 'DatePicker',
    displayName: 'Date Picker',
    description: 'Choose date',
    component: 'DatePickerV2',
    defaultSize: { height: 40, width: 10 },
  },
};

export const RightSidebar = () => {
  return (
    <>
      <RightSideBar />
      {/* <div
        className="snapGrid"
        // style={{ position: 'fixed', right: 0, top: 0, width: '300px', height: '100%', background: 'yellow' }}
        style={{ position: 'fixed', right: '-300px', top: 0, width: '300px', height: '100%' }}
      >
        <div
          id="virtual-moveable-target"
          className="target virtual-moveable-target"
          component-type="Datepicker"
          draggable={true}
          style={{
            width: '200px',
            height: '150px',
            transform: 'translate(0px, 0px)',
          }}
        >
          Target
        </div>
        <div
          id="virtual-moveable-target"
          className="target virtual-moveable-target"
          component-type="Datepicker"
          draggable={true}
          style={{
            width: '200px',
            height: '150px',
            transform: 'translate(300px, 0px)',
          }}
        >
          Target
        </div>
      </div> */}
    </>
  );
};

// <div className="snapGrid" style={{ position: 'fixed', right: 0, top: 0, width: '300px', height: '100%' }}>
{
  /* <div
        className="target virtual-moveable-target"
        draggable={true}
        style={{
          width: '200px',
          height: '150px',
          transform: 'translate(0px, 0px)',
        }}
      >
        Target
      </div>
      <div
        className="target virtual-moveable-target"
        style={{
          width: '200px',
          height: '150px',
          transform: 'translate(0px, 0px)',
        }}
      >
        Target
      </div>
      <div
        id="virtual-moveable-target"
        className="target virtual-moveable-target"
        style={{
          width: '200px',
          height: '150px',
          transform: 'translate(200px, 0px)',
        }}
      >
        Target
      </div> */
}
// <div
//   id="virtual-moveable-target"
//   className="target virtual-moveable-target"
//   component-type="Datepicker"
//   // style={{
//   //   width: '200px',
//   //   height: '150px',
//   //   transform: 'translate(200px, 0px)',
//   // }}
// >
//   <WidgetBox component={component.component} />
// </div>
// <div
//   id="virtual-moveable-target"
//   className="target virtual-moveable-target"
//   component-type="Datepicker"
//   // style={{
//   //   width: '200px',
//   //   height: '150px',
//   //   transform: 'translate(200px, 0px)',
//   // }}
// >
//   <WidgetBox component={component.component} />
// </div>
{
  /* <ComponentsManagerTab /> */
}
// </div>
