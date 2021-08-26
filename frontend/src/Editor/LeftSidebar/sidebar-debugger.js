import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';
import ReactJson from 'react-json-view';
import _ from 'lodash'


export const LeftSidebarDebugger = ({ darkMode, components, errors }) => {
    const [open, trigger, content] = usePopover(false)
    const [currrentTab, setCurrentTab] = React.useState(1)
    const [errorLogs, setErrorLogs] = React.useState([])
    const [unReadErrorCount, setUnReadErrorCount] = React.useState({read: 0, unread: 0})

    const switchCurrentTab = (tab) => {
        setCurrentTab(tab)
    }

    React.useEffect(() => {
        
        setErrorLogs(prev => {
            let copy = JSON.parse(JSON.stringify(prev))
            copy = copy.filter(val => Object.keys(val).length !== 0)
            const newError = _.flow([
                Object.entries,
                arr => arr.filter(([key, value]) => value.data.status),
                Object.fromEntries
            ])(errors);
            
            const errorData = []
            Object.entries(newError).map(([key, value]) => {
                const variableNames = {
                    options: '',
                    response: ''
                }
                switch (value.type) {
                    case 'query': 
                        variableNames.options = 'substitutedVariables';
                        variableNames.response = 'response';
                        break;
                    default: 'options';
                }
                errorData.push({
                    type: value.type,
                    key: key,
                    message: value.data.message,
                    description: value.data.description,
                    options: {name: variableNames.options, data: value.options},
                    response: {name: variableNames.response, data: value.data.data},
                })
            })

            const newData = [...copy, ...errorData]
            return newData

        })
    },[errors])

    React.useEffect(() => {
        const unRead = errorLogs.length - unReadErrorCount.read

        if(open ===  false && errorLogs.length !== unReadErrorCount.read) {
            setUnReadErrorCount((prev) => {
                let copy = JSON.parse(JSON.stringify(prev))
                copy.unread = unRead
                return copy
            })
        }
        
        if(open === true) {
            setUnReadErrorCount((prev) => {
                let copy = JSON.parse(JSON.stringify(prev))
                copy.read = errorLogs.length
                copy.unread = 0
                return copy
            })
        }
    },[errorLogs.length, open])

    return (
    <>
      <LeftSidebarItem tip='Debugger' {...trigger} icon='debugger' className='left-sidebar-item' badge={true} count={unReadErrorCount.unread} />
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
                {errorLogs.length === 0 && (
                <center className="p-2 text-muted">
                    No errors found.
                </center>
                )}

                <div className="tab-content">
                    {errorLogs.map((error, index) => (
                        <LeftSidebarDebugger.ErrorLogs errorProps={error} idx={index} darkMode={darkMode} />
                    ))} 
                </div>

                
            </div>
        )}
      </div>
    </>
    )
}


function ErrorLogsComponent ({ errorProps, idx, darkMode }) {

    const [open, setOpen] = React.useState(false)
    return (
        <div className="tab-content" key={`${errorProps.key}-${idx}`}>
            
            <p className='text-azure' onClick={() => setOpen((prev) => !prev)}>
                <img className={`svg-icon ${open ? 'iopen': ''}`} src={`/assets/images/icons/caret-right.svg`} width="16" height="16"/>
                [{_.capitalize(errorProps.type)} {errorProps.key}] &nbsp;
                <span className="text-red">{`Query Failed: ${errorProps.description}`} {errorProps.message}.</span>
            </p>
            <div className={` queryData ${open ? 'open' : 'close'} py-0`} >
                <span>
                    <ReactJson
                        src={errorProps.options.data}
                        theme={darkMode ? 'shapeshifter' : 'rjv-default'}
                        name={errorProps.options.name}
                        style={{ fontSize: '0.7rem', paddingLeft:'0.35rem' }}
                        enableClipboard={false}
                        displayDataTypes={false}
                        collapsed={true}
                        displayObjectSize={false}
                        quotesOnKeys={false}
                        sortKeys={false}
                    /> 
                </span>
                <span>
                    <ReactJson
                        src={errorProps.response.data}
                        theme={darkMode ? 'shapeshifter' : 'rjv-default'}
                        name={errorProps.response.name}
                        style={{ fontSize: '0.7rem', paddingLeft:'0.35rem' }}
                        enableClipboard={false}
                        displayDataTypes={false}
                        collapsed={true}
                        displayObjectSize={false}
                        quotesOnKeys={false}
                        sortKeys={false}
                    /> 
                </span>
 
            <hr className="border-1 border-bottom bg-grey py-0" />
            </div>
        </div>
    )
}



LeftSidebarDebugger.ErrorLogs = ErrorLogsComponent; 