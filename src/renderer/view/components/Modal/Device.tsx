/**
 * 音视频
 */
import xyRTC from '@/utils/xyRTC';
import { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { Button, Select, Switch } from 'antd';
import { AudioOutlined, SoundOutlined } from '@ant-design/icons';
import path from 'path';
import {
  callState,
  localVideoFlip,
  selectedDeviceState,
} from '@/utils/state';
import store from '@/utils/store';
import { MeetingStatus } from '@/type/enum';
import useDeviceSelect from '@/hooks/deviceSelect'
import { DeviceTypeKey } from '@xylink/xy-electron-sdk';

const { Option } = Select;

const Device = () => {
  const meetingState = useRecoilValue(callState);

  const { cameraList, microphoneList, speakerList, switchDevice } = useDeviceSelect()

  const isInMeeting = meetingState === MeetingStatus.MEETING;
  const selectedDevice =
    useRecoilValue(selectedDeviceState);
  const [testSpeakerStatus, setTestSpeakerStatus] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 音频输入级别
  const [speakerLevel, setSpeakerLevel] = useState(0); // 音频输出级别
  const [videoFlip, setVideoFlip] = useRecoilState(localVideoFlip);

  const testSpeakerStatusRef = useRef(false);
  const micLevelTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakerLevelTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 会外使用麦克风需要用户自己处理麦克风采集
    if (!isInMeeting) {
      xyRTC.startAudioCapture();
    }
    return () => {
      // 会外 离开此页面时，释放音频
      if (!isInMeeting) {
        xyRTC.stopAudioCapture();
      }
    };
  }, [isInMeeting]);

  useEffect(() => {
    testSpeakerStatusRef.current = testSpeakerStatus;
  }, [testSpeakerStatus]);

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
                  switchDevice(DeviceTypeKey.camera, val);
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
            <div className="key">视频镜像</div>
            <div className="value">
              <Switch checked={videoFlip} onChange={(checked) => {
                setVideoFlip(checked);
                store.set('xyOpenLocalVideoFlip', checked);
              }} />
            </div>
          </div>

          <div className="item">
            <div className="key">音频输入</div>
            <div className="value">
              <Select
                style={{ width: 300 }}
                value={selectedDevice.microphone}
                onSelect={(val: string) => {
                  switchDevice(DeviceTypeKey.microphone, val);
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
                  switchDevice(DeviceTypeKey.speaker, val);
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
