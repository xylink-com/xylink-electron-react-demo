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
