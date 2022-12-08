import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { Form, Input, Row, Button, Checkbox, message } from 'antd';
import Avatar from '@/components/Avatar';
import store from '@/utils/store';
import xyRTC from '@/utils/xyRTC';
import Section from '@/components/Section';
import Setting from '../components/Setting';
import { KICK_OUT_MAP } from '@/enum/error';
import { useRecoilState } from 'recoil';
import { deviceCheckFinishedState } from '@/utils/state';

import './index.scss';

const JoinMeeting = () => {
  const navigate = useNavigate();
  const { displayName = '' } = store.get('xyLoginInfo') || {};
  const [info, setInfo] = useState(store.get('xyMeetingInfo'));
  const [verifyDisabled, setVerifyDisabled] = useState(true);
  const isMonitorRef = useRef(false);
  const [deviceCheckFinished, setDeviceCheckFinished] = useRecoilState(
    deviceCheckFinishedState
  );
  const [isJoin, setIsJoin] = useState(false);

  const onLogout = useCallback(() => {
    xyRTC.logout();

    navigate('/');
  }, [navigate]);

  useEffect(() => {
    ipcRenderer.on('check-camera-finished', (event, isFinished) => {
      setDeviceCheckFinished((state) => ({
        ...state,
        cameraCheckFinished: isFinished,
      }));
    });

    ipcRenderer.on('check-microphone-finished', (event, isFinished) => {
      setDeviceCheckFinished((state) => ({
        ...state,
        microphoneCheckFinished: isFinished,
      }));
    });
  }, [setDeviceCheckFinished]);

  useEffect(() => {
    setVerifyDisabled(!(info.meetingNumber && info.displayName));
  }, [info]);

  const joinMeeting = useCallback(() => {
    const {
      meetingNumber,
      displayName,
      meetingPassword,
      muteVideo = false,
      muteAudio = false,
      meetingId
    } = info;

    const result = xyRTC.makeCall(
      meetingNumber,
      meetingPassword,
      displayName,
      muteVideo,
      muteAudio,
      {
        isMonitor: isMonitorRef.current,
        meetingId
      }
    );

    if (result.code === 'XYSDK:960106') {
      message.info('请登录后发起呼叫');

      navigate('/');
    } else {
      navigate('/meeting');
    }
  }, [info, navigate]);

  useEffect(() => {
    if (!isJoin) {
      return;
    }

    const { cameraCheckFinished, microphoneCheckFinished } =
      deviceCheckFinished;

    // mac入会，需等到授权/不授权完成
    if (cameraCheckFinished && microphoneCheckFinished) {
      joinMeeting();
    }
  }, [isJoin, deviceCheckFinished, joinMeeting]);

  useEffect(() => {
    const kickOutHandler = (e: string) => {
      console.log('demo get kick out message: ', e);

      message.info(`${KICK_OUT_MAP[e] || '未知异常，重新登录'}`);

      onLogout();
    };

    xyRTC.on('KickOut', kickOutHandler);

    return () => {
      xyRTC.off('KickOut', kickOutHandler);
    };
  }, [onLogout]);

  const onChangeValue = (value: string | boolean, key: string) => {
    setInfo((info) => ({
      ...info,
      [key]: value,
    }));

    store.set('xyMeetingInfo.' + key, value);
  };

  const makeCall = (isMonitor = false) => {
    isMonitorRef.current = isMonitor;
    // 登录&连接服务器成功，可以入会
    const { meetingNumber, displayName } = info;

    if (!meetingNumber || !displayName) {
      message.info('请填写入会信息');
      return;
    }

    // 检测、申请摄像头权限
    ipcRenderer.send('check-camera-access');
    ipcRenderer.send('check-microphone-access');

    setIsJoin(true);
  };

  return (
    <Section>
      <div className="login-info">
        <Avatar />
        <span className="login-info-name" title={displayName}>
          {displayName}
        </span>
        <span className="logout-btn" onClick={onLogout}>
          退出登录
        </span>
      </div>
      <div className="join-header">
        <span>加入会议</span>
        <Setting>
          <div className="setting-btn">设置</div>
        </Setting>
      </div>
      <Form
        onFinish={() => {
          makeCall(false);
        }}
        initialValues={info}
        className="xy-form"
      >
        <Form.Item
          name="meetingNumber"
          rules={[{ required: true, message: '请输入云会议号或终端号!' }]}
        >
          <Input
            type="text"
            placeholder="输入云会议号或终端号"
            onChange={(e) => {
              onChangeValue(e.target.value, 'meetingNumber');
            }}
          />
        </Form.Item>
        <Form.Item
          name="meetingId"
        >
          <Input
            type="text"
            placeholder="meetingId, 可选"
            onChange={(e) => {
              onChangeValue(e.target.value, 'meetingId');
            }}
          />
        </Form.Item>
        <Form.Item name="meetingPassword">
          <Input
            type="text"
            placeholder="如有入会密码，请输入会议密码"
            onChange={(e) => {
              onChangeValue(e.target.value, 'meetingPassword');
            }}
          />
        </Form.Item>
        <Form.Item
          name="displayName"
          rules={[
            {
              required: true,
              message: '请输入会议中显示的名称!',
            },
          ]}
        >
          <Input
            type="text"
            placeholder="输入会议中显示的名称"
            maxLength={64}
            onChange={(e) => {
              onChangeValue(e.target.value, 'displayName');
            }}
          />
        </Form.Item>

        <Form.Item name="muteVideo" className="xy-checkbox">
          <Checkbox
            checked={!info.muteVideo}
            onChange={(e) => {
              onChangeValue(!e.target.checked, 'muteVideo');
            }}
          >
            开启摄像头
          </Checkbox>
        </Form.Item>
        <Form.Item name="muteAudio" className="xy-checkbox">
          <Checkbox
            checked={!info.muteAudio}
            onChange={(e) => {
              onChangeValue(!e.target.checked, 'muteAudio');
            }}
          >
            开启麦克风
          </Checkbox>
        </Form.Item>

        <Row justify="center" className="xy-form-bottom">
          <Button
            disabled={verifyDisabled}
            className={`xy-btn  ${verifyDisabled ? 'disabled-btn' : ''}`}
            type="primary"
            htmlType="submit"
          >
            加入会议
          </Button>
        </Row>
      </Form>
    </Section>
  );
};

export default JoinMeeting;
