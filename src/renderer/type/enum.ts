export enum MeetingStatus {
  'XY' = 'xyLogin',
  'EXTERNAL' = 'externalLogin',
  'CALLING' = 'calling',
  'MEETING' = 'meeting',
}

export enum LoginStatus {
  Logined = 'Logined',
  Logouted = 'Logouted',
}

export enum UpdateDevice{
  VIDEO = 0b01,
  AUDIO = 0b10,
  ALL = 0b11
}

// 设备管理遍历 ALL表示同时具有VIDEO和AUDIO两种属性
export enum ShowLanguage {
  CHINESE = 'Chinese',
  ENGLISH = 'English',
  CHINESE_AND_ENGLISH = 'ChineseAndEnglish'
}

export enum LocalLanguage{
  CHINESE = 'Chinese',
  ENGLISH = 'English',
}

/**
 * 背景图类型
 * 
 * @value COSTOM 自定义背景
 * @value PRESET 预置背景
*/
export enum IVirtualBgType {
  COSTOM,
  PRESET,
}
