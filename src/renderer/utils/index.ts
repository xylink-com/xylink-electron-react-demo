/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */

import { TerminalType } from "@xylink/xy-electron-sdk";

/**
 * 节流函数
 *
 * @param fn event function
 * @param delay 每隔多久必须触发一次
 * @param atleast 最短间隔触发时间
 */
export const debounce = function (fn: any, delay: number, atleast: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let previous: number;

  return function (...args: any[]) {
    const now = +new Date();
    // @ts-ignore
    const context = this;

    timer && clearTimeout(timer);
    if (!previous) {
      previous = now;
    }

    if (now - previous >= atleast) {
      fn.apply(context, args);
      // 重置上一次开始时间为本次结束时间
      previous = now;
    } else {
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    }
  };
};

/**
 * 非立即执行防抖
 * @param fn 立即执行函数
 * @param wait 防抖间隔 ms
 * @returns 
 */
export const debounceNotImmediate = (fn: Function, wait: number) => {
  let timerId: NodeJS.Timeout | undefined;
  return function (...args: any[]) {
    // @ts-ignore
    var context = this;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(context, args)
    }, wait)
  }
}

/**
 * 防抖函数
 *
 * @param fn Event function
 * @param wait 等待多少毫秒触发
 */
export const throttle = function (fn: any, wait: number) {
  let lastTime = 0;

  return function (...args: any[]) {
    const nowTime = +new Date();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const context = this;

    if (nowTime - lastTime > wait || !lastTime) {
      fn.apply(context, args);
      lastTime = nowTime;
    }
  };
};

export const isMac = process.platform === 'darwin';
export const isWin = process.platform === 'win32';
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 判断终端是否支持遥控摄像头
 * 当前摄像头所支持的指令集, onVideoStreamChanged#SDKVideoStreamInfo.feccOri
 * (feccOri & 1 << 1) != 0 : 支持水平方向上的转动 (左右)
 * (feccOri & 1 << 2) != 0 : 支持垂直方向上的转动 (上下)
 * (feccOri & 1 << 4) != 0 : 支持缩放
 *
 * @param {number | undefined} feccOri 终端指令
 * @return {object} 是否支持水平、垂直、缩放、前三种全部支持
 */
export const farEndControlSupport = (feccOri: number | undefined) => {
  if (typeof feccOri !== 'number') {
    return {
      supportHorizontal: false,
      supportVertical: false,
      supportZoom: false,
      supportSome: false
    }
  }
  const supportHorizontal = (feccOri & 1 << 1) != 0;
  const supportVertical = (feccOri & 1 << 2) != 0;
  const supportZoom = (feccOri & 1 << 4) != 0;
  const supportSome = supportHorizontal || supportVertical || supportZoom;
  return {
    supportHorizontal,
    supportVertical,
    supportZoom,
    supportSome
  }
}


/**
 * 获取设备的默认头像链接
 * 
 * @param terminalType 终端设备类型
 * @returns {string} avatar链接
 */
export const getSrcByDeviceType = (terminalType: TerminalType) => {
  let iconName = 'default';
  switch (terminalType) {
    case TerminalType.TVBOX:
      iconName = 'tvbox'
      break;
    case TerminalType.H323GW:
      iconName = 'h323'
      break;
    case TerminalType.BRUCE:
      iconName = 'bruce'
      break;
    case TerminalType.TEL:
      iconName = 'tel'
      break;
    case TerminalType.SHUTTLE:
      iconName = 'shtl'
      break;
    case TerminalType.HARD:
      iconName = 'nemo'
      break;
  }

  return require(`@/assets/img/device/${iconName}.png`)
}

