/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */
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

  return function () {
    const now = +new Date();
    // @ts-ignore
    const context = this;
    const args = arguments;

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
 * 防抖函数
 *
 * @param fn Event function
 * @param wait 等待多少毫秒触发
 */
export const throttle = function (fn: any, wait: number) {
  let lastTime = 0;

  return function () {
    const nowTime = +new Date();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const context = this;
    const args = arguments;

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

