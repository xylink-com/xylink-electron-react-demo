/**
 * interval by requestAnimationFrame
 *
 * 按照屏幕刷新率回调，更稳定的轮询回调
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-10-12 15:44:10
 */

interface ITimer {
  type: string,
  key:string,
  id:number
}

interface IXyInterval {
  timer: Record<string,  ITimer>;
  setInterval: (key:string, cb : Function, interval:number) => string | ITimer;
  clearInterval:(key:string) => void;
  getTimers: () => Record<string,  ITimer>;
  clearAll: () => void
}

const xy:IXyInterval = {
  timer: {},

  /**
   * 启动基于requestAnimation的轮询定时器
   *
   * @param key 定时器key值
   * @param cb 定时器调用函数
   * @param interval 多久触发一次定时器调用
   */
  setInterval(key = "", cb = () => {}, interval = 1000) {
    if (!key || typeof key !== "string") {
      return "Not find kye vlaue";
    }

    const timerObj = this.timer[key];

    if (timerObj) {
      this.clearInterval(key);
    }

    let now = Date.now;
    let stime = now();
    let etime = stime;
    let loop = () => {
      this.timer[key] = {
        type: "interval",
        key,
        id: requestAnimationFrame(loop),
      };

      etime = now();

      if (etime - stime >= interval) {
        stime = now();
        etime = stime;
        cb();
      }
    };

    this.timer[key] = {
      type: "interval",
      key,
      id: requestAnimationFrame(loop),
    };

    return this.timer[key];
  },

  getTimers() {
    return this.timer;
  },

  clearInterval(key:string) {
    const interval = this.timer[key];

    if (interval && interval.id) {
      cancelAnimationFrame(interval.id);
    }

    if (interval) {
      delete this.timer[key];
    }
  },

  clearAll() {
    const timmerKeys = Object.keys(this.timer);

    timmerKeys.forEach((key) => {
      if (this.timer[key].type === "interval") {
        this.clearInterval(key);
      }
    });
  },
};

export { xy };
