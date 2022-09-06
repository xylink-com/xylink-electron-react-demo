import { ACCOUNT, SERVER } from '@/config';
import { MeetingStatus } from '@/type/enum';
import { LayoutModel } from '@xylink/xy-electron-sdk';

// 服务协议
export const XYLINK_AGREEMENT_URL =
  'https://cdn.xylink.com/agreement/xylink-agreement.html';

//  隐私政策
export const PRIVACY_AGREEMENT_URL =
  'https://cdn.xylink.com/agreement/privacy-agreement.html';

/**
 * 用户信息
 *
 */
export const DEFAULT_USER_INFO = {
  loginType: MeetingStatus.EXTERNAL,
  phone: '+86-',
  password: '',
  meeting: '',
  meetingPassword: '',
  meetingName: '',
  extID: '',
  extUserId: '',
  displayName: '',
};

/**
 * 登录信息
 */

export const DEFAULT_LOGIN_INFO = {
  callUri: '',
  displayName: '',
  extUserId: '',
  userId: 0,
  deviceId: 0,
  tokenInfo: { accessToken: '', refreshToken: '', expires: 0 },
};
/**
 * 会议信息
 */
export const DEFAULT_MEETING_INFO = {
  meetingNumber: '', // 会议号
  meetingPassword: '', // 入会密码
  displayName: '', // 会议中显示的名称
  muteVideo: true, // 入会时是否关闭摄像头
  muteAudio: true, // 入会时是否静音
};

/**
 * 设置信息
 */
export const DEFAULT_SETTING_INFO = {
  clientId: ACCOUNT.clientId,
  clientSecret: ACCOUNT.clientSecret,
  extId: ACCOUNT.extId,
  proxy: SERVER,
  model: LayoutModel.AUTO,
};

/**
 * Local source id
 */
export const LOCAL_VIEW_ID = 'LocalPreviewID';

export const MAX_SIZE = 4;

export const DEFAULT_PAGE_INFO = {
  currentPage: 0,
  // 建议每页请求8位以下的数据，如果设定的值大于8位，那么SDK会自动截断至8位
  totalPage: 0,
  maxSize: MAX_SIZE,
};

export const DEFAULT_CONF_INFO = {
  contentPartCount: 0,
  participantCount: 0,
  chairManUrl: '',
  visibleEpCount: 0,
};

/**
 * 远端录制状态
 */
export const RECORD_STATE_MAP = {
  idel: 0, // 空闲 录制完成
  starting: 1, // 开启录制中
  acting: 2, // 正在录制中
  stoping: 3, // 停止录制中
  inact: 4, // 暂未使用 暂停录制相关，暂时用不到
};

/**
 * 布局模式
 *
 * @value AUTO 自动布局
 * @value CUSTOM 自定义布局
 */
export const LAYOUT_MODE_LIST = ['AUTO', 'CUSTOM'] as const;

export const LAYOUT_MODE_MAP = {
  AUTO: '自动布局',
  CUSTOM: '自定义布局',
};

/**
 * 本地分辨率
 */
export const RESOLUTION_LIST = [
  {
    value: 1,
    title: '180P',
  },
  {
    value: 2,
    title: '360P',
  },
];
