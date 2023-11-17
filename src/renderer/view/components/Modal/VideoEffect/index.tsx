import {
    Tabs,
    Space,
    Slider
} from 'antd';
import cn from 'classnames';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { VideoBeautyStyle, VideoFilterStyle, VirtualBgMode } from '@xylink/xy-electron-sdk';
import { debounce } from '@/utils';
import { callState, localVideoFlip, videoEffectTab } from '@/utils/state';
import { MeetingStatus } from '@/type/enum';
import store from '@/utils/videoEffectStore';
import { initVideoEffect } from '@/utils/initVideoEffect';
import { IVideoEffectTabPaneType } from '@/enum';
import LocalVideo from '../../LocalVideo';
import VirtualBg from './VirtualBg';
import VideoBeauty from './Beauty';
import VideoFilter from './Filter';

import xyRTC from '@/utils/xyRTC';

import './index.scss';

const { TabPane } = Tabs;
const { BEAUTY, VIRTUAL_BG, FILTER } = IVideoEffectTabPaneType;

const VideoEffect = () => {
    const callStatus = useRecoilValue(callState);
    const videoFlip = useRecoilValue(localVideoFlip);

    const [level, setLevel] = useState(0);
    const [showLevelSilder, setShowLevelSilder] = useState(false);
    const [selectedTab, setSelectedTab] = useRecoilState(videoEffectTab);

    const isMouseDownRef = useRef(false);
    const prevSwitchLevelRef = useRef(-1);
    const virtualBgFilePathRef = useRef({ mode: VirtualBgMode.NONE, filePath: "" });

    useEffect(() => {
        initVideoEffect.init();
        return () => {  // 组件卸载的时候重新 save，保存配置到 electron-store 中
            store.save();
        }
    }, []);

    const currentLevel = useMemo(() => {
        if (selectedTab === BEAUTY) {
            return store.getBeautyConfig();
        }

        if (selectedTab === FILTER) {
            return store.getFilterConfig();
        }

        return { style: 0, level: 0 };
    }, [selectedTab]);

    useEffect(() => {
        const { style, level } = currentLevel;
        setLevel(level);
        setShowLevelSilder(!!style && selectedTab !== VIRTUAL_BG);
    }, [currentLevel]);

    // 更新视频效果
    const updateEffect = useCallback(debounce((level: number) => {
        if (selectedTab === BEAUTY) {
            const { style } = store.updateBeautyLevel(level);
            xyRTC.setVideoBeautyEffect(style, level);
        }
        
        else if (selectedTab === FILTER) {
            const { style } = store.updateFilterLevel(level);
            xyRTC.setVideoFilterEffect(style, level);
        }
    }, 33, 66), [selectedTab]);

    const switchToNoEffect = () => {
        isMouseDownRef.current = true;
        if (selectedTab === VIRTUAL_BG) {
            xyRTC.setVirtualBgMode(VirtualBgMode.NONE);
        }

        if (prevSwitchLevelRef.current !== 0) {
            updateEffect(0);
            prevSwitchLevelRef.current = 0;
        }
    }

    useEffect(() => {
        const switchToCurrentEffect = () => {
            if (!isMouseDownRef.current)    return;
            
            if (selectedTab === VIRTUAL_BG) {
                const { mode, filePath } = virtualBgFilePathRef.current;
                xyRTC.setVirtualBgMode(mode);
                filePath && xyRTC.setVirtualBgImage(filePath);
            }

            if (prevSwitchLevelRef.current !== level && prevSwitchLevelRef.current >= 0) {
                updateEffect(level);
                prevSwitchLevelRef.current = level;
            }

            isMouseDownRef.current = false;
        }

        document.addEventListener('mouseup', switchToCurrentEffect);
        return () => {
            document.removeEventListener('mouseup', switchToCurrentEffect);
        }
    }, [level, selectedTab, updateEffect]);

    return (
        <Space size={0} direction="vertical" className='video-effect-container'>
            {/* 本地视频预览 */}
            <div className='video-view'>
                <LocalVideo
                    width={434}
                    height={244}
                    className={cn(videoFlip && 'xy-video-flip')}
                    stopCameraWhenDestroy={callStatus !== MeetingStatus.MEETING}
                />
                {   // 美颜、滤镜 效果设置范围
                    showLevelSilder && (
                        <div className='video-effect-level'>
                            <Slider
                                value={level}
                                style={{ width: 236 }}
                                onChange={(value: number) => {
                                    setLevel(value);
                                    updateEffect(value);
                                }}
                            />
                            <div
                                onMouseDown={switchToNoEffect}
                                className={cn(
                                    'video-effect-contrast-btn',
                                    level === 0 && 'video-effect-contrast-btn-disabled'
                                )}
                            ></div>
                        </div>
                    )
                }
            </div>

            <Tabs activeKey={selectedTab} onChange={(key) => {
                setSelectedTab(key as IVideoEffectTabPaneType);
            }}>
                <TabPane key={VIRTUAL_BG} tab="虚拟背景">
                    <VirtualBg onChange={(mode, filePath = '') => {
                        virtualBgFilePathRef.current = { mode, filePath };
                    }} />
                </TabPane>

                <TabPane key={BEAUTY} tab="美颜">
                    <VideoBeauty onChange={(style, level) => {
                        const isNoneStyle = style === VideoBeautyStyle.NONE;
                        setShowLevelSilder(!isNoneStyle);
                        setLevel(isNoneStyle ? 0 : level);
                    }} />
                </TabPane>

                <TabPane key={FILTER} tab="滤镜">
                    <VideoFilter onChange={(style, level) => {
                        const isNoneStyle = style === VideoFilterStyle.NONE;
                        setShowLevelSilder(!isNoneStyle);
                        setLevel(isNoneStyle ? 0 : level);
                    }} />
                </TabPane>
            </Tabs>
        </Space>
    );
}

export default VideoEffect;
