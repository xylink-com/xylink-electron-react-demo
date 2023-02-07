import xyRTC from '@/utils/xyRTC';
import { useEffect, useMemo } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

import {
  selectedDeviceState,
  deviceListState,
} from '@/utils/state';
import { IDeviceList, ICurrentDevice, DeviceTypeKey } from '@xylink/xy-electron-sdk';

const useDeviceSelect = () => {
  const setSelectedDevice = useSetRecoilState(selectedDeviceState);
  const [deviceList, setDeviceList] = useRecoilState(deviceListState);

  const currentDeviceCallback = (currentDevice: Partial<ICurrentDevice>) => {
    console.log('currentDeviceCallback currentDevice: ', currentDevice);
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
