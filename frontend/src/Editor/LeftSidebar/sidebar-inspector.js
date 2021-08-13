import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';
import ReactJson from 'react-json-view';

export const LeftSidebarInspector = ({ globals, components, queries }) => {
  const [open, trigger, content] = usePopover(false)

  return (
    <>
      <LeftSidebarItem {...trigger} icon='inspector' className='left-sidebar-item' />
      <div {...content} className={`card popover ${open ? 'show' : 'hide'}`}>
        <div className="card-body">
          <ReactJson
            src={queries}
            // theme={this.props.darkMode ? 'shapeshifter' : 'rjv-default'}
            name={'queries'}
            style={{ fontSize: '0.7rem' }}
            enableClipboard={false}
            displayDataTypes={false}
            collapsed={true}
            displayObjectSize={false}
            quotesOnKeys={false}
            sortKeys={true}
          />
          <ReactJson
            src={components}
            // theme={this.props.darkMode ? 'shapeshifter' : 'rjv-default'}
            name={'components'}
            style={{ fontSize: '0.7rem' }}
            enableClipboard={false}
            displayDataTypes={false}
            collapsed={true}
            displayObjectSize={false}
            quotesOnKeys={false}
            sortKeys={true}
            // indentWidth={0.5}
          />
          <ReactJson
            style={{ fontSize: '0.7rem' }}
            // theme={this.props.darkMode ? 'shapeshifter' : 'rjv-default'}
            theme={'rjv-default'}
            enableClipboard={false}
            src={globals}
            name={'globals'}
            displayDataTypes={false}
            collapsed={true}
            displayObjectSize={false}
            quotesOnKeys={false}
            sortKeys={true}
          // indentWidth={1}
          />
        </div>
      </div>
    </>
  )
}
