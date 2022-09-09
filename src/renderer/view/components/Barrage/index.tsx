/**
 * 点名、字幕提示
 */
import { useRef, useEffect } from 'react';
import { ISubTitle } from '@xylink/xy-electron-sdk';
import './index.scss';

interface IProps {
  subTitle: ISubTitle;
}

const Barrage = ({ subTitle }: IProps) => {
  const containerWidth = window.innerWidth;
  const subTitleRef = useRef<HTMLElement>(null);
  const intervalTimer = useRef<number>(0);

  const {
    content,
    action,
    backgroundRGB = '',
    backgroundAlpha = '0',
    fontRGB = '#fff',
    scroll = false,
    location = 'top',
    fontSize = 'middle',
  } = subTitle;

  const fontSizeMap: Record<string, string> = {
    small: '18px',
    middle: '22px',
    big: '24px',
  };
  const locationMap: Record<string, string> = {
    top: '0px',
    middle: '42%',
    bottom: '0px',
  };

  const locationKey = location === 'middle' ? 'top' : location;

  const opacity = (Number(backgroundAlpha) / 100).toFixed(2);

  const style = {
    fontSize: fontSizeMap[fontSize],
    color: fontRGB,
    background: backgroundRGB || 'transparent',
    opacity,
    [locationKey]: locationMap[location],
  };

  useEffect(() => {
    // 实现弹幕
    if (subTitleRef.current) {
      const objWidth = subTitleRef.current.clientWidth;
      const initTransformX = containerWidth;
      let transformX = initTransformX;

      const render = () => {
        transformX -= 0.5;
        if (transformX + objWidth < 0) {
          cancelAnimationFrame(intervalTimer.current);
          transformX = initTransformX;
        }

        if (subTitleRef.current) {
          subTitleRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`;
        }

        intervalTimer.current = requestAnimationFrame(render);
      };

      if (scroll) {
        subTitleRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`;
        subTitleRef.current.style.visibility = 'initial';

        render();
      }
    }

    return () => {
      cancelAnimationFrame(intervalTimer.current);
    };
  }, [subTitle, containerWidth, scroll]);

  useEffect(() => {
    if (!subTitle || action !== 'push' || !scroll) {
      cancelAnimationFrame(intervalTimer.current);
    }
  }, [subTitle, action, scroll]);

  if (content && action === 'push') {
    const { background, opacity } = style || { background: '', opacity: 1 };
    const textAlign = scroll ? { textAlign: 'left' } : { textAlign: 'center' };
    const textStyle: { [key: string]: string | number } = {
      ...textAlign,
      ...style,
      background: 'transparent',
      opacity: 1,
    };

    return (
      <div className="barrage-title" style={textStyle}>
        <div className="barrage-title-bg" style={{ background, opacity }}></div>
        <span
          className={scroll ? 'barrage-title-text' : ''}
          ref={subTitleRef}
          style={scroll ? { visibility: 'hidden' } : { visibility: 'initial' }}
        >
          {content}
        </span>
      </div>
    );
  } else {
    return <></>;
  }
};

export default Barrage;
