

export type TDeviceType = "camera" | "microphone" | "speaker" | string;

export type TModel = 'custom'|'auto';

export type TResolutionType = 0 | 1 | 2 | 3 | 4 | 5;
export interface IInfo {
  phone: string;
  password: string;
  meeting: string;
  meetingPassword: string;
  meetingName: string;
  extID: string;
  extUserId: string;
  displayName: string;
  muteVideo: boolean;
  muteAudio: boolean;
}

export interface ICallState  {
  state: string;
  error: number;
  reason: string;
};

export interface IConfControl {
  // 主会场callerurl
  chirmanUri: string;
  // 会控web url地址，打开即可进行会议控制
  confMgmtUrl: string;
  // 是否强制静音
  disableMute:boolean;  
  // 静音、非静音
  muteMic:string;
  // 禁止录制
  disableRecord:boolean;
}

export interface IConfInfoChanged {
  participantCount:number;
  contentPartCount:number;
  chairManUrl:string;
}

export interface ISelectedDevice {
  isSelected:boolean;
  devId:string;
}
export interface ITemplateObj {
  position:number[]
}

export interface ITemplate  {
  [type:string]:{
    length:number;
    temp:{
      [index:string]:ITemplateObj[];
    };
    rate:{
      [index:number]:number
    }
  }
}

export enum RecordStatus {
  Idel, // 空闲 录制完成
  Starting, // 开启录制中
  Acting, // 正在录制中
  Stoping, // 停止录制中
  Inact // 暂未使用 暂停录制相关，暂时用不到
}

/**
 * 云端录制回调
 * 
 * @property { RecordStatus } recordState 录制状态
 * @property { boolean } isRecorded 是否录制中
 * @property { string } reason 错误码
 * @property { string } message 错误码信息描述
 */
export interface IRecordStateChange {
  recordState: RecordStatus;
  isRecorded:boolean;
  reason:string;
  message:string;
}

/**
 * 远端录制状态回调
 * 
 * @property { boolean } isStart 远端是否开启了录制
 * @property { string } uri 录制发起者名称
 */
export interface IRecordNotification {
  isStart: boolean;
  uri:string;
  callUri:string;
  status:string;
}
