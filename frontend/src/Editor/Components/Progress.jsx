import React, { useState, useEffect, useRef } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';


export const Progress = function Progress({
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
    var inputRef = useRef(null)
    const [progress, setProgress] = useState(properties.progress);
    const [showLable, setShowLable] = useState(properties.showLable);
    const [visibility, setVisibility] = useState(styles.visibility);
    const [color, setColor] = useState(styles.color);
    const [striped, setStriped] = useState(styles.striped);
    const [animated, setAnimated] = useState(styles.animated);
    const [disabledState, setDisabledState] = useState(styles.disabledState);
    const [backgroundColor, setBackgroundColor] = useState(styles.backgroundColor);
    const [enterAnimated, setEnterAnimated] = useState(styles.enterAnimated);

    useEffect(() => {
        setProgress(properties.progress)
        setExposedVariable('progress', properties.progress)
    }, [properties.progress])
    useEffect(() => {
        setShowLable(properties.showLable)
    }, [properties.showLable])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setStriped(styles.striped)
        setAnimated(styles.animated)
        setBackgroundColor(styles.backgroundColor)
        setEnterAnimated(styles.enterAnimated)
    }, [styles.visibility, styles.disabledState, styles.striped, styles.animated, styles.enterAnimated, styles.backgroundColor])
    useEffect(() => {
        setColor(styles.color)
    }, [styles.color])

    // 注册自定义事件
    registerAction(
        'setPrograss',
        async function (num) {
            setProgress(parseInt(num))
            setExposedVariable('progress', parseInt(num))
        },
        [progress]
    );


    return (<div
        data-disabled={disabledState}
        onMouseOver={() => { if (enterAnimated) setAnimated(true) }}
        onMouseLeave={() => { if (enterAnimated) setAnimated(styles.animated) }}
        style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ProgressBar
            now={progress}
            label={`${progress}%`}
            visuallyHidden={!showLable}
            variant={color}
            striped={striped}
            animated={animated}
            style={{ width: width - 5, height, backgroundColor: backgroundColor }}
        />
    </div>)
}