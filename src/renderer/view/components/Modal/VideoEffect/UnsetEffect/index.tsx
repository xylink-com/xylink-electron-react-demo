import React from 'react';
import cn from 'classnames';
import { StopOutlined } from '@ant-design/icons';
import './index.scss';

export interface DefaultEffectProps extends React.HTMLAttributes<HTMLDivElement> {}

const UnsetEffect = (props: DefaultEffectProps) => {

    return (
        <div
            {...props}
            className={cn('video-effect-unset-item', props.className)}
        >
            <StopOutlined />
        </div>
    );
}

export default UnsetEffect;
