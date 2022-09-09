import { IModel } from '@xylink/xy-electron-sdk';

/**
 * 静音状态
 *
 * @value mute 静音
 * @value unmute 取消静音
 */
export type IAudio = 'mute' | 'unmute';

/**
 * 设置内容Tab
 *
 * @value device 音视频信息
 * @value common 通用
 * @value feedback 反馈
 * @value about 关于
 */
export type TSettingType = 'device' | 'common' | 'feedback' | 'about';

/**
 * 设备类型
 *
 * @value camera 视频输入
 * @value microphone 音频输入
 * @value speaker 音频输出
 */
export type IDeviceType = 'camera' | 'microphone' | 'speaker';

/**
 * 设置信息
 *
 * @property { string } clientId
 * @property { string } clientSecret
 * @property { string } extId 企业ID
 * @property { string } proxy 服务器地址
 * @property { string } model 布局模式
 */
export interface ISettingInfo {
  clientId: string;
  clientSecret: string;
  extId: string;
  proxy: string;
  model: IModel;
}

/**
 * 登录Form 信息
 *
 * @property { string? } phone 手机号
 * @property { string? } password 密码
 * @property { string? } extID 三方企业ID
 * @property { string? } extUserId 三方用户信息
 * @property { string? } displayName 用户名称
 */
export interface ILoginData {
  phone?: string;
  password?: string;
  extID?: string;
  extUserId?: string;
  displayName?: string;
}
