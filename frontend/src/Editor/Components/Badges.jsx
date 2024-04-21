import React, { useState, useEffect, useRef } from 'react';
import Badge from 'react-bootstrap/Badge';


export const Badges = function Badges({
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
    const [title, setBadge] = useState('');
    const [texts, setTexts] = useState('');
    const [handleClick, setHandleClick] = useState(properties.handleClick);
    const [badgeBackgroundColor, setBadgeBackgroundColor] = useState(styles.badgeBackgroundColor);
    const [badgeSize, setBadgeSize] = useState(styles.badgeSize);
    const [textSize, setTextSize] = useState(styles.textSize);
    const [pill, setPill] = useState(styles.pill);
    const [badgeFontColor, setBadgeFontColor] = useState(styles.badgeFontColor);
    const [visibility, setVisibility] = useState(styles.visibility);
    const [alignType, setAlignType] = useState(styles.alignType);

    useEffect(() => {
        setBadge(properties.title)
        setExposedVariable('Badges', properties.title)
    }, [properties.title])

    useEffect(() => {
        setTexts(properties.texts)
        setExposedVariable('texts', properties.texts)
    }, [properties.texts])

    useEffect(() => {
        setHandleClick(properties.handleClick)
    }, [properties.handleClick])

    useEffect(() => {
        setBadgeSize(styles.badgeSize)
        setBadgeBackgroundColor(styles.badgeBackgroundColor)
        setPill(styles.pill)
        setBadgeFontColor(styles.badgeFontColor)
        setVisibility(styles.visibility)
        setAlignType(styles.alignType)
        setTextSize(styles.textSize)
    }, [
        styles.badgeSize,
        styles.badgeBackgroundColor,
        styles.pill,
        styles.badgeFontColor,
        styles.visibility,
        styles.alignType,
        styles.textSize])

    function RenderBadge() {
        if (title !== '')
            return (<Badge className='badges' bg={badgeBackgroundColor} text={badgeFontColor} pill={pill}>{title}</Badge>)
    }

    function RenderBadgeText() {

        if (badgeSize === '1') return (<div><h1><RenderBadge></RenderBadge></h1></div>)
        else if (badgeSize === '2') return (<div><h2><RenderBadge></RenderBadge></h2></div>)
        else if (badgeSize === '3') return (<div><h3><RenderBadge></RenderBadge></h3></div>)
        else if (badgeSize === '4') return (<div><h4><RenderBadge></RenderBadge></h4></div>)
        else if (badgeSize === '5') return (<div><h5><RenderBadge></RenderBadge></h5></div>)
        else if (badgeSize === '6') return (<div><h6><RenderBadge></RenderBadge></h6></div>)
    }
 
    function RenderText() {
        if (textSize === '1') return (<><h1>{texts}</h1><RenderBadgeText></RenderBadgeText></>)
        else if (textSize === '2') return (<><h2>{texts}</h2><RenderBadgeText></RenderBadgeText></>)
        else if (textSize === '3') return (<><h3>{texts}</h3><RenderBadgeText></RenderBadgeText></>)
        else if (textSize === '4') return (<><h4>{texts}</h4><RenderBadgeText></RenderBadgeText></>)
        else if (textSize === '5') return (<><h5>{texts}</h5><RenderBadgeText></RenderBadgeText></>)
        else if (textSize === '6') return (<><h6>{texts}</h6><RenderBadgeText></RenderBadgeText></>)
    }
    // 处理点击事件
    const handleClickFun = () => {
        if (handleClick)
            fireEvent('onClick')
    }
    // 设置文本
    registerAction(
        'setText',
        async function (texts) {
            setTexts(texts);
            setExposedVariable('texts', texts)
        },
        [setTexts]
    );
    // 设置角标
    registerAction(
        'setBadge',
        async function (Badge) {
            setBadge(Badge);
            setExposedVariable('Badges', Badge)
        },
        [setBadge]
    );

    return (<div
        onClick={handleClickFun}
        style={{
            width: width - 5,
            height,
            display: visibility ? 'flex' : 'none',
            'align-items': alignType,
            'white-space': 'nowrap',
            cursor: handleClick ? 'pointer' : '',
        }}>
        <RenderText></RenderText>
    </div>)
}