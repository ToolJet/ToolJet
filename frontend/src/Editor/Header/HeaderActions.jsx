import React from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function HeaderActions({ handleUndo, canUndo, handleRedo, canRedo }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { currentLayout, toggleCurrentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state.currentLayout,
      toggleCurrentLayout: state.actions.toggleCurrentLayout,
    }),
    shallow
  );
  return (
    <div className="editor-header-actions">
      <div style={{ borderRadius: 6 }}>
        <div
          className="d-flex align-items-center p-1 current-layout"
          style={{ height: 28, background: darkMode ? '#202425' : '#F1F3F5', borderRadius: 6 }}
          role="tablist"
          aria-orientation="horizontal"
        >
          <button
            className={cx('btn border-0 p-1', {
              'bg-transparent': currentLayout !== 'desktop',
              'bg-white': currentLayout === 'desktop',
              'opacity-100': currentLayout === 'desktop',
            })}
            style={{ height: 20 }}
            role="tab"
            type="button"
            aria-selected="true"
            tabIndex="0"
            onClick={() => toggleCurrentLayout('desktop')}
            data-cy={`button-change-layout-to-desktop`}
          >
            {/* <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.28125 4.17106C2.28125 3.38866 2.91551 2.75439 3.69792 2.75439H15.0312C15.8137 2.75439 16.4479 3.38866 16.4479 4.17106V11.2544C16.4479 12.0368 15.8137 12.6711 15.0312 12.6711H12.1979V14.0877H12.9062C13.2975 14.0877 13.6146 14.4049 13.6146 14.7961C13.6146 15.1873 13.2975 15.5044 12.9062 15.5044H5.82292C5.43172 15.5044 5.11458 15.1873 5.11458 14.7961C5.11458 14.4049 5.43172 14.0877 5.82292 14.0877H6.53125V12.6711H3.69792C2.91551 12.6711 2.28125 12.0368 2.28125 11.2544V4.17106ZM7.94792 12.6711V14.0877H10.7812V12.6711H7.94792ZM3.69792 11.2544V4.17106H15.0312V11.2544H3.69792Z"
                fill="#11181C"
              />
              
            </svg> */}
            <SolidIcon name="computer" width="14" fill={currentLayout === 'desktop' ? '#11181C' : '#C1C8CD'} />
          </button>
          <button
            className={cx('btn border-0 p-1', {
              'bg-transparent': currentLayout !== 'mobile',
              'bg-white': currentLayout === 'mobile',
              'opacity-100': currentLayout === 'mobile',
            })}
            role="tab"
            type="button"
            style={{ height: 20 }}
            aria-selected="false"
            tabIndex="-1"
            onClick={() => toggleCurrentLayout('mobile')}
            data-cy={`button-change-layout-to-mobile`}
          >
            <SolidIcon name="mobile" width="14" fill={currentLayout !== 'desktop' ? '#11181C' : '#C1C8CD'} />
            {/* <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.86328 3.12939C6.44907 3.12939 6.11328 3.46518 6.11328 3.87939V14.3794C6.11328 14.7936 6.44907 15.1294 6.86328 15.1294H12.8633C13.2775 15.1294 13.6133 14.7936 13.6133 14.3794V3.87939C13.6133 3.46518 13.2775 3.12939 12.8633 3.12939H11.3633C11.3633 3.54361 11.0275 3.87939 10.6133 3.87939H9.11328C8.69907 3.87939 8.36328 3.54361 8.36328 3.12939H6.86328ZM4.61328 3.87939C4.61328 2.63675 5.62064 1.62939 6.86328 1.62939H12.8633C14.1059 1.62939 15.1133 2.63675 15.1133 3.87939V14.3794C15.1133 15.622 14.1059 16.6294 12.8633 16.6294H6.86328C5.62064 16.6294 4.61328 15.622 4.61328 14.3794V3.87939ZM9.86328 12.1294C10.2775 12.1294 10.6133 12.4652 10.6133 12.8794V12.8869C10.6133 13.3011 10.2775 13.6369 9.86328 13.6369C9.44907 13.6369 9.11328 13.3011 9.11328 12.8869V12.8794C9.11328 12.4652 9.44907 12.1294 9.86328 12.1294Z"
                fill="#11181C"
              />
            </svg> */}
          </button>
        </div>
      </div>
      <div className="undo-redo-container">
        <svg
          onClick={handleUndo}
          xmlns="http://www.w3.org/2000/svg"
          data-cy={`editor-undo-button`}
          className={cx('undo-button cursor-pointer icon icon-tabler icon-tabler-arrow-back-up', {
            disabled: !canUndo,
          })}
          width="44"
          height="44"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={darkMode ? '#fff' : '#2c3e50'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-tooltip-id="tooltip-for-undo"
          data-tooltip-content="Undo"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none">
            <title>undo</title>
          </path>
          <path d="M9 13l-4 -4l4 -4m-4 4h11a4 4 0 0 1 0 8h-1" fill="none">
            <title>undo</title>
          </path>
        </svg>
        <svg
          title="redo"
          onClick={handleRedo}
          xmlns="http://www.w3.org/2000/svg"
          data-cy={`editor-redo-button`}
          className={cx('redo-button cursor-pointer icon icon-tabler icon-tabler-arrow-forward-up', {
            disabled: !canRedo,
          })}
          width="44"
          height="44"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={darkMode ? '#fff' : '#2c3e50'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-tooltip-id="tooltip-for-redo"
          data-tooltip-content="Redo"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none">
            <title>redo</title>
          </path>
          <path d="M15 13l4 -4l-4 -4m4 4h-11a4 4 0 0 0 0 8h1" />
        </svg>
      </div>
      <Tooltip id="tooltip-for-undo" className="tooltip" />
      <Tooltip id="tooltip-for-redo" className="tooltip" />
    </div>
  );
}

export default HeaderActions;
