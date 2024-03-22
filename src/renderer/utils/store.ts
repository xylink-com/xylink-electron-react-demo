import Store from 'electron-store';
import {
  DEFAULT_USER_INFO,
  DEFAULT_SETTING_INFO,
  DEFAULT_MEETING_INFO,
  DEFAULT_LOGIN_INFO,
} from '../enum';

export const defaultsStore = {
  xyUserInfo: DEFAULT_USER_INFO,
  xyLoginInfo: DEFAULT_LOGIN_INFO,
  xyMeetingInfo: DEFAULT_MEETING_INFO,
  xySettingInfo: DEFAULT_SETTING_INFO,
  xyWithDesktopAudio: false,
  xyOpenLocalVideoFlip: false,
};

const store = new Store({
  defaults: defaultsStore,
  name: 'xy-electron-client',
  watch: true,
  encryptionKey: 'Buffer',
});

export default store;
