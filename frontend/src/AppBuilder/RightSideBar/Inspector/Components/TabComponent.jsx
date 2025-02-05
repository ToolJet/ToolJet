import React, { useState, useEffect } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/_helpers/utils';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import ListGroup from 'react-bootstrap/ListGroup';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ProgramaticallyHandleProperties } from './Table/ProgramaticallyHandleProperties';


export function TabsLayout({ componentMeta, darkMode, ...restProps }) {
    const {
        layoutPropertyChanged,
        component,
        dataQueries,
        paramUpdated,
        currentState,
        eventsChanged,
        apps,
        allComponents,
        pages,
    } = restProps;


    const isDynamicEnabled = resolveReferences(
        component?.component?.definition?.properties?.useDynamicOptions?.value,
        currentState
    );

    const [tabItems, setTabItems] = useState([]);
    const [hoveredTabItemIndex, setHoveredTabItemIndex] = useState(null);
    let properties = [];
    let additionalActions = [];

    for (const [key] of Object.entries(componentMeta?.properties)) {
        if (componentMeta?.properties[key]?.section === 'additionalActions') {
            additionalActions.push(key);
        } else {

            properties.push(key);
        }
    }

    const constructTabItems = () => {
        const tabItemsValue = component?.component?.definition?.properties?.tabItems?.value;
        let tabItems = [];

        if (typeof tabItemsValue === 'string') {
            tabItems = resolveReferences(tabItemsValue, currentState);
        } else {
            tabItems = tabItemsValue?.map((tabItem) => tabItem);
        }
        return tabItems?.map((tabItem) => {
            const newTabItem = { ...tabItem };

            Object.keys(tabItem)?.forEach((key) => {
                if (typeof tabItem[key]?.value === 'boolean') {
                    newTabItem[key]['value'] = `{{${tabItem[key]?.value}}}`;
                }
            });

            return newTabItem;
        });
    }


    const handleAddTabItem = () => {
        const generateNewTabItem = () => {
            let found = false;
            let title = '';
            let currentNumber = tabItems.length + 1;
            let id = currentNumber;
            while (!found) {
                title = `Tab ${currentNumber}`;
                id = currentNumber;
                if (tabItems.find((tabItem) => tabItem.title === title) === undefined) {
                    found = true;
                }
                currentNumber += 1;
            }
            return {
                id,
                title,
                visible: { value: '{{true}}' },
                disable: { value: '{{false}}' },
            };
        };

        let newTabItem = generateNewTabItem();
        const updatedTabItems = [...tabItems, newTabItem];
        setTabItems(updatedTabItems);
        updateAllTabItemsParams(updatedTabItems);

    };

    const updateAllTabItemsParams = (tabItems) => {
        paramUpdated({ name: 'tabItems' }, 'value', tabItems, 'properties', false);
    };

    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: 'none',
        ...draggableStyle,
    });

    const handleDeleteTabItem = (index) => {
        const updatedTabItems = tabItems.filter((tabItem, i) => i !== index);
        setTabItems(updatedTabItems);
        updateAllTabItemsParams(updatedTabItems);
    };

    const reorderTabItems = (startIndex, endIndex) => {
        const result = Array.from(tabItems);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setTabItems(result);
        updateAllTabItemsParams(result);
    };

    const onDragEnd = ({ source, destination }) => {
        if (!destination || source.index === destination.index) {
            return;
        }
        reorderTabItems(source.index, destination.index);
    };

    const handleBackgroundColorChange = (value, index) => {
        const newTabItems = [...tabItems];
        newTabItems[index].fieldBackgroundColor = { value };
        setTabItems(newTabItems);
        updateAllTabItemsParams(newTabItems);
    };

    const handleValueChange = (item, value, property, index) => {
        const updatedTabItems = tabItems.map((tabItem) => {
            if (tabItem.id === item.id) {
                return {
                    ...tabItem,
                    [property]: value
                };
            }
            return tabItem;
        });

        setTabItems(updatedTabItems);
        updateAllTabItemsParams(updatedTabItems);
    };



    const _renderOverlay = (item, index) => {
        return (
            <Popover className={`${darkMode && 'dark-theme theme-dark'}`} style={{ minWidth: '248px' }}>
                <Popover.Body>
                    <div className="field mb-3" data-cy={`input-and-label-tab-title`}>
                        <label data-cy={`label-tab-title`} className="font-weight-500 mb-1 font-size-12">
                            {'Tab Title'}
                        </label>
                        <CodeHinter
                            currentState={currentState}
                            type={'basic'}
                            initialValue={item?.title}
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            lineNumbers={false}
                            placeholder={'Tab Title'}
                            onChange={(value) => handleValueChange(item, value, 'title', index)}
                        />
                    </div>

                    <div className="field mb-3" data-cy={`input-and-label-tab-id`}>
                        <label data-cy={`label-tab-id`} className="font-weight-500 mb-1 font-size-12">
                            {'Id'}
                        </label>
                        <CodeHinter
                            currentState={currentState}
                            type={'basic'}
                            initialValue={item?.id}
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            lineNumbers={false}
                            placeholder={'Tab ID'}
                            onChange={(value) => handleValueChange(item, value, 'id', index)}
                        />
                    </div>


                    <div className="field mb-2">
                        <ProgramaticallyHandleProperties
                            label="Background"
                            currentState={currentState}
                            index={index}
                            darkMode={darkMode}
                            callbackFunction={handleBackgroundColorChange}
                            property="textColor"
                            props={component}
                            component={component}
                            paramMeta={{ type: 'color', displayName: 'Background' }}
                            paramType="properties"
                        />
                    </div>

                    <div className="field mb-2">
                        <CodeHinter
                            currentState={currentState}
                            initialValue={item?.loading?.value}
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            lineNumbers={false}
                            component={component}
                            type={'fxEditor'}
                            paramLabel={'Loading'}
                            paramName={'loading'}
                            onChange={(value) => {
                                handleValueChange(item, { value }, 'loading', index)
                            }}
                            fieldMeta={{ type: 'toggle', displayName: 'Loading' }}
                            paramType={'toggle'}
                        />
                    </div>

                    <div className="field mb-2" data-cy={`input-and-label-tab-visible`}>
                        <CodeHinter
                            currentState={currentState}
                            initialValue={item?.visible?.value}
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            lineNumbers={false}
                            component={component}
                            type={'fxEditor'}
                            paramLabel={'Visibility'}
                            onChange={(value) => handleValueChange(item, { value }, 'visible', index)}
                            paramName={'visible'}
                            onFxPress={(active) => handleOnFxPress(active, index, 'visible')}
                            fxActive={item?.visible?.fxActive}
                            fieldMeta={{
                                type: 'toggle',
                                displayName: 'Visible',
                            }}
                            paramType={'toggle'}
                        />
                    </div>
                    <div className="field" data-cy={`input-and-label-tab-disable`}>
                        <CodeHinter
                            currentState={currentState}
                            initialValue={item?.disable?.value}
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            lineNumbers={false}
                            component={component}
                            type={'fxEditor'}
                            paramLabel={'Disable'}
                            paramName={'disable'}
                            onChange={(value) => handleValueChange(item, { value }, 'disable', index)}
                            onFxPress={(active) => handleOnFxPress(active, index, 'disable')}
                            fxActive={item?.disable?.fxActive}
                            fieldMeta={{
                                type: 'toggle',
                                displayName: 'Disable',
                            }}
                            paramType={'toggle'}
                        />
                    </div>
                </Popover.Body>
            </Popover>
        );
    };

    useEffect(() => {
        setTabItems(constructTabItems());
    }, [isDynamicEnabled, component?.id]);

    const _renderTabOptions = () => {
        return (
            <List style={{ marginBottom: '20px' }}>
                <DragDropContext
                    onDragEnd={(result) => {
                        onDragEnd(result);
                    }}
                >
                    <Droppable droppableId="droppable">
                        {({ innerRef, droppableProps, placeholder }) => (
                            <div className="w-100" {...droppableProps} ref={innerRef}>
                                {tabItems?.map((item, index) => {
                                    return (
                                        <Draggable key={item.title + item.id} draggableId={item.title + item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    key={index}
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                                >
                                                    <OverlayTrigger
                                                        trigger="click"
                                                        placement="left"
                                                        rootClose
                                                        overlay={_renderOverlay(item, index)}
                                                    >
                                                        <div key={item.title}>
                                                            <ListGroup.Item
                                                                isDraggable={true}
                                                                style={{ marginBottom: '8px', backgroundColor: 'var(--slate3)' }}
                                                                onMouseEnter={() => setHoveredTabItemIndex(index)}
                                                                onMouseLeave={() => setHoveredTabItemIndex(null)}
                                                                {...restProps}
                                                            >
                                                                <div className="row">
                                                                    <div className="col-auto d-flex align-items-center">
                                                                        <SortableList.DragHandle show />
                                                                    </div>
                                                                    <div className="col text-truncate cursor-pointer" style={{ padding: '0px' }}>
                                                                        {resolveReferences(item.title, currentState)}
                                                                    </div>
                                                                    <div className="col-auto">
                                                                        {index === hoveredTabItemIndex && (
                                                                            <ButtonSolid
                                                                                variant="danger"
                                                                                size="xs"
                                                                                className={'delete-icon-btn'}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteTabItem(index);
                                                                                }}
                                                                            >
                                                                                <span className="d-flex">
                                                                                    <Trash fill={'var(--tomato9)'} width={12} />
                                                                                </span>
                                                                            </ButtonSolid>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </ListGroup.Item>
                                                        </div>
                                                    </OverlayTrigger>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                }

                                )}
                                {placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <AddNewButton onClick={handleAddTabItem} className="mt-0">
                    Add new tab
                </AddNewButton>
            </List>
        );
    };


    let items = [];

    if (properties.length > 0) {
        items.push({
            title: 'Options',
            isOpen: true,
            children: (
                isDynamicEnabled ? properties?.map((property) =>
                    renderElement(
                        component,
                        componentMeta,
                        paramUpdated,
                        dataQueries,
                        property,
                        'properties',
                        currentState,
                        allComponents,
                        darkMode
                    )
                ) :
                    <>
                        {renderElement(
                            component,
                            componentMeta,
                            paramUpdated,
                            dataQueries,
                            'useDynamicOptions',
                            'properties',
                            currentState,
                            allComponents
                        )}
                        {_renderTabOptions()}
                    </>
            )

        });
    }

    items.push({
        title: 'Events',
        isOpen: true,
        children: (
            <EventManager
                sourceId={component?.id}
                eventSourceType="component"
                eventMetaDefinition={componentMeta}
                currentState={currentState}
                dataQueries={dataQueries}
                components={allComponents}
                eventsChanged={eventsChanged}
                apps={apps}
                darkMode={darkMode}
                pages={pages}
            />
        ),
    });



    items.push({
        title: `Additional Actions`,
        isOpen: true,
        children: additionalActions.map((property) => {
            return renderElement(
                component,
                componentMeta,
                paramUpdated,
                dataQueries,
                property,
                'properties',
                currentState,
                allComponents,
                darkMode,
                componentMeta.properties?.[property]?.placeholder
            );
        }),
    });


    items.push({
        title: 'Devices',
        isOpen: true,
        children: (
            <>
                {renderElement(
                    component,
                    componentMeta,
                    layoutPropertyChanged,
                    dataQueries,
                    'showOnDesktop',
                    'others',
                    currentState,
                    allComponents
                )}
                {renderElement(
                    component,
                    componentMeta,
                    layoutPropertyChanged,
                    dataQueries,
                    'showOnMobile',
                    'others',
                    currentState,
                    allComponents
                )}
            </>
        ),
    });

    return <Accordion items={items} />;
}