import { XYRTC, IConfig, LayoutModel } from '@xylink/xy-electron-sdk';
import path from 'path';
import { isDevelopment, isWin } from '@/utils/index';
import store from './store';

class RTC {
  static getInstance(config?: IConfig) {
    const settingInfo = store.get('xySettingInfo') || {};

    const {
      clientId = '',
      clientSecret = '',
      proxy = 'cloud.xylink.com',
      model = LayoutModel.AUTO,
    } = settingInfo;

    const platformName = isWin ? 'win32' : 'mac';
    let dllPath = '';

    if (isDevelopment) {
      dllPath = `node_modules/@xylink/xy-electron-sdk/dll`;
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
      // 动态设置环境，当构建正式包时，dll从当前程序的dll目录加载，dev开发时，从sdk目录加载
      dllPath,
      container: {
        elementId: 'meeting-content',
      },
      // demo上层实现了篮筐，因此这里禁掉sdk内部设置的篮筐
      enableSharingIndicator: false
    };

    console.log('instanceConfig ====> ', instanceConfig);

    return XYRTC.getXYInstance(instanceConfig as IConfig);
  }
}

export default RTC.getInstance();
