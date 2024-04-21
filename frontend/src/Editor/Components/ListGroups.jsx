import React, { useState, useEffect, useRef } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';

export const ListGroups = function ListGroups({
    id,
    width,
    height,
    component,
    darkMode,
    currentState,
    onComponentOptionChanged,
    onComponentOptionsChanged,
    setExposedVariable,
    onEvent,
    canvasWidth,
    registerAction,
    properties,
    styles,
    fireEvent,
}) {
    const [visibility, setVisibility] = useState(styles.visibility);
    const [disabledState, setDisabledState] = useState(styles.disabledState);
    const [listData, setListData] = useState(properties.listData);
    const [defaultActivate, setDefaultActivate] = useState();
    const [horizontal, setHorizontal] = useState(properties.horizontal);
    const [showIndex, setShowIndex] = useState(properties.showIndex);
    const [itemStyle, setItemStyle] = useState(styles.itemStyle);
    const [badgeStyle, setBadgeStyle] = useState(styles.badgeStyle);

    useEffect(() => {
        if (properties.listData instanceof Array)
            setListData(properties.listData)
        else
            setListData([])
    }, [properties.listData])

    useEffect(() => {
        setDefaultActivate(properties.defaultActivate)
        setExposedVariable('clickIndex', properties.defaultActivate)
    }, [properties.defaultActivate])

    useEffect(() => {
        setHorizontal(properties.horizontal)
    }, [properties.horizontal])

    useEffect(() => {
        setShowIndex(properties.showIndex)
    }, [properties.showIndex])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    useEffect(() => {
        setItemStyle(styles.itemStyle)
        setBadgeStyle(styles.badgeStyle)
    }, [styles.itemStyle, styles.badgeStyle])

    // 处理点击事件
    const handleClick = (index) => {
        // 触发事件
        setExposedVariable('clickIndex', index)
        setDefaultActivate(index)
        fireEvent('onClick');
    }

    registerAction(
        'setIndex',
        async function (index) {
            setExposedVariable('clickIndex', index)
            setDefaultActivate(index)
        },
        []
    );


    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <div className='signatureContainer'
        >
            <ListGroup as="ol"
                numbered={showIndex}
                horizontal={horizontal}
            >
                {listData.map((item, index) =>
                (<ListGroup.Item
                    id={index + 1}
                    action
                    active={index + 1 === defaultActivate ? true : false}
                    as="li"
                    variant={itemStyle}
                    className="d-flex justify-content-between align-items-start"
                    onClick={() => handleClick(index + 1)}
                    disabled={item?.disabled ? true : false}
                >
                    <div className="ms-2 me-auto" >
                        <div className="fw-bold" >
                            {item?.title}
                        </div>
                        <div style={{ color: index + 1 === defaultActivate ? '#ddd' : 'grey' }}>
                            {item?.subTitle}
                        </div>
                    </div>
                    {item?.num && item?.num !== '0' ? (<Badge bg={badgeStyle} pill>
                        {item?.num}
                    </Badge>) : ''}
                </ListGroup.Item>)
                )
                }
            </ListGroup>
        </div>
    </div>)
}