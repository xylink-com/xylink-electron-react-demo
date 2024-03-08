import xyRTC from '@/utils/xyRTC';
import { useEffect, useMemo } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import {
  selectedDeviceState,
  deviceListState,
  callState,
} from '@/utils/state';
import { IDeviceList, ICurrentDevice, DeviceTypeKey } from '@xylink/xy-electron-sdk';
import { MeetingStatus } from '@/type/enum';

const useDeviceSelect = () => {
  const setSelectedDevice = useSetRecoilState(selectedDeviceState);
  const [deviceList, setDeviceList] = useRecoilState(deviceListState);
  const meetingState = useRecoilValue(callState);

  const isInMeeting = meetingState === MeetingStatus.MEETING;

  const currentDeviceCallback = (currentDevice: Partial<ICurrentDevice>) => {
    console.log('currentDeviceCallback currentDevice: ', currentDevice);
    // 会外使用麦克风需要用户自己处理麦克风采集，设备更新需要重新捕获麦克风
    if(currentDevice.microphone && !isInMeeting){
      xyRTC.startAudioCapture();
    }
    setSelectedDevice((prevState: ICurrentDevice) => ({ ...prevState, ...currentDevice }));
  }
  const deviceCallback = (deviceList: Partial<IDeviceList>) => {
    console.log('deviceCallback deviceList: ', deviceList)
    setDeviceList((prevState: IDeviceList) => ({ ...prevState, ...deviceList }));
  }

  useEffect(() => {
    xyRTC.getDeviceList().then((res: IDeviceList) => setDeviceList(res));
    xyRTC.getCurrentDevice().then((res: ICurrentDevice) => setSelectedDevice(res));
  }, []);

  useEffect(() => {
    if (xyRTC.listenerCount('Device') === 0) {
      xyRTC.on('Device', deviceCallback);
    }

    if (xyRTC.listenerCount('CurrentDevice') === 0) {
      xyRTC.on('CurrentDevice', currentDeviceCallback);
    }

    return () => {
      xyRTC.removeListener('Device', deviceCallback);
      xyRTC.removeListener('CurrentDevice', currentDeviceCallback)
    }
  }, []);

  const switchDevice = (type: DeviceTypeKey, devId: string) => {
    console.log('demo switchDevice', type, devId)
    xyRTC.switchDevice(type, devId);
  }

  const cameraList = useMemo(() => deviceList.camera, [deviceList.camera]);
  const microphoneList = useMemo(() => deviceList.microphone, [deviceList.microphone]);
  const speakerList = useMemo(() => deviceList.speaker, [deviceList.speaker]);

  return {
    cameraList,
    microphoneList,
    speakerList,
    switchDevice,
  }
}

export default useDeviceSelect;
