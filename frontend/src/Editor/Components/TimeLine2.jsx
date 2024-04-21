import React, { useState, useEffect } from 'react';
import { theme, ConfigProvider, Timeline } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
import * as Icons from '@ant-design/icons';

export const TimeLine2 = function TimeLine2({
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

    const [items, setItems] = useState();
    const [mode, setMode] = useState(properties.mode);
    const [reverse, setReverse] = useState(properties.reverse);
    const [pending, setPending] = useState(properties.pending);

    // 样式
    const [color, setColor] = useState(styles.color);
    const [bgcolor, setbgColor] = useState(styles.bgcolor);
    const [titleColor, setTitleColor] = useState(styles.titleColor);
    const [subTitleColor, setSubTitleColor] = useState(styles.subTitleColor);
    const [borderRadius, setBorderRadius] = useState(styles.borderRadius);

    useEffect(() => {
        if (Array.isArray(properties.items)) {
            const tempItems = properties.items.map((x, index) => {
                x['children'] = (
                    <div>
                        <a href='' onClick={(e) => handleClick(e, x, index)} style={{ cursor: 'pointer', color: x.titleColor || titleColor }}><b>{x.title}</b></a>
                        <p
                            style={{ color: x.subTitleColor || subTitleColor }}
                        >
                            {x.subTitle}
                        </p>
                    </div>)
                if (x.dot && Icons[x.dot]) {
                    if (x.fontSize) {
                        return {
                            ...x,
                            dot: React.createElement(Icons[x.dot], {
                                style: {
                                    fontSize: x.fontSize,
                                }
                            }),
                        }
                    } else {
                        return {
                            ...x,
                            dot: React.createElement(Icons[x.dot]),
                        }
                    }
                }
                return x
            })
            setItems(tempItems)
        } else {
            setItems([])
        }
        setExposedVariable('clickedItem', {})
        setExposedVariable('clickedIndex', -1)
    }, [JSON.stringify(properties.items)])

    useEffect(() => { setMode(properties.mode) }, [properties.mode])
    useEffect(() => { setReverse(properties.reverse) }, [properties.reverse])
    useEffect(() => { setPending(properties.pending) }, [properties.pending])
    //样式处理
    useEffect(() => { setColor(styles.color) }, [styles.color])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setbgColor(styles.bgcolor)
        setSubTitleColor(styles.subTitleColor)
        setTitleColor(styles.titleColor)
    }, [styles.visibility, styles.disabledState, styles.bgcolor, styles.titleColor, styles.subTitleColor])
    useEffect(() => { setBorderRadius(styles.borderRadius) }, [styles.borderRadius])


    // 处理点击事件
    const handleClick = (e, item, index) => {
        // 触发事件
        e.preventDefault();
        setExposedVariable('clickedItem', item)
        setExposedVariable('clickedIndex', index)
        fireEvent('onClick');
    }

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
        token: {
            colorBgContainer: '#ffffff00',
        }
    };

    return (
        <div data-disabled={disabledState}
            style={{
                width: width - 5,
                height,
                display: visibility ? '' : 'none',
                overflow: 'auto',
                overflowX: 'hidden',
                padding: '20px',
                border: `1px solid ${color}`,
                borderRadius: `${borderRadius}px`,
                backgroundColor: darkMode ? '#232e3c' : bgcolor,
            }}>

            <ConfigProvider
                theme={darkMode ? darkTheme : {
                    token: {
                        colorBgContainer: '#ffffff00',
                    }
                }}
            >
                <Timeline
                    items={items}
                    mode={mode}
                    pending={pending}
                    reverse={reverse}
                >
                </Timeline>
            </ConfigProvider>
        </div>
    )
}