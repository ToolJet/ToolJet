import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Descriptions, Button } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const Description = function Description({
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

    const [datas, setDatas] = useState(properties.datas);
    const [title, setTitle] = useState(properties.title);
    const [showEditButton, setShowEditButton] = useState(properties.showEditButton);
    // 样式
    const [bordered, setBordered] = useState(styles.bordered);
    const [rowHeight, setRowHeight] = useState(styles.rowHeight);
    const [layout, setLayout] = useState(styles.layout);
    const [column, setColumn] = useState(styles.column);
    const [parseEnter, setParseEnter] = useState(styles.parseEnter);

    useEffect(() => {
        if (Array.isArray(properties.datas)) {
            setDatas(properties.datas)
        } else {
            setDatas([])
        }
    }, [JSON.stringify(properties.datas)])
    useEffect(() => { setTitle(properties.title) }, [properties.title])
    useEffect(() => { setShowEditButton(properties.showEditButton) }, [properties.showEditButton])
    //样式处理
    useEffect(() => { setColumn(styles.column) }, [styles.column])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setBordered(styles.bordered)
        setRowHeight(styles.rowHeight)
        setLayout(styles.layout)
        setParseEnter(styles.parseEnter)
    }, [styles.visibility, styles.disabledState, styles.bordered, styles.rowHeight, styles.layout, styles.parseEnter])


    // 处理点击事件
    const handleClick = () => {
        // 触发事件
        fireEvent('onClick');
    }

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };


    return (
        <div
            data-disabled={disabledState}
            style={{
                width: width - 5,
                height,
                display: visibility ? '' : 'none',
                overflow: 'auto'
            }}>
            <ConfigProvider
                theme={darkMode ? darkTheme : {
                    token: {
                    }
                }}
            >
                <Descriptions
                    layout={layout}
                    title={title}
                    bordered={bordered}
                    size={rowHeight}
                    column={column}
                    extra={showEditButton ? <Button type="primary" onClick={handleClick}>编辑</Button> : ''}
                >
                    {
                        Array.isArray(datas) && datas.map(item => (
                            <Descriptions.Item label={item?.label || ''} span={item?.span || 1}>
                                {parseEnter ? (item?.value && item.value.split('\n').map((item, index) => (<>{index !== 0 ? <br /> : ''}{item}</>))) : item?.value || ''}
                            </Descriptions.Item>
                        ))
                    }
                </Descriptions>
            </ConfigProvider>
        </div>)
}