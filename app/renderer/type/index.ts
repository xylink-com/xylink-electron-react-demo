export interface IInfo {
  phone: string;
  password: string;
  meeting: string;
  meetingPassword: string;
  meetingName: string;
  extID: string;
  extUserId: string;
  displayName: string;
}

export interface IConfControl {
  // 主会场callerurl
  chirmanUri: string;
  // 会控web url地址，打开即可进行会议控制
  confMgmtUrl: string;
  // 是否强制静音
  disableMute:boolean;  
  // 静音、非静音
  muteMic:string;
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

export type TDeviceType = "camera" | "microphone" | "speaker" | string;

export type TModel = 'custom'|'auto';

export type TResolutionType = 0 | 1 | 2 | 3 | 4 | 5;

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