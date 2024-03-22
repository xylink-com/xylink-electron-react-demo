import xyRTC from '@/utils/xyRTC';
import { ILayout } from '@xylink/xy-electron-sdk';
import { useEffect, useMemo, useRef, useState } from 'react';

const useAnnotationRectStyle = (item: ILayout) => {
  const frameTimer = useRef<NodeJS.Timer>();
  const [frameRect, setFrameRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (item.sourceId && item.roster.isContent) {
      if (frameTimer.current) {
        clearInterval(frameTimer.current);
      }

      frameTimer.current = setInterval(() => {
        const { width, height } = xyRTC.getVideoFrame(item.sourceId, true);
        setFrameRect({
          width,
          height,
        });
      }, 2000);
    }

    return () => {
      clearInterval(frameTimer.current);
      frameTimer.current = undefined;
    };
  }, [item.sourceId, item.roster.isContent]);

  const annotationRectStyle = useMemo(() => {
    let calcStyle = { top: 0, right: 0, bottom: 0, left: 0 };
    if (item.sourceId && item.roster.isContent) {
      const { width, height } = frameRect;

      const {width: wrapperWidth, height: wrapperHeight} = item.position;
      const frameScale = wrapperWidth / wrapperHeight;

      if (width / height > frameScale) {
        calcStyle.left = calcStyle.right = 0;
        calcStyle.top = calcStyle.bottom = Math.round(
          (wrapperHeight - wrapperWidth/width *height)/2
        );
      } else {
        calcStyle.top = calcStyle.bottom = 0;
        calcStyle.left = calcStyle.right = Math.round(
          (wrapperWidth - wrapperHeight/height *width)/2
        );
      }
    }
    return calcStyle;
  }, [
    item.sourceId,
    item.roster.isContent,
    item.position,
    frameRect.width,
    frameRect.height,
  ]);

  return annotationRectStyle;
};

export default useAnnotationRectStyle;
