/**
 * 实例化XYRTC
 */
import { XYRTC, IConfig, LayoutModel } from '@xylink/xy-electron-sdk';
import { isDevelopment, isWin } from '@/utils';
import store from './store';
import path from 'path';

class RTC {
  static getInstance(config?: IConfig) {
    const settingInfo = store.get('xySettingInfo') || {};

    const {
      clientId = '',
      clientSecret = '',
      proxy = '',
      model = LayoutModel.AUTO,
    } = settingInfo;

    let dllPath = '';

    if (isDevelopment) {
      dllPath = 'node_modules/@xylink/xy-electron-sdk/dll';
    } else {
      // 如果win使用scheme调用，需传入绝对路径
      dllPath = isWin
        ? path.join(path.dirname(process.execPath), './dll')
        : '../Frameworks';
    }

    const instanceConfig = config || {
      clientId,
      clientSecret,
      httpProxy: proxy,
      model,
      dllPath,
      container: {
        elementId: 'container',
      },
    };

    return XYRTC.getXYInstance(instanceConfig as IConfig);
  }
}

export default RTC.getInstance();
