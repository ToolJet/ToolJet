import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Image } from 'antd';
// 导入本地中文配置
import zhCN from 'antd/locale/zh_CN';

export const Images = function Images({
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
    const [src, setSrc] = useState(properties.src);
    const [fallback, setFallback] = useState(properties.fallback);
    const [preview, setPreview] = useState(properties.preview);
    const [PreviewGroupVisible, setPreviewGroupVisible] = useState(false);

    useEffect(() => {
        if (Array.isArray(properties.src)) {
            setSrc(properties.src)
        } else {
            setSrc([])
        }
    }, [properties.src])
    useEffect(() => { setFallback(properties.fallback) }, [properties.fallback])
    useEffect(() => { setPreview(properties.preview) }, [properties.preview])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
            <ConfigProvider
                locale={zhCN}
            >
                <Image
                    preview={{
                        visible: false,
                    }}
                    width={width - 5}
                    height={height}
                    src={preview !== '' ? preview : src[0]}
                    fallback={fallback}
                    onClick={() => {
                        setPreviewGroupVisible(true)
                        fireEvent('onClick')
                    }}
                />
                <div
                    style={{
                        display: 'none',
                    }}
                >
                    <Image.PreviewGroup
                        preview={{
                            visible: PreviewGroupVisible,
                            onVisibleChange: (vis) => setPreviewGroupVisible(vis),
                        }}
                    >
                        {
                            src.map((item) =>
                                <Image src={item} />
                            )
                        }
                    </Image.PreviewGroup>
                </div>
            </ConfigProvider>
    </div>)
}