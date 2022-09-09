import { DEFAULT_SETTING_INFO } from '@/enum';
import { TSettingType } from '@/type';
import { MeetingStatus } from '@/type/enum';
import { CallMode } from '@xylink/xy-electron-sdk';
import { atom } from 'recoil';
import store from './store';

/**
 * 会议状态 xyLogin/externalLogin/logined/calling/meeting
 *
 */
export const callState = atom({
  key: 'callState',
  default: MeetingStatus.CALLING,
});

/**
 * setting Modal visible
 */
export const settingModalState = atom({
  key: 'settingModalState',
  default: false,
});

/**
 * setting Modal current tab
 */
export const currentTabState = atom<TSettingType>({
  key: 'currentTabState',
  default: 'common',
});

/**
 * 设置信息 包含 服务器地址、clientID等
 */
export const settingInfoState = atom({
  key: 'settingInfoState',
  default: store.get('xySettingInfo') || DEFAULT_SETTING_INFO,
});

/**
 * 远端人脸 显示类型
 */
export const faceTypeState = atom({
  key: 'faceTypeState',
  default: '',
});

/**
 * 共享内容时采集电脑声音
 */
export const withDesktopAudioState = atom({
  key: 'withDesktopAudioState',
  default: store.get('xyWithDesktopAudio'),
});

/**
 * 是否广播本地电子铭牌
 */
export const broadCastState = atom({
  key: 'broadCastState',
  default: false,
});

/**
 * 本地采集分辨率 默认360P
 */
export const localResolutionState = atom({
  key: 'localResolutionState',
  default: 2,
});

/**
 * 选择的设备ID
 */
export const selectedDeviceState = atom({
  key: 'selectedDevice',
  default: {
    camera: '',
    microphone: '',
    speaker: '',
  },
});

// 头部、底部是否隐藏
export const toolbarState = atom({
  key: 'toolbar',
  default: {
    enableHidden: true, // 是否启用隐藏
    canHidden: true, // 是否可以隐藏，操作栏打开某些操作/鼠标移入，不可以隐藏、
    show: true, // 是否显示
  },
});

/**
 * 语音模式
 */
export const callModeState = atom({
  key: 'callMode',
  default: CallMode.AudioVideo,
});

/**
 * 本地视频开启、关闭状态
 */
export const videoState = atom({
  key: 'videoMute',
  default: store.get('xyMeetingInfo').muteVideo ? 'muteVideo' : 'unmuteVideo',
});

/**
 * 检查设备权限
 *
 * mac 开启摄像头，需等到授权/不授权完成
 */
export const deviceCheckFinishedState = atom({
  key: 'deviceCheckFinished',
  default: {
    cameraCheckFinished: false,
    microphoneCheckFinished: false,
  },
});

/**
 * 设备变更类型
 */
export const deviceChangeState = atom({
  key: 'deviceChangeState',
  default: '',
});