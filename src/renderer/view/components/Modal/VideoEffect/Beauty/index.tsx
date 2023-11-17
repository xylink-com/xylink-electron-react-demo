import cn from 'classnames';
import { useState } from 'react';
import xyRTC from '@/utils/xyRTC';
import UnsetEffect from '../UnsetEffect';
import store from '@/utils/videoEffectStore';
import { VideoBeautyStyle } from '@xylink/xy-electron-sdk';
import { effectList } from './config';

import './index.scss';

const { NONE } = VideoBeautyStyle;

export interface VideoBeautyProps {
    onChange?: (style: VideoBeautyStyle, level: number) => void;
}

const VideoBeauty = (props: VideoBeautyProps) => {
    const { onChange } = props;
    const [{ style }, setSelected] = useState(store.selectedBeauty);

    const handleSelect = (value: VideoBeautyStyle) => {
        store.updateSelectedBeauty(value);
        setSelected({ style: value });
        // 获取当前的 level
        const { level } = store.getBeautyConfig(value);
        onChange?.(value, level);
        store.save();       // 重新保存数据
        // 下发更新视频效果
        xyRTC.setVideoBeautyEffect(value, level);
    }

    return (
        <div className='video-beauty-wrapper'>
            <div
                onClick={() => handleSelect(NONE)}
                className={cn('video-beauty-item', style === NONE && 'selected-item')}
            >
                <div  className='video-beauty-item-inner'>
                    <UnsetEffect />
                </div>
                <div className='video-beauty-item-label'>无</div>
            </div>

            {
                effectList.map(effect => {
                    const { label, value, img, activeImg } = effect;
                    const checked = style === value;

                    return (
                        <div
                            key={value}
                            onClick={() => handleSelect(value)}
                            className={cn('video-beauty-item', checked && 'selected-item')}
                        >
                            <div  className='video-beauty-item-inner'>
                                <div>
                                    <img src={checked ? activeImg : img} alt={label} />
                                </div>
                            </div>
                            <div className='video-beauty-item-label'>{label}</div>
                        </div>
                    );
                })
            }
        </div>
    );
}

export default VideoBeauty;
