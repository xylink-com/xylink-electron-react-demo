/**
 * 鼠标隐藏Hook函数
 *
 * pc逻辑：
 *     默认显示，鼠标移出画面，消失；
 *     移入画面，显示；
 *     在显示的情况下，5s内无任何点击，则自动消失；
 *     点击头部、底部某些按钮，则一直显示，即时移出浏览器，也显示
 * 移动端逻辑：
 *     默认显示，点击时，消失，再点击，显示；
 *     在显示的情况下，5秒内无任何点击，则自动消失
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from '@/utils/index';
import { useRecoilState } from 'recoil';
import { toolbarState } from './state';

const delay = 8000;

function addEvent(
  element: Document | HTMLHtmlElement,
  eventName: string,
  callback: () => void
) {
  element.addEventListener(eventName, callback, false);
}

function removeEvent(
  element: Document | HTMLHtmlElement,
  eventName: string,
  callback: () => void
) {
  element.removeEventListener(eventName, callback, false);
}

export const useMagicMouse = () => {
  const [show, setShow] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const offset = useRef([0, 0]); // 鼠标坐标位置[left,top]
  const mouseState = useRef<'leave' | 'enter'>('enter'); // 鼠标状态
  const enableHidden = useRef(true);
  const [state, setToolVisible] = useRecoilState(toolbarState);

  useEffect(() => {
    setToolVisible((state) => ({ ...state, show }));
  }, [show, setToolVisible]);

  useEffect(() => {
    enableHidden.current = state.enableHidden && state.canHidden;

    if (enableHidden.current) {
      clearTimer();

      timer.current = setTimeout(() => {
        setShow(false);
      }, delay);
    }
  }, [state.enableHidden, state.canHidden]);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // 离开document, 隐藏
  // 如果未启用隐藏，则一直显示
  const mouseleaveChange = useCallback(() => {
    mouseState.current = 'leave';

    clearTimer();

    if (enableHidden.current) {
      setShow(false);
    }
  }, []);

  // 进入document，显示
  const mouseenterChange = useCallback(() => {
    mouseState.current = 'enter';

    setShow(true);
  }, []);

  useEffect(() => {
    const magicMouse = (e: { pageX: number; pageY: number }) => {
      clearTimer();

      if (!enableHidden.current) {
        return;
      }

      if (mouseState.current === 'leave') {
        return;
      }

      if (offset.current[0] !== e.pageX || offset.current[1] !== e.pageY) {
        setShow(true);
        offset.current = [e.pageX, e.pageY];
      }

      timer.current = setTimeout(() => {
        if (offset.current[0] === e.pageX && offset.current[1] === e.pageY) {
          setShow(false);
          offset.current = [e.pageX, e.pageY];
        }
      }, delay);
    };

    const element = document.querySelector('html') || document;

    const debounceMouseChange = debounce(magicMouse, 1500, 500);

    addEvent(element, 'mousemove', debounceMouseChange);
    addEvent(element, 'mouseleave', mouseleaveChange);
    addEvent(element, 'mouseenter', mouseenterChange);

    return () => {
      removeEvent(element, 'mousemove', debounceMouseChange);
      removeEvent(element, 'mouseleave', mouseleaveChange);
      removeEvent(element, 'mouseenter', mouseenterChange);

      clearTimer();
    };
  }, [mouseenterChange, mouseleaveChange]);

  return { show } as const;
};
