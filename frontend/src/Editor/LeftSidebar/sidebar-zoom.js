import React from 'react';
import usePopover from '@/_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';

export const LeftSidebarZoom = ({ onZoomChanged }) => {
  const [open, trigger, content, setOpen] = usePopover(false);
  const [text, setText] = React.useState(100);
  return (
    <>
      <LeftSidebarItem
        tip="Select zoom level"
        {...trigger}
        text={`${text} %`}
        className={`left-sidebar-item sidebar-zoom ${open && 'active'}`}
      />
      <div {...content} className={`card popover zoom-popover ${open ? 'show' : 'hide'}`}>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-vcenter table-nowrap">
              <tbody>
                <tr
                  role="button"
                  onClick={() => {
                    setText(100);
                    onZoomChanged(1);
                    setOpen(false);
                  }}
                >
                  <td>100%</td>
                </tr>
                <tr
                  role="button"
                  onClick={() => {
                    setText(90);
                    onZoomChanged(0.9);
                    setOpen(false);
                  }}
                >
                  <td>90%</td>
                </tr>
                <tr
                  role="button"
                  onClick={() => {
                    setText(80);
                    onZoomChanged(0.8);
                    setOpen(false);
                  }}
                >
                  <td>80%</td>
                </tr>
                <tr
                  role="button"
                  onClick={() => {
                    setText(70);
                    onZoomChanged(0.7);
                    setOpen(false);
                  }}
                >
                  <td>70%</td>
                </tr>
                <tr
                  role="button"
                  onClick={() => {
                    setText(60);
                    onZoomChanged(0.6);
                    setOpen(false);
                  }}
                >
                  <td>60%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
