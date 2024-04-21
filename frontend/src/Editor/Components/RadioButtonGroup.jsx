import React, { useState, useEffect, useRef } from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';


export const RadioButtonGroup = function RadioButtonGroup({
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

    const [radios, setRadios] = useState(properties.radios);
    const [radioValue, setRadioValue] = useState();

    useEffect(() => {
        setRadios(properties.radios)
    }, [properties.radios])
    
    useEffect(() => {
        setRadioValue(properties.radioValue)
        const defaultCurrentItem = radios.filter(x => {
            return x.value === properties.radioValue
        })
        setExposedVariable('currentValue', defaultCurrentItem[0]?.value)
        setExposedVariable('currentName', defaultCurrentItem[0]?.name)
    }, [properties.radioValue])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])


    // 注册自定义事件
    registerAction(
        'setIndex',
        async function (index) {
            const defaultCurrentItem = radios.filter(x => {
                return x.value === index
            })
            setExposedVariable('currentValue', defaultCurrentItem[0]?.value)
            setExposedVariable('currentName', defaultCurrentItem[0]?.name)
            setRadioValue(index)
        },
        []
    );



    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <div
        >
            <ButtonGroup className="mb-2">
                {radios.map((radio, idx) => (
                    <ToggleButton
                        key={idx}
                        id={`radio-${idx}`}
                        type="radio"
                        variant={radioValue === radio.value ? 'primary' : 'light'}
                        name="radio"
                        value={radio.value}
                        checked={radioValue === radio.value}
                        onChange={(e) => {
                            setExposedVariable('currentValue', e.currentTarget.value)
                            setExposedVariable('currentName', radio.name)
                            setRadioValue(e.currentTarget.value)
                            fireEvent('onSelect')
                        }}
                        style={{ width: width / radios.length, height }}
                    >
                        {radio.name}
                    </ToggleButton>
                ))}
            </ButtonGroup>
        </div>
    </div>)
}