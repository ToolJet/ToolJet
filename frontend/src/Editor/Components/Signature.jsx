import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export const Signature = function Signature({
    id,
    width,
    height,
    component,
    darkMode,
    // currentState,
    // onComponentOptionChanged,
    onComponentOptionsChanged,
    // onEvent,
    // canvasWidth,
    // registerAction,
    properties,
    styles,
    fireEvent,
}) {
    var sigRef = useRef()
    const [isBegin, setIsBegin] = useState(false);
    const [tipText, setTipText] = useState(properties.tipText);
    const [showUndo, setShowUndo] = useState(properties.showUndo);
    const [showClean, setShowClean] = useState(properties.showClean);
    const [penColor, setPenColor] = useState(properties.penColor);
    const [visibility, setVisibility] = useState(styles.visibility);
    const [disabledState, setDisabledState] = useState(styles.disabledState);

    useEffect(() => {
        setTipText(properties.tipText)
    }, [properties.tipText])
    useEffect(() => {
        setShowUndo(properties.showUndo)
    }, [properties.showUndo])
    useEffect(() => {
        setShowClean(properties.showClean)
    }, [properties.showClean])
    useEffect(() => {
        setPenColor(properties.penColor)
    }, [properties.penColor])
    useEffect(() => {
        setVisibility(styles.visibility)
    }, [styles.visibility])
    useEffect(() => {
        setDisabledState(styles.disabledState)
    }, [styles.disabledState])

    // 清除动作
    const clear = () => {
        // 清除画布
        sigRef.clear()
        // 显示提示
        setIsBegin(false)
        onComponentOptionsChanged(component, [['signatureData', sigRef.toDataURL('image/png')], ['trimedSignatureData', sigRef.getTrimmedCanvas().toDataURL('image/png')], ['isEmpty', sigRef.isEmpty()]])
        fireEvent('onChange');
    }
    // 撤销动作
    const undo = () => {
        // 获取签名笔画数据
        const data = sigRef?.toData();
        if (data) {
            data.pop()
            sigRef.fromData(data)
            onComponentOptionsChanged(component, [['signatureData', sigRef.toDataURL('image/png')], ['trimedSignatureData', sigRef.getTrimmedCanvas().toDataURL('image/png')], ['isEmpty', sigRef.isEmpty()]])
            fireEvent('onChange');
        }
        // 显示提示
        if (data.length == 0) setIsBegin(false)
    }
    const onEnd = () => {
        onComponentOptionsChanged(component, [['signatureData', sigRef.toDataURL('image/png')], ['trimedSignatureData', sigRef.getTrimmedCanvas().toDataURL('image/png')], ['isEmpty', sigRef.isEmpty()]])
        fireEvent('onChange');
    }
    // 
    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <div className='signatureContainer' style={{ border: '1px solid rgb(184, 185, 191)', borderRadius: '5px', 'background-color': darkMode ? '#2b3546' : '#fff' }}>
            {(!isBegin) && <div className='singnatureTip'>{tipText}</div>}
            <SignatureCanvas
                penColor={penColor}
                clearOnResize={false}
                canvasProps={{ width: width - 5, height }}
                ref={r => { sigRef = r }}
                onBegin={() => setIsBegin(true)}
                onEnd={onEnd}
            >
            </SignatureCanvas>

        </div>
        {/* 撤销与清除 */}
        <div style={{ position: 'absolute', bottom: '16px', 'right': '0px', 'padding-right': '16px' }}>
            {showUndo && (<span onClick={undo} title="重写上一笔" role="img" aria-label="delete" tabindex="-1" >
                <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="rgb(184, 185, 191)" aria-hidden="true">
                    <path d="M70.494 316.086c-3.484 3.173-3.484 8.656 0 11.829l193.119 175.883c5.137 4.679 13.387 1.034 13.387-5.915V368h395c114.875 0 208 93.125 208 208 0 114.876-93.125 208-208 208H256v80h416c159.058 0 288-128.942 288-288S831.058 288 672 288H277V146.117c0-6.948-8.25-10.593-13.387-5.914L70.494 316.086z" >
                    </path>
                </svg>
            </span>)}
            {showClean && (<span onClick={clear} title="全部重写" role="img" aria-label="delete" tabindex="-1" style={{ 'padding-left': '16px' }}>
                <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="rgb(184, 185, 191)" aria-hidden="true">
                    <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z">
                    </path>
                </svg>
            </span>)}
        </div>
    </div>)
}