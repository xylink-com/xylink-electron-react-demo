import { useEffect, useRef } from 'react';
import { Render } from '@xylink/xy-electron-sdk';
import xyRTCInstance from '@/utils/xyRTC';
import { LOCAL_VIEW_ID } from '@/enum';
import { xy } from '@/utils/interval';

/**
 * LocalVideo Props
 * 
 * @property className canvas className
 * @property width canvas 宽度
 * @property height canvas 高度
 * @property stopCameraWhenDestroy 组件卸载时是否把摄像头关掉，默认：true，
 *        当在会中时如果开启了摄像头，组件卸载时就不需要关闭了，反之则需要关闭
 * @property ratio 视频宽高比，默认：16：9
 */
interface ILocalVideoProps {
    className?: string;
    stopCameraWhenDestroy?: boolean;
    height?: number;
    width?: number;
    ratio?: number;
}

const LocalVideo = (props: ILocalVideoProps) => {
    const { className, height = 180, width = 320, ratio = 16/9, stopCameraWhenDestroy = true } = props;
    const timer = useRef('local-preview');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const w = width || height * ratio;
        const h = w / ratio;
        const dpr = window.devicePixelRatio || 1;

        if (canvas) {
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
        }
    }, [width, height, ratio]);

    // 初始化 Render
    useEffect(() => {
        const render = new Render(canvasRef.current);

        // 开启摄像头
        xyRTCInstance.startCamera();

        const animationFrame = () => {
            const frame = xyRTCInstance.getVideoFrame(LOCAL_VIEW_ID, false);

            if (frame.hasData) {
                const { buffer, width, height, rotation } = frame;
                render.draw(buffer, width, height, rotation);
            }
        }
        xy.setInterval(timer.current, animationFrame, 66.6);

        return () => {
            xy.clearInterval(timer.current);
        }
    }, []);

    useEffect(() => {
        return () => {
            // 如果是在会中，并且摄像头打开了，则不 stop，否则就关闭摄像头
            stopCameraWhenDestroy && xyRTCInstance.stopCamera();
        }
    }, [stopCameraWhenDestroy]);
    
    return <canvas className={className} ref={canvasRef} id='video-effect-preview'></canvas>;
}

export default LocalVideo;
