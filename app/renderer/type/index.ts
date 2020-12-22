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
}
