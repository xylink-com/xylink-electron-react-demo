import { DEFAULT_SETTING_INFO } from '@/enum';
import { ICloudRecordInfo, TSettingType } from '@/type';
import { MeetingStatus, ShowLanguage } from '@/type/enum';
import {
  CallMode,
  EventType,
  IInteractiveToolInfo,
  ProcessType,
  IAIFaceRecv,
  IDeviceList,
  ContentCaptureType,
  RecordStatus,
  IOnHoldInfo,
} from '@xylink/xy-electron-sdk';
import { atom } from 'recoil';
import store from './store';

/**
 * 会议账号 xyLogin/externalLogin/logined/calling/meeting
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

export const deviceListState = atom<IDeviceList>({
  key: 'deviceList',
  default: {
    camera: [],
    microphone: [],
    speaker: [],
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

/**
 * 遥控摄像头参数
 *
 * @property {boolean} show - 是否展示遥控操作按钮
 * @property {string} callUri - 支持遥控摄像头的终端标识
 * @property {number} feccOri - 支持遥控摄像头的终端的指令标识
 */
export const farEndControlState = atom<{
  show: boolean;
  callUri: string;
  feccOri?: number;
  disabled: boolean;
}>({
  key: 'farEndControl',
  default: {
    show: false, // 是否显示
    callUri: '',
    disabled: false,
  },
});

/**
 * 会控互动工具相关数据，兼容签到、答题、投票等
 *
 * @property {ICopywriting} copywriting - 弹窗内容、左侧顶部状态栏内容
 * @property {EventType} eventType - 互动事件 start end publish RESULT_CLOSE
 * @property {ProcessType} processType - 互动工具业务类型：签到 答题 投票 评价
 * @property {string} questionnaireId - 业务id
 * @property {boolean} endAuto - 是否自动结束（有倒计时），还是手动结束
 * @property {number}} duration - 期限，比如签到剩余时间
 * @property {webViewUrl} webViewUrl - h5页面url
 * @property {number} endUtcTime - 结束时间
 */
export const interactiveState = atom<IInteractiveToolInfo>({
  key: 'interactiveTool',
  default: {
    copywriting: {
      dialogContent: '',
      dialogLabel: '',
      dialogSubContent: '',
      dialogTitle: '',
      notifyContent: '',
      notifyLabel: '',
    },
    duration: 0,
    endAuto: false,
    endUtcTime: 0,
    eventType: EventType.RESULT_CLOSE,
    meetingId: '',
    processType: ProcessType.NONE,
    webViewUrl: '',
    resultWebViewUrl: '',
    questionnaireId: '',
    business: ''
  },
});

/**
 * 签到状态维护
 *
 * @property {boolean} modal - 签到弹窗是否关闭
 * @property {boolean} promp - 左上角签到状态栏是否关闭
 * @property {boolean} isSuccess - 是否已经签到成功
 *
 */
export const signInState = atom({
  key: 'signIn',
  default: {
    modal: false,
    promp: false,
    isSuccess: false,
  }
})

/**
 * 同传字幕展示的语言
 */
export const captionShowLanguageState = atom({
  key: 'captionShowLanguage',
  default: ShowLanguage.CHINESE
})


/**
 * 是否开启同传字幕
 */
export const captionIsStartState = atom({
  key: 'captionIsStart',
  default: false
})

/**
 * AI Face 人脸识别信息
 */
export const AIFaceMapState = atom<Map<string, IAIFaceRecv>>({
  key: 'AIFaceMap',
  default: new Map(),
});

/**
 * 共享内容列表弹窗
 */
export const contentThumbnailModalState =  atom({
  key: 'contentThumbnailModal',
  default: false,
});

/**
 * 共享状态（暂停/共享中）
 */
export const contentSharingIsPaused = atom({
  key: 'contentSharingState',
  default: false,
});

/**
 * 是不是手动暂停
 */
export const contentSharingIsManualPaused = atom({
  key: 'contentSharingManualState',
  default: false,
});

/**
 * 共享类型
*/
export const shareContentType = atom<ContentCaptureType>({
  key: 'shareContentType',
  default: ContentCaptureType.INVALID,
});

/**
 * 录制状态
 */

export const cloudRecordInfo = atom<ICloudRecordInfo>({
  key: 'cloudRecordInfo',
  default:{
    recordStatus: RecordStatus.IDLE,
    isSelfRecord: false
  },
});

/**
 * 等候室状态
 */
export const holdInfoState = atom<IOnHoldInfo>({
  key: 'holdInfo',
  default:{
    isOnhold: false
  },
});
