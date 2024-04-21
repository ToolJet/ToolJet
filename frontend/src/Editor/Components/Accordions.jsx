import React, { useRef, useState, useEffect } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences } from '@/_helpers/utils';

export const Accordions = function Accordions({
    id,
    component,
    width,
    height,
    containerProps,
    removeComponent,
    setExposedVariable,
    styles,
    fireEvent,
    currentState,
    darkMode,
    dataCy,
}) {
    const { visibility, disabledState, borderRadius } = styles;
    const [currentTab, setCurrentTab] = useState(component.definition.properties?.defaultTab?.value);
    const backgroundColor = darkMode ? '#232e3c' : styles.backgroundColor;
    const widgetColor = darkMode ? '#22272e' : styles.widgetColor;
    const accordionData = resolveReferences(component.definition.properties.tabs.value, currentState) || []
    useEffect(() => {
        setExposedVariable('currentIndex', currentTab);
    }, [currentTab]);
    const parentRef = useRef(null);
    return (
        <div
            data-disabled={disabledState}
            className="jet-tabs card"
            style={{
                'background-color': `${widgetColor}`,
                display: visibility ? 'flex' : 'none',
            }}>
            <Accordion
                defaultActiveKey={currentTab}
                onSelect={(x) => {
                    setTimeout(() => {
                        setCurrentTab(x)
                        fireEvent('onTabSwitch')
                        setExposedVariable('currentIndex', x)
                    }, 100)

                }}
            >
                {accordionData.map((tab, index) => (
                    <Accordion.Item eventKey={index.toString()}>
                        <Accordion.Header>{tab}</Accordion.Header>
                        <Accordion.Body>
                            <div
                                className="jet-container"
                                id={`${id}-${index}`}
                                data-cy={dataCy}
                                style={{
                                    backgroundColor,
                                    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
                                    border: `1px solid ${darkMode?'#6e7781':'#edeff5'}`,
                                    height,
                                    position: 'relative',
                                    height: height - 58 * accordionData.length,
                                }}
                                onClick={(e) => {
                                    if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
                                }}
                                ref={(newCurrent) => {
                                    if (currentTab === index.toString()) {
                                        parentRef.current = newCurrent;
                                    }
                                }}
                            >
                                {currentTab === index.toString() ?
                                    (<><SubContainer
                                        parentComponent={component}
                                        containerCanvasWidth={width}
                                        parent={`${id}-${index}`}
                                        {...containerProps}
                                        parentRef={parentRef}
                                        removeComponent={removeComponent}
                                    />
                                        <SubCustomDragLayer
                                            containerCanvasWidth={width}
                                            parent={`${id}-${index}`}
                                            parentRef={parentRef}
                                            currentLayout={containerProps.currentLayout}
                                        /></>)
                                    : ''}

                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

        </div>
    );
};
