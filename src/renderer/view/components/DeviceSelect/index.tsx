/**
 * 设备选择
 */
import { ReactNode, useEffect, useState } from 'react';
import { Popover, message } from 'antd';
import { IDeviceItem, DeviceTypeKey } from '@xylink/xy-electron-sdk';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  currentTabState,
  selectedDeviceState,
  settingModalState,
  toolbarState,
} from '@/utils/state';
import { debounceNotImmediate } from '@/utils';
import { UpdateDevice } from '@/type/enum'

import useDeviceSelect from '@/hooks/deviceSelect'

import './index.scss';

interface IProps {
  type: UpdateDevice;
  children?: ReactNode;
}

const DeviceSelect = (props: IProps) => {
  const { type } = props;
  const [visible, setVisible] = useState(false);

  const { cameraList, microphoneList, speakerList, switchDevice } = useDeviceSelect()
  const setSettingVisible = useSetRecoilState(settingModalState);
  const setCurrent = useSetRecoilState(currentTabState);
  const selectedDevice = useRecoilValue(selectedDeviceState);
  const setToolVisible = useSetRecoilState(toolbarState);

  useEffect(() => {
    setToolVisible((state) => ({
      ...state,
      enableHidden: !visible,
      canHidden: !visible,
    }));
  }, [visible, setToolVisible]);

  const openSettingModal = () => {
    setVisible(false);
    setSettingVisible(true);
    setCurrent('device');
  };

  useEffect(() => {
    debounceSwitchSpeakerMessage(selectedDevice.speaker, speakerList, DeviceTypeKey.speaker);
  }, [selectedDevice.speaker]);

  useEffect(() => {
    debounceSwitchMicrophoneMessage(selectedDevice.microphone, microphoneList, DeviceTypeKey.microphone);
  }, [selectedDevice.microphone]);

  const content =
    type === UpdateDevice.AUDIO ? (
      <>
        <div className="select__item">
          <p>选择麦克风</p>
          <ul>
            {microphoneList.map((device: IDeviceItem) => {
              return (
                <li
                  key={device.devId}
                  className={`${selectedDevice.microphone === device.devId ? 'selected' : ''
                    }`}
                  onClick={() => {
                    setVisible(false);
                    switchDevice(DeviceTypeKey.microphone, device.devId);
                  }}
                >
                  {device.devName}
                </li>
              );
            })}
          </ul>
          <div className="h-line" />
        </div>
        <div className="select__item">
          <p>选择扬声器</p>
          <ul>
            {speakerList.map((device: IDeviceItem) => {
              return (
                <li
                  key={device.devId}
                  className={`${selectedDevice.speaker === device.devId ? 'selected' : ''
                    }`}
                  onClick={() => {
                    setVisible(false);
                    switchDevice(DeviceTypeKey.speaker, device.devId);
                  }}
                >
                  {device.devName}
                </li>
              );
            })}
          </ul>
          <div className="h-line" />
        </div>
        <div className="select__operate" onClick={openSettingModal}>
          音频选项
        </div>
      </>
    ) : (
      <>
        <div className="select__item">
          <p>选择摄像头</p>
          <ul>
            {cameraList.map((device: IDeviceItem) => {
              return (
                <li
                  key={device.devId}
                  className={`${selectedDevice.camera === device.devId ? 'selected' : ''
                    }`}
                  onClick={() => {
                    setVisible(false);
                    switchDevice(DeviceTypeKey.camera, device.devId);
                  }}
                >
                  {device.devName}
                </li>
              );
            })}
          </ul>
          <div className="h-line" />
        </div>
        <div className="select__operate" onClick={openSettingModal}>
          视频选项
        </div>
      </>
    );

  return (
    <Popover
      content={content}
      visible={visible}
      onVisibleChange={setVisible}
      trigger="click"
      placement="top"
      overlayClassName="xy-popover select-popover"
      align={{
        offset: [0, -7],
      }}
    >
      {props.children}
    </Popover>
  );
};

const switchDeviceMessage = (selectedDeviceId: string, deviceList: IDeviceItem[], deviceTypeKey: DeviceTypeKey) => {
  console.log(`selectedDevice deviceTypeKey ${deviceTypeKey}`, selectedDeviceId)

  const device = deviceList.find(item => item.devId === selectedDeviceId);

  if (device) {
    message.info(`音频${deviceTypeKey === DeviceTypeKey.speaker ? '输出' : '输入'}设备已自动切换至${device.devName}`, 3);
  }
}
// recoil bug: useEffect依赖recoil state, 状态改变会触发两次，需要节流一下
// https://github.com/facebookexperimental/Recoil/issues/307
const debounceSwitchSpeakerMessage = debounceNotImmediate(switchDeviceMessage, 200);

const debounceSwitchMicrophoneMessage = debounceNotImmediate(switchDeviceMessage, 200);

export default DeviceSelect;
