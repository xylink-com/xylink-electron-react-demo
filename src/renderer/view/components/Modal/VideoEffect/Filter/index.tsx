import cn from 'classnames';
import { useState } from 'react';
import { VideoFilterStyle } from '@xylink/xy-electron-sdk';
import xyRTC from '@/utils/xyRTC';
import store from '@/utils/videoEffectStore';
import { effectList } from './config';

import './index.scss';
export interface VideoFilterProps {
    onChange?: (style: VideoFilterStyle, level: number) => void;
}

const VideoFilter = (props: VideoFilterProps) => {
    const { onChange } = props;
    const [{ style }, setSelected] = useState(store.selectedFilter);

    const handleSelect = (value: VideoFilterStyle) => {
        const { level } = store.getFilterConfig(value);

        store.updateSelectedFilter(value);
        setSelected({ style: value });
        // 获取当前的 level
        onChange?.(value, level);
        store.save();
        // 下发更新视频效果
        xyRTC.setVideoFilterEffect(value, level);
    }

    return (
        <div className='video-filter-wrapper'>
            {
                effectList.map(effect => {
                    const { img, label, value } = effect;
                    const checked = style === value;

                    return (
                        <div
                            key={value}
                            onClick={() => handleSelect(value)}
                            className={cn('video-filter-item', checked && 'selected-item')}
                        >
                            <div className='video-filter-item-inner'>
                                {
                                    typeof img === 'string' ? (
                                        <img src={img} alt={label} />
                                    ) : img
                                }
                            </div>
                            <div className='video-filter-item-label'>{label}</div>
                        </div>
                    )
                })
            }
        </div>
    );
}

export default VideoFilter;
