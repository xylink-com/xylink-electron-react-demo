/**
 * 音视频
 */
import xyRTC from '@/utils/xyRTC';
import { useState, useEffect, useRef } from 'react';
import { Button, Select } from 'antd';
import { AudioOutlined, SoundOutlined } from '@ant-design/icons';
import { IDeviceType } from '@/type';
import path from 'path';
import { useRecoilState, useRecoilValue } from 'recoil';
import { callState, selectedDeviceState } from '@/utils/state';
import { MeetingStatus } from '@/type/enum';

const { Option } = Select;

const Device = () => {
  const meetingState = useRecoilValue(callState);
  const isInMeeting = meetingState === MeetingStatus.MEETING;
  const [cameraList, setCameraList] = useState([]);
  const [microphoneList, setMicrophoneList] = useState([]);
  const [speakerList, setSpeakerList] = useState([]);
  const [selectedDevice, setSelectedDevice] =
    useRecoilState(selectedDeviceState);
  const [testSpeakerStatus, setTestSpeakerStatus] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 音频输入级别
  const [speakerLevel, setSpeakerLevel] = useState(0); // 音频输出级别

  const testSpeakerStatusRef = useRef(false);
  const selectedDeviceRef = useRef({
    camera: '',
    microphone: '',
    speaker: '',
  });
  const micLevelTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakerLevelTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(()=>{
    return ()=>{
      // 会外 离开此页面时，释放音频
      if(!isInMeeting){
        xyRTC.releaseAudioFocus()
      }
    }
  },[isInMeeting])

  useEffect(() => {
    testSpeakerStatusRef.current = testSpeakerStatus;
  }, [testSpeakerStatus]);

  useEffect(() => {
    (async () => {
      if (!xyRTC) {
        return;
      }

      await updateCameraDevices();
      await updateMicrophoneDevices();
      await updateSpeakerDevices();

      setSelectedDevice(selectedDeviceRef.current);
    })();
  }, [setSelectedDevice]);

  useEffect(() => {
    micLevelTimer.current = setInterval(async () => {
      const level = xyRTC.getMicPeakMeter();

      setMicLevel(level);
    }, 200);

    return () => {
      if (micLevelTimer.current) {
        clearInterval(micLevelTimer.current);
        micLevelTimer.current = null;
      }

      if (speakerLevelTimer.current) {
        clearInterval(speakerLevelTimer.current);
        speakerLevelTimer.current = null;
      }

      if (testSpeakerStatusRef.current) {
        // 停止播放扬声器
        xyRTC.stopPlayWavfile();
      }

      setTestSpeakerStatus(false);
    };
  }, []);

  useEffect(() => {
    if (testSpeakerStatus) {
      speakerLevelTimer.current = setInterval(async () => {
        const level = xyRTC.getSpeakerPeakMeter();

        setSpeakerLevel(level);
      }, 200);
    } else {
      if (speakerLevelTimer.current) {
        clearInterval(speakerLevelTimer.current);
        speakerLevelTimer.current = null;
      }
      setSpeakerLevel(0);
    }
  }, [testSpeakerStatus]);

  const onSwitchDevice = async (type: IDeviceType, deviceId: string) => {
    try {
      await xyRTC.switchDevice(type, deviceId);
    } catch (err) {
      console.log(`switch ${type} device error: `, err);
    }
  };

  const onSelectDevice = async (type: IDeviceType, deviceId: string) => {
    setSelectedDevice({
      ...selectedDevice,
      [type]: deviceId,
    });

    onSwitchDevice(type, deviceId);
  };

  const updateCameraDevices = async () => {
    const camera = await xyRTC.getDeviceList('camera');

    const selectedId = updateSelectedDevice(camera);

    setCameraList(camera);

    if (selectedId !== selectedDevice.camera) {
      onSwitchDevice('camera', selectedId);
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      camera: selectedId,
    };
  };

  const updateMicrophoneDevices = async () => {
    const microphone = await xyRTC.getDeviceList('microphone');

    console.log('getDeviceList microphone:', microphone);

    const selectedId = updateSelectedDevice(microphone);

    // 因为离开设备检测页面时，会释放音频。 所以在获取音频列表时，主动choose当下的设备。
    onSwitchDevice('microphone', selectedId);

    setMicrophoneList(microphone);

    console.log('microphone selectedId', selectedId);
    console.log('selectedDevice.microphone', selectedDevice.microphone);

    if (selectedId !== selectedDevice.microphone) {
      onSwitchDevice('microphone', selectedId);
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      microphone: selectedId,
    };
  };

  const updateSpeakerDevices = async () => {
    const speaker = await xyRTC.getDeviceList('speaker');
    const selectedId = updateSelectedDevice(speaker);

    setSpeakerList(speaker);

    if (selectedId !== selectedDevice.speaker) {
      onSwitchDevice('speaker', selectedId);
    }

    selectedDeviceRef.current = {
      ...selectedDeviceRef.current,
      speaker: selectedId,
    };
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

  // 测试扬声器
  const testSpeaker = () => {
    if (testSpeakerStatus) {
      xyRTC.stopPlayWavfile();
    } else {
      const isDev = process.env.NODE_ENV === 'development';
      let filePath = '';

      if (isDev) {
        filePath = path.resolve('__dirname', '../assets/ring.wav');
      } else {
        filePath = path.join(process.resourcesPath, './assets/ring.wav');
      }

      filePath && xyRTC.startPlayWavFile(filePath, 0);
    }

    setTestSpeakerStatus(!testSpeakerStatus);
  };

  return (
    <div className="setting__content-device">
      <div className={`setting__content-device-main`}>
        <div>
          <div className="item">
            <div className="key">视频输入</div>
            <div className="value">
              <Select
                style={{ width: 300 }}
                value={selectedDevice.camera}
                onSelect={(val: string) => {
                  onSelectDevice('camera', val);
                }}
              >
                {cameraList.map(({ devId, devName }) => {
                  return (
                    <Option key={devId} value={devId}>
                      {devName}
                    </Option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div className="item">
            <div className="key">音频输入</div>
            <div className="value">
              <Select
                style={{ width: 300 }}
                value={selectedDevice.microphone}
                onSelect={(val: string) => {
                  onSelectDevice('microphone', val);
                }}
              >
                {microphoneList.map(({ devId, devName }) => {
                  return (
                    <Option key={devId} value={devId}>
                      {devName}
                    </Option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div className="item">
            <div className="key"></div>
            <div className="value">
              <AudioOutlined style={{ marginRight: '5px' }} />
              <div className="level-process">
                <div
                  className="level-value"
                  style={{ transform: `translateX(${micLevel}%)` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="item">
            <div className="key">音频输出</div>
            <div className="value">
              <Select
                style={{ width: 300 }}
                value={selectedDevice.speaker}
                onSelect={(val: string) => {
                  onSelectDevice('speaker', val);
                }}
              >
                {speakerList.map(({ devId, devName }) => {
                  return (
                    <Option key={devId} value={devId}>
                      {devName}
                    </Option>
                  );
                })}
              </Select>
            </div>
            {!isInMeeting && (
              <Button
                type="primary"
                className="operate-btn"
                onClick={testSpeaker}
              >
                {testSpeakerStatus ? '停止' : '检测扬声器'}
              </Button>
            )}
          </div>

          {!isInMeeting && (
            <div className="item">
              <div className="key"></div>
              <div className="value">
                <SoundOutlined style={{ marginRight: '5px' }} />
                <div className="level-process">
                  <div
                    className="level-value"
                    style={{ transform: `translateX(${speakerLevel}%)` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Device;