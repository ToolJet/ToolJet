import React, { useState, useEffect, useRef, useMemo } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Avatar, List, Input, Button, Space, Mentions, Tooltip } from 'antd';
import { resolveReferences } from '@/_helpers/utils';
const { darkAlgorithm, compactAlgorithm } = theme;
import VirtualList from 'rc-virtual-list';
import _ from 'lodash';
import relativeTime from 'dayjs/plugin/relativeTime';
// 导入本地中文配置
// import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn')


export const Comment = function Comment({
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
    const VirtualListRef = useRef(null)
    const [visibility, setVisibility] = useState(styles.visibility);
    const [disabledState, setDisabledState] = useState(styles.disabledState);
    const [datas, setDatas] = useState(properties.datas);
    const [commentList, setCommentList] = useState([]);
    const [label, setLabel] = useState(properties.label);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [MentionList, setMentionList] = useState({});
    const [prefix, setPrefix] = useState('@');
    const [submitButton, setSubmitButton] = useState(properties.submitButton);
    const [context, setContext] = useState('')
    const [userInfo, setUserInfo] = useState({})
    const [sendComment, setSendComment] = useState();

    // 头像背景色列表   
    const [colorList, setColorList] = useState(resolveReferences(styles.colorList, currentState) || ['grey']);
    // 样式
    const [bhColor, setBhColor] = useState(styles.bhColor);
    const [borderRadius, setBorderRadius] = useState(styles.borderRadius);

    useEffect(() => {
        setCommentList(datas)
        setExposedVariable('commentList', datas)
    }, [datas])

    useEffect(() => {
        if (Array.isArray(properties.datas)) {
            setCommentList(properties.datas)
        } else {
            setCommentList([])
        }
    }, [JSON.stringify(properties.datas)])

    const getColorMap = useMemo(() => {
        setExposedVariable('commentList', commentList)
        let namesTempList = []
        namesTempList = _.union(_.map(commentList, (item, index) => {
            return item?.user?.name
        }))
        let ranges = _.range(0, namesTempList.length)
        return _.zipObject(namesTempList, ranges) || {}
    }, [commentList])

    useEffect(() => {
        if (resolveReferences(properties.MentionList, currentState) instanceof Object) {
            let tempList = resolveReferences(properties.MentionList, currentState)
            if (tempList['@']) {
                tempList['@'] = _.union(_.concat(tempList['@'], Object.keys(getColorMap)))
            } else {
                tempList['@'] = Object.keys(getColorMap)
            }
            setMentionList(tempList)
        }
        else
            setMentionList({ '@': Object.keys(getColorMap) })
    }, [JSON.stringify(properties.MentionList), commentList])

    useEffect(() => {
        setUserInfo(properties.userInfo)
        setExposedVariable('userInfo', properties.userInfo)
    }, [JSON.stringify(properties.userInfo)])
    useEffect(() => { setLabel(properties.label) }, [properties.label])
    useEffect(() => { setSubmitButton(properties.submitButton) }, [properties.submitButton])
    useEffect(() => { setPlaceholder(properties.placeholder) }, [properties.placeholder])
    useEffect(() => {
        setSendComment(properties.sendComment)
    }, [properties.sendComment])
    //样式处理
    useEffect(() => { setColorList(styles.colorList) }, [styles.colorList])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => { setBhColor(styles.bhColor) }, [styles.bhColor])
    useEffect(() => { setBorderRadius(styles.borderRadius) }, [styles.borderRadius])

    useEffect(() => {
        setTimeout(() => {
            VirtualListRef.current.scrollTo(99999)
        }, 100);
    }, [VirtualListRef])

    // 处理点击事件
    const handleClick = (e, item) => {
        // 触发事件
        setExposedVariable('ClickedPosition', e)
        setExposedVariable('ClickedItem', item)
        fireEvent('onClick');
    }

    const onSearch = (_, newPrefix) => {
        setPrefix(newPrefix);
        fireEvent('onSelect');
    };
    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    const handleSubmit = () => {
        let subObject = { user: userInfo, value: context, createdAt: dayjs().format() }
        setCommentList(_.concat(commentList, [subObject]))
        fireEvent('onCheck')
        setContext('')
        setExposedVariable('submitComment', subObject)
        setExposedVariable('commentList', subObject)
        setExposedVariable('userInfo', userInfo)
        setTimeout(() => {
            VirtualListRef.current.scrollTo(99999)
        }, 100);
    }
    const onChange = (value) => {
        setExposedVariable('comment', value)
        setContext(value)
        fireEvent('onChange')
    };

    const onSelect = (option) => {
        setExposedVariable('mentionName', option.value)
        fireEvent('onFocus')
    };

    const commentAvatar = (item) => {
        return (<Avatar
            onClick={() => handleClick('avatar', item)}
            style={{
                backgroundColor: item?.user?.avatar ? '' : colorList[getColorMap[item?.user?.name] % colorList.length],
                verticalAlign: 'middle',
            }}
            src={item?.user?.avatar}
        > {item?.user?.displayName ? item?.user?.displayName : /^([\u4e00-\u9fa5]{2,4})$/gi.test(item?.user?.name) ? item?.user?.name.slice(-2) : item?.user?.name[0]}</Avatar>)
    }
    const onPressEnter = (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            handleSubmit()
        }
    }

    return (<div
        data-disabled={disabledState}
        style={{
            width: width - 5,
            height: height,
            display: visibility ? '' : 'none',
            border: '1px solid rgba(140, 140, 140, 0.35)',
            backgroundColor: bhColor,
            borderRadius,
        }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
        >
            <Space
                direction="vertical"
                size="small"
            >
                <List
                    header={label !== '' ? (<div
                        style={{ height: 15 }}>{label.replaceAll('%d', commentList.length)}
                    </div>) : ''}
                    style={{
                        cursor: 'pointer',
                        width: width - 5,
                    }}
                    size='small'
                >
                    <VirtualList
                        data={commentList}
                        height={height - (sendComment ? 145 : 45) + (label === '' ? 40 : 0)}
                        itemKey="user.name"
                        ref={VirtualListRef}
                    >
                        {(item) => (
                            <List.Item key={item?.user?.name}>
                                <List.Item.Meta
                                    avatar={commentAvatar(item)}
                                    title={(<div onClick={() => handleClick('title', item)}><a >{item?.user?.name}</a>
                                        <Tooltip
                                            title={dayjs(item?.createdAt).isValid() ? dayjs(item?.createdAt).format('YYYY年M月D日 HH:mm:ss') : '日期错误'}
                                            placement='bottom'
                                        >
                                            <span
                                                style={{
                                                    paddingLeft: '5px',
                                                    color: '#999',
                                                    'font-size': '11px',
                                                }}
                                            >
                                                {dayjs(item?.createdAt).isValid() ? dayjs(item?.createdAt).fromNow() : '日期错误'}
                                            </span>
                                        </Tooltip>
                                    </div>)}
                                    description={<span onClick={() => handleClick('content', item)}>{item?.value}</span>}
                                />
                            </List.Item>
                        )}
                    </VirtualList>
                </List>
                {sendComment ? (
                    <>
                        <Mentions
                            style={{
                                width: width - 20,
                                height: 50,
                                margin: '0px 10px 0px 5px',
                            }}
                            prefix={Object.keys(MentionList)}
                            onChange={onChange}
                            onSelect={onSelect}
                            value={context}
                            rows={2}
                            onSearch={onSearch}
                            onPressEnter={onPressEnter}
                            placeholder={placeholder}
                            options={(MentionList[prefix] || []).map((value) => ({
                                key: value,
                                value,
                                label: value,
                            }))}
                        />
                        <Button
                            type="primary"
                            style={{
                                width: width - 20,
                                margin: '0px 10px 0px 5px',
                            }}
                            onClick={handleSubmit}
                            disabled={context === ''}
                        >{submitButton}</Button>
                    </>) : ''}
            </Space>
        </ConfigProvider >
    </div >)
}