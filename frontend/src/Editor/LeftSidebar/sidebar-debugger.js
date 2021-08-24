import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';
import ReactJson from 'react-json-view';
import _ from 'lodash'


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
                arr => arr.filter(([key, value]) => value.status),
                Object.fromEntries
            ])(errors);

            const errorData = Object.entries(newError).map(([key, value]) => {
                return (
                    {
                        key: key,
                        message: value.message,
                        description: value.description,
                        details: {
                        'substituted variables': getComponentVariables(components),
                        'response': value.data
                        }
                    }
                )
            })
            const newState = [...copy, ...errorData]
            return newState
        })
    },[errors])


    const getComponentVariables = (component) => {
        const _keys = Object.keys(component).map(key => `components.${key}`)
        const _values =  Object.assign({}, ...Object.values(component))

        const componentKeysValues = Object.entries(_values).map(([key, value]) => {
            return {
                componentVar: key,
                value: value
            }
        })

        const componentVariables = _keys.map((key) => {
            return componentKeysValues.map((val) => {
                return {
                    key: `{{${key}.${val.componentVar}}}`,
                    value:  val.value
                }
            })
        })

        return componentVariables.flat().reduce((acc, {key,value}) =>  (acc[key] = value, acc), {})
    }

    return (
    <>
      <LeftSidebarItem tip='Debugger' {...trigger} icon='debugger' className='left-sidebar-item' />
      <div {...content} className={`card popover debugger-popover ${open ? 'show' : 'hide'}`} style={{maxWidth: '585px', minWidth: '176px'}}>
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
                    You haven&apos;t run any queries yet. <br />
                </center>
                )}
                {queryErrors.map((error, index) => (
                     <div className="tab-content" key={`${error.key}-${index}`}>
                        <ReactJson
                            src={error.details}
                            theme={darkMode ? 'shapeshifter' : 'rjv-default'}
                            name={
                                <p className="text-azure">
                                    [Query {error.key}] <span className="text-red">{`Query Failed: ${error.description}`} {error.message}.</span>
                                </p> 
                            }
                            style={{ fontSize: '0.8rem' }}
                            enableClipboard={false}
                            displayDataTypes={false}
                            collapsed={true}
                            displayObjectSize={false}
                            quotesOnKeys={false}
                            sortKeys={false}
                        /> 
                     </div>   
                ))}
            </div>
        )}
      </div>
    </>
    )
}







