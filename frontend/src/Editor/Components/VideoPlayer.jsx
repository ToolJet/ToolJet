import React, { useState, useEffect, useRef } from 'react';
import { resolveReferences, resolveWidgetFieldValue, isJson } from '@/_helpers/utils';
import "video-react/dist/video-react.css";
import { Player, ControlBar, BigPlayButton } from 'video-react';
import _ from 'lodash';


export const VideoPlayer = function VideoPlayer({
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
    const { url, poster, muted, loop, autoHide, autoPlay } = properties;
    // 视频地址
    const [videoURL, setVideoURL] = useState(url)
    const [PlayAutoPlay, setPlayAutoPlay] = useState(autoPlay)
    const [playerMuted, setMuted] = useState(muted)
    const [playerPoster, setPlayerPoster] = useState(poster)

    // 播放器引用
    const playerRef = useRef(null)

    // url修改后动作
    useEffect(() => {
        // 设置订阅函数
        playerRef.current.subscribeToStateChange(handleStateChange)
        setVideoURL(url);
        playerRef.current.load()
    }, [url]);
    // 订阅状态更新
    const handleStateChange = (state, prevState) => {
        if (prevState.readyState === 0 && state.readyState === 1) {
            // 视频载入完成
        }
        onComponentOptionsChanged(component, [['currentSrc', state.currentSrc], ['duration', state.duration], ['paused', state.paused], ['volume', state.volume], ['readyState', state.readyState]])
        if (state.ended && state.ended != prevState.ended) {
            // 视频结束事件
            onEvent('onEnded', { component })
        } else if (state.paused != prevState.paused) {
            if (state.paused) {
                // 暂停事件
                onEvent('onPause', { component })
            } else {
                // 播放事件
                onEvent('onStart', { component })
            }
        }
    };
    // 注册控制播放动作
    registerAction('setPlayerState', async function (state) {
        if (state)
            playerRef.current.play()
        else
            playerRef.current.pause()
    });
    // 设置视频地址
    registerAction('setURL', async function (URL) {
        setVideoURL(URL)
        playerRef.current.load()
    });
    // 注册切换全屏动作
    registerAction(
        'toggleFullscreen',
        async function () {
            playerRef.current.toggleFullscreen()
        }
    );

    return (
        <div
            style={{ display: visibility ? '' : 'none' }}
        >
            <Player
                preload={'metadata'}
                ref={playerRef}
                fluid={false}
                width={width - 5}
                height={height}
                // 自动播放
                autoPlay={PlayAutoPlay}
                // 静音,自动播放必须静音，否则无法自动播放
                muted={PlayAutoPlay ? true : playerMuted}
                // 循环
                loop={loop}
                // 海报
                poster={playerPoster}
            >
                <source src={videoURL} />

                <ControlBar autoHide={autoHide} autoHideTime={1500} className="my-class" />
                <BigPlayButton position="center" />

            </Player>
        </div >
    )
}