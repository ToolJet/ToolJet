import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';
import ReactJson from 'react-json-view';


export const LeftSidebarDebugger = ({ darkMode, components, errors }) => {
    const [open, trigger, content] = usePopover(false)
    const [currrentTab, setCurrentTab] = React.useState(1)
    const [queryErrors, setQueryErrors] = React.useState([])

    const switchCurrentTab = (tab) => {
        setCurrentTab(tab)
    }

    React.useEffect(() => {
        
        setQueryErrors(prev => {
            let copy = JSON.parse(JSON.stringify(prev))
            copy = copy.filter(val => Object.keys(val).length !== 0)
            const newError = _.flow([
                Object.entries,
                arr => arr.filter(([key, value]) => value.data.status),
                Object.fromEntries
            ])(errors);
            
            const errorData = []
            Object.entries(newError).map(([key, value]) => {
                errorData.push({
                    key: key,
                    message: value.data.message,
                    description: value.data.description,
                    options: {name: 'substitutedVariables', data: value.options},
                    response: {name: 'response', data: value.data.data},
                })
            })
            const newState = [...copy, ...errorData]
            return newState
        })
    },[errors])

    return (
    <>
      <LeftSidebarItem tip='Debugger' {...trigger} icon='debugger' className='left-sidebar-item' />
      <div {...content} className={`card popover debugger-popover ${open ? 'show' : 'hide'}`} style={{minWidth:'180px', minHeight:'108px', maxWidth:'480px'}} >
          <div className="row-header">
              <div className="nav-header">
                  <ul className="nav nav-tabs" data-bs-toggle="tabs">
                      <li className="nav-item">
                          <a onClick={() => switchCurrentTab(1)} className={currrentTab === 1 ? "nav-link active" : "nav-link"}>
                              Errors
                          </a>
                      </li>
                  </ul>
              </div>
          </div>
        
        
        {currrentTab === 1 && (
            <div className="card-body">
                {queryErrors.length === 0 && (
                <center className="p-2 text-muted">
                    No errors found.
                </center>
                )}

                <div className="tab-content">
                    {queryErrors.map((query, index) => (
                        <LeftSidebarDebugger.Queries queryProps={query} idx={index} darkMode={darkMode} />
                    ))} 
                </div>

                
            </div>
        )}
      </div>
    </>
    )
}


function QueriesComponent ({ queryProps, idx, darkMode }) {

    const [open, setOpen] = React.useState(false)
    return (
        <div className="tab-content" key={`${queryProps.key}-${idx}`}>
            
            <p className='text-azure' onClick={() => setOpen((prev) => !prev)}>
                <img className={`svg-icon ${open ? 'iopen': ''}`} src={`/assets/images/icons/caret-right.svg`} width="16" height="16"/>
                [Query {queryProps.key}] &nbsp;
                <span className="text-red">{`Query Failed: ${queryProps.description}`} {queryProps.message}.</span>
            </p>
            <div className={` queryData ${open ? 'open' : 'close'} py-0`} >
                <span>
                    <ReactJson
                        src={queryProps.options.data}
                        theme={darkMode ? 'shapeshifter' : 'rjv-default'}
                        name={queryProps.options.name}
                        style={{ fontSize: '0.7rem', paddingLeft:'0.35rem' }}
                        enableClipboard={false}
                        displayDataTypes={false}
                        collapsed={true}
                        displayObjectSize={false}
                        quotesOnKeys={false}
                        sortKeys={false}
                    /> 
                </span>
                <div>

                <ReactJson
                    src={queryProps.response.data}
                    theme={darkMode ? 'shapeshifter' : 'rjv-default'}
                    name={queryProps.response.name}
                    style={{ fontSize: '0.7rem',paddingLeft:'0.35rem' }}
                    enableClipboard={false}
                    displayDataTypes={false}
                    collapsed={true}
                    displayObjectSize={false}
                    quotesOnKeys={false}
                    sortKeys={false}
                    />  
                </div>
            </div>
            <hr className="border-1 border-top bg-grey py-0" />
        </div>
    )
}



LeftSidebarDebugger.Queries = QueriesComponent; 