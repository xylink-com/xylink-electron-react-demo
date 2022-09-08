/**
 * 设备选择
 */
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Popover } from 'antd';
import './index.scss';
import xyRTC from '@/utils/xyRTC';
import { IDeviceItem, IDeviceType } from '@xylink/xy-electron-sdk';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  currentTabState,
  selectedDeviceState,
  settingModalState,
  toolbarState,
} from '@/utils/state';
interface IProps {
  type: 'audio' | 'video';
  children?: ReactNode;
}

const DeviceSelect = (props: IProps) => {
  const { type } = props;
  const [visible, setVisible] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [microphoneList, setMicrophoneList] = useState([]);
  const [speakerList, setSpeakerList] = useState([]);
  const setSettingVisible = useSetRecoilState(settingModalState);
  const setCurrent = useSetRecoilState(currentTabState);

  const [selectedDevice, setSelectedDevice] =
    useRecoilState(selectedDeviceState);

  const setToolVisible = useSetRecoilState(toolbarState);

  useEffect(() => {
    setToolVisible((state) => ({
      ...state,
      enableHidden: !visible,
      canHidden: !visible,
    }));
  }, [visible]);

  const updateDevices = useCallback(
    async (key: IDeviceType) => {
      const list = await xyRTC.getDeviceList(key);
      const selectedId = updateSelectedDevice(list);

      switch (key) {
        case 'camera':
          setCameraList(list);
          break;
        case 'microphone':
          setMicrophoneList(list);
          break;
        case 'speaker':
          setSpeakerList(list);
          break;
      }

      setSelectedDevice((selectedDevice) => {
        if (selectedDevice[key] !== selectedId) {
          return {
            ...selectedDevice,
            camera: selectedId,
          };
        }
        return selectedDevice;
      });
    },
    [setSelectedDevice]
  );

  useEffect(() => {
    (async () => {
      if (!xyRTC) {
        return;
      }

      if (type === 'audio') {
        await updateDevices('microphone');
        await updateDevices('speaker');
      } else {
        await updateDevices('camera');
      }
    })();
  }, [type, updateDevices]);

  const onSwitchDevice = async (type: IDeviceType, deviceId: string) => {
    setSelectedDevice((selectedDevice) => ({
      ...selectedDevice,
      [type]: deviceId,
    }));

    try {
      await xyRTC.switchDevice(type, deviceId);
    } catch (err) {
      console.log(`switch ${type} device error: `, err);
    }
  };

  const updateSelectedDevice = (list: any) => {
    let selectedId = '';
    const selectedDevice = list.filter((item: any) => item.isSelected);

    if (selectedDevice.length > 0) {
      selectedId = selectedDevice[0].devId;
    } else if (list.length > 0) {
      selectedId = list[0].devId;
    }

    return selectedId;
  };

  const openSettingModal = () => {
    setVisible(false);
    setSettingVisible(true);
    setCurrent('device');
  };

  const content =
    type === 'audio' ? (
      <>
        <div className="select__item">
          <p>选择麦克风</p>
          <ul>
            {microphoneList.map((device: IDeviceItem) => {
              return (
                <li
                  key={device.devId}
                  className={`${
                    selectedDevice.microphone === device.devId ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setVisible(false);
                    onSwitchDevice('microphone', device.devId);
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
                  className={`${
                    selectedDevice.speaker === device.devId ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setVisible(false);
                    onSwitchDevice('speaker', device.devId);
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
                  className={`${
                    selectedDevice.camera === device.devId ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setVisible(false);
                    onSwitchDevice('camera', device.devId);
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

export default DeviceSelect;
