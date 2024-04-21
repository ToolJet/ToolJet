import React, { useState, useEffect, useRef } from 'react';
import { resolveReferences, resolveWidgetFieldValue, isJson } from '@/_helpers/utils';
import ReactAudioPlayer from "react-audio-player";
import _ from 'lodash';


export const AudioPlayer = function AudioPlayer({
    id,
    width,
    height,
    component,
    onComponentOptionChanged,
    onComponentOptionsChanged,
    setExposedVariable,
    onEvent,
    styles,
    properties,
    // canvasWidth,
    registerAction,
    dataCy,
}) {
    const { visibility } = styles;
    const { url, poster, muted, loop, autoPlay } = properties;
    // // 音频地址
    const [AudioURL, setAudioURL] = useState(url)
    const [PlayAutoPlay, setPlayAutoPlay] = useState(false)
    const [playerMuted, setMuted] = useState(muted)
    // const [playerPoster, setPlayerPoster] = useState(poster)

    // // 播放器引用
    var playerRef = useRef(null)
    useEffect(() => {
        setPlayAutoPlay(autoPlay);
        if (autoPlay) playerRef.audioEl.current.load()
    }, [autoPlay]);
    // 是否静音
    useEffect(() => {
        setMuted(muted);
    }, [muted]);

    useEffect(() => {
        // 响应音频地址更新
        setAudioURL(url);
        playerRef.audioEl.current.load()
    }, [url]);
    // 注册控制播放动作
    registerAction('setPlayerState', async function (state) {
        if (state)
            playerRef.audioEl.current.play()
        else
            playerRef.audioEl.current.pause()
    });
    // 设置音频地址
    registerAction('setURL', async function (URL) {
        setAudioURL(URL)
    });
    return (
        <div
            style={{ display: visibility ? '' : 'none' }}
        >
            <ReactAudioPlayer
                ref={(e) => { if (e) playerRef = e }}
                style={{ height, width: width - 5 }}
                controls
                src={AudioURL}
                autoPlay={PlayAutoPlay}
                muted={playerMuted}
                loop={loop}
                onPlay={() => {
                    onComponentOptionChanged(component, 'playerStatus', 'started').then(onEvent('onStart', { component }))
                }}
                onPause={() => {
                    onComponentOptionChanged(component, 'playerStatus', 'paused').then(onEvent('onPause', { component }))
                    // onEvent('onPause', { component })
                }}
                onEnded={() => {
                    onComponentOptionChanged(component, 'playerStatus', 'Ended').then(onEvent('onEnded', { component }))
                    // onEvent('onEnded', { component })
                }}
            >
            </ReactAudioPlayer>
        </div >
    )
}