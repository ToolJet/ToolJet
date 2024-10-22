// export const MultiComponentHandle = {
//   name: 'multiComponentHandle',
//   props: [],
//   events: [],
//   render() {
//     return configHandleForMultiple('multiple-components-config-handle');
//   },
// };

// export const CustomMouseInteraction = {
//   name: 'mouseTest',
//   props: {},
//   events: {},
//   mouseEnter(e) {
//     const controlBoxes = document.getElementsByClassName('moveable-control-box');
//     for (const element of controlBoxes) {
//       element.classList.remove('moveable-control-box-d-block');
//     }
//     e.props.target.classList.add('hovered');
//     e.controlBox.classList.add('moveable-control-box-d-block');
//   },
//   mouseLeave(e) {
//     e.props.target.classList.remove('hovered');
//     e.controlBox.classList.remove('moveable-control-box-d-block');
//   },
// };

// function configHandleForMultiple(id) {
//   return (
//     <div
//       className={'multiple-components-config-handle'}
//       onMouseUpCapture={handleMouseUpCapture}
//       onMouseDownCapture={handleMouseDownCapture}
//     >
//       <span className="badge handle-content" id={id} style={{ background: '#4d72fa' }}>
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//           <img
//             style={{ cursor: 'pointer', marginRight: '5px', verticalAlign: 'middle' }}
//             src="assets/images/icons/settings.svg"
//             width="12"
//             height="12"
//             draggable="false"
//           />
//           <span>components</span>
//         </div>
//       </span>
//     </div>
//   );
// }

// function handleMouseUpCapture() {
//   // Implement the logic for mouse up capture
// }

// function handleMouseDownCapture() {
//   // Implement the logic for mouse down capture
// }
