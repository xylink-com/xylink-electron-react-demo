/**
 * enum template
 */

export const USER_INFO = {
  phone: '+86-',
  password: '',
  meeting: '',
  meetingPassword: '',
  meetingName: '',
  extID: '0142901e3d83e0a1e225ef92b8663fcaebda7242',
  extUserId: '',
  displayName: '',
  muteVideo: false,
  muteAudio: false
};

export const DEFAULT_PROXY: string = 'cloud.xylink.com';


export const RECORD_STATE_MAP={
  idel:0, // 空闲 录制完成
  starting:1, // 开启录制中
  acting:2, // 正在录制中
  stoping:3, // 停止录制中
  inact:4 // 暂未使用 暂停录制相关，暂时用不到
}