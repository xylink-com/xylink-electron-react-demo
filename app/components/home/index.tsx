import React, { useEffect } from 'react';
import { XYRTC } from '@xylink/xy-electron-sdk';

let xyRTC: XYRTC;

export default function Home() {
  console.log('XYRTC: ', XYRTC);

  useEffect(() => {
    xyRTC = XYRTC.getXYInstance({
      httpProxy: 'cloud.xylink.com',
    });

    xyRTC.setLogLevel('INFO');

    xyRTC.on('CallState', (e: any) => {
      console.log('call state e: ', e, status);
    });

    xyRTC.on('LoginState', (e: any) => {
      console.log('login state e: ', e);
    });

    xyRTC.on('VideoStreams', (e: any) => {
      console.log('video stream e: ', e);
    });

    xyRTC.on('ScreenInfo', (e: any) => {
      console.log('screen info e: ', e);
    });

    xyRTC.on('ContentState', (e: any) => {
      console.log('content state e: ', e);
    });
  }, []);

  const onLogin = () => {
    xyRTC.login('+86-15353622534', '111111');
  };

  const makeCall = () => {
    xyRTC.makeCall('915353622534', '111111', 'ceshi');
  };

  return (
    <div>
      <div onClick={onLogin}>xyrtc init</div>
      <div onClick={makeCall}>join</div>
    </div>
  );
}
