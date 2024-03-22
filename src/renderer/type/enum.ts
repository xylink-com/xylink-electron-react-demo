export enum MeetingStatus {
  'LOGIN' = 'login',
  'CALLING' = 'calling',
  'MEETING' = 'meeting',
}

export enum LoginType{
  XY = 'XY',
  EXTERNAL = 'EXTERNAL',
  THREE_XY = 'THREE_XY_ACCOUNT',
  THREE_EXT_TOKEN = 'THREE_EXT_TOKEN',
  // THREE_EXT_USER_ID = 'THREE_EXT_USER_ID',
}

// 设备管理遍历 ALL表示同时具有VIDEO和AUDIO两种属性
export enum UpdateDevice {
  VIDEO = 0b01,
  AUDIO = 0b10,
  ALL = 0b11
}

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
 * 标注类型
 */
export enum AnnotationKey {
  MOUSE = 'mouse',
  PENCIL = 'pencil',
  HIGHLIGHTER = 'highlighter',
  ERASE = 'erase',
  CLEAR = 'clear',
  COLOR = 'color',
  SAVE = 'save',
}

/**
 * 标注颜色
 */
export enum AnnotationColorKey {
  YELLOW = 'yellow',
  BLACK = 'black',
  BLUE = 'blue',
  RED = 'red',
}

/**
 * 批注画板事件
 */
export enum AnnotationEvent {
  MOUSE = 'Mouse',
  LINE = 'Line', // 铅笔 荧光笔 擦除
  SAVE = 'Save',
  CLEAR = 'Clear',
  COLOR = 'Color',
  // ERASE = 'erase'
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
