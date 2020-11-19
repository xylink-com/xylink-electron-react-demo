import React, { useState, useEffect, useRef } from 'react';
import { Button, message, Row, Form, Input, Modal } from 'antd';
import { XYRTC } from '@xylink/xy-electron-sdk';
import cloneDeep from 'clone-deep';
import { ipcRenderer } from 'electron';
import SettingModal from './components/Modal';
import Store from 'electron-store';
import { USER_INFO, DEFAULT_PROXY } from './utils/enum';
import Video from './components/Video';
import { IInfo } from './type/index';
import ring from '../style/ring.ogg';
import endCall from '../style/img/end-call.png';

const store = new Store();
const { confirm } = Modal;
let xyRTC: XYRTC;

const proxy: string = (store.get('xyHttpProxy') || DEFAULT_PROXY) as string;
const env: string = String(proxy).split('.')[0] || 'cloud';

function App() {
  const statusRef = useRef('xyLogin');

  // xyLogin/externalLogin/logined/calling/meeting
  const [status, setStatus] = useState('externalLogin');
  const [screenInfo, setScreenInfo] = useState({
    layoutWidth: 0,
    layoutHeight: 0,
  });

  const [info, setInfo] = useState<IInfo>(
    (): IInfo => {
      const cacheUserInfo: unknown | IInfo =
        store.get('xyUserInfo') || USER_INFO;

      if (!cacheUserInfo) {
        store.set('xyUserInfo', USER_INFO);
      }

      return cacheUserInfo as IInfo;
    }
  );

  const [layout, setLayout] = useState([]);
  const [audio, setAudio] = useState('unmute');
  const [video, setVideo] = useState('unmuteVideo');
  const [disableAudio] = useState(false);
  const [shareContentStatus, setShareContentStatus] = useState(0);
  const [setting, setSetting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    xyRTC = XYRTC.getXYInstance({
      httpProxy: proxy,
      model: "auto",
      muteAudio: true,
    });

    xyRTC.setLogLevel('INFO');

    xyRTC.on("CallState", (e: any) => {
      console.log("call state e: ", e, status);
      const { state, reason } = e;

      if (state === "Connected") {
        if (status !== "meeting") {
          setStatus("meeting");
          message.info("入会成功");
        }
      } else if (state === "Disconnected") {
        message.info(reason);
        hangup(false);
      } else if (state === "Connecting") {
      } else if (state === "Disconnecting") {
      }
    });

    xyRTC.on('LoginState', (e: any) => {
      if (e.state === 'Logined') {
        message.info('登录成功');

        setStatus('logined');
      } else if (e.state === 'Logouted') {
        if (e.error === 1013 || e.error === 1014 || e.error === 1031) {
          message.info('用户名或密码错误');
        } else if (e.error === 1030) {
          message.info('密码验证超时');
        } else {
          message.info('注销成功');
        }

        setStatus(statusRef.current);
      }
    });

    xyRTC.on('VideoStreams', (e: any) => {
      setLayout(cloneDeep(e));
    });

    xyRTC.on('ScreenInfo', (e: any) => {
      setScreenInfo(e);
    });

    xyRTC.on('ContentState', (e: any) => {
      if (e === 1) {
        message.info(`您正在分享Content内容`);
      } else if (e === 0) {
        message.info(`已结束分享内容`);
      }

      setShareContentStatus(e);
    });

    // 实时获取麦克风声量大小（0-100）
    xyRTC.on("MicEnergyReported", (value: number) => {
      setMicLevel(value);
    });
  }, []);

  const onLogin = (e: any) => {
    const { phone, password } = e;

    xyRTC.login(phone, password);
  };

  const onExternalLogin = (e: any) => {
    const { extID, extUserId, displayName } = e;

    xyRTC.loginExternalAccount(extID, extUserId, displayName);
  };

  const onChangeInput = (e: any, key: string) => {
    setInfo({
      // @ts-ignore
      ...info,
      [key]: e.target.value,
    });

    store.set('xyUserInfo.' + key, e.target.value);
  };

  const hangup = (isConfirm = true) => {
    if (isConfirm) {
      confirm({
        title: '提示',
        content: '确定要退出当前会议吗？',
        cancelText: '取消',
        okText: '确定',
        centered: true,
        onOk() {
          endMeeting();
        },
        onCancel() {},
      });
    } else {
      endMeeting();
    }
  };

  const endMeeting = () => {
    setAudio('unmute');
    setVideo('unmuteVideo');
    setStatus('logined');
    setLayout([]);

    xyRTC.endCall();
  };

  const mackCall = () => {
    // 登录&连接服务器成功，可以入会
    const { meeting, meetingPassword, meetingName } = info;

    if (!meeting || !meetingName) {
      message.info('请填写入会信息');
      return;
    }

    const result = xyRTC.makeCall(meeting, meetingPassword, meetingName);

    if (result.code === 3002) {
      message.info('请登录后发起呼叫');
    } else {
      setStatus('calling');
    }
  };

  const stopShareContent = () => {
    xyRTC.stopSendContent();
  };

  const shareContent = () => {
    xyRTC.startSendContent();
  };

  // 开启/关闭摄像头
  const videoOperate = () => {
    if (video === 'unmuteVideo') {
      setVideo('muteVideo');

      xyRTC.muteCamera(true);
    } else {
      setVideo('unmuteVideo');
      xyRTC.muteCamera(false);
    }
  };

  // 切换layout
  const switchLayout = () => {
    xyRTC.switchLayout();
  };

  // mic 操作
  const audioOperate = () => {
    if (audio === 'unmute') {
      setAudio('mute');
      message.info('麦克风已静音');

      xyRTC.muteMic(true);
    } else {
      setAudio('unmute');
      xyRTC.muteMic(false);
    }
  };

  const settingProxy = () => {
    setSetting(!setting);
  };

  const onSettingProxy = (value: string) => {
    store.set('xyHttpProxy', value);
    ipcRenderer.send('relaunch', proxy);

    settingProxy();
  };

  const onLogout = () => {
    xyRTC.logout();
  };

  const switchLogin = () => {
    if (status === 'xyLogin') {
      setStatus('externalLogin');
      statusRef.current = 'externalLogin';
    } else if (status === 'externalLogin') {
      setStatus('xyLogin');
      statusRef.current = 'xyLogin';
    }
  };

  const { layoutWidth, layoutHeight } = screenInfo;
  const layoutStyle = {
    width: `${layoutWidth}px`,
    height: `${layoutHeight}px`,
  };

  const renderXYLoginForm = () => {
    if (status === 'xyLogin') {
      return (
        <Form onFinish={onLogin} initialValues={info} className="login-form">
          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Please input your phone!' }]}
          >
            <Input
              type="phone"
              placeholder="手机号"
              onChange={(e) => {
                onChangeInput(e, 'phone');
              }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input
              type="text"
              placeholder="登录密码"
              onChange={(e) => {
                onChangeInput(e, 'password');
              }}
            />
          </Form.Item>
          <Row justify="center">
            <Button type="primary" htmlType="submit">
              登录
            </Button>
          </Row>
          <Row justify="center">
            <span className="login-type" onClick={switchLogin}>
              切换企业账号登录
            </span>
          </Row>
        </Form>
      );
    }

    return null;
  };

  const renderExternalLoginForm = () => {
    if (status === 'externalLogin') {
      return (
        <Form
          onFinish={onExternalLogin}
          initialValues={info}
          className="login-form"
        >
          <Form.Item
            name="extID"
            rules={[{ required: true, message: 'Please input ext id!' }]}
          >
            <Input
              type="text"
              placeholder="extID"
              onChange={(e) => {
                onChangeInput(e, 'extID');
              }}
            />
          </Form.Item>
          <Form.Item
            name="extUserId"
            rules={[{ required: true, message: 'Please input ext user id!' }]}
          >
            <Input
              type="text"
              placeholder="extUserId"
              onChange={(e) => {
                onChangeInput(e, 'extUserId');
              }}
            />
          </Form.Item>
          <Form.Item
            name="displayName"
            rules={[{ required: true, message: 'Please input display name!' }]}
          >
            <Input
              type="text"
              placeholder="displayName"
              onChange={(e) => {
                onChangeInput(e, 'displayName');
              }}
            />
          </Form.Item>
          <Row justify="center">
            <Button type="primary" htmlType="submit">
              登录
            </Button>
          </Row>

          <Row justify="center">
            <span className="login-type" onClick={switchLogin}>
              切换小鱼账号登录
            </span>
          </Row>
        </Form>
      );
    }

    return null;
  };

  const renderMakecallForm = () => {
    if (status === 'logined') {
      return (
        <Form onFinish={mackCall} initialValues={info} className="login-form">
          <Form.Item
            name="meeting"
            rules={[
              { required: true, message: 'Please input your meeting id!' },
            ]}
          >
            <Input
              type="text"
              placeholder="会议号"
              onChange={(e) => {
                onChangeInput(e, 'meeting');
              }}
            />
          </Form.Item>
          <Form.Item name="meetingPassword">
            <Input
              type="text"
              placeholder="入会密码"
              onChange={(e) => {
                onChangeInput(e, 'meetingPassword');
              }}
            />
          </Form.Item>
          <Form.Item
            name="meetingName"
            rules={[
              {
                required: true,
                message: 'Please input your meeting name!',
              },
            ]}
          >
            <Input
              type="text"
              placeholder="入会昵称"
              onChange={(e) => {
                onChangeInput(e, 'meetingName');
              }}
            />
          </Form.Item>
          <Row justify="center">
            <Button type="primary" htmlType="submit">
              加入会议
            </Button>
          </Row>
          <Row justify="center">
            <span className="login-type" onClick={onLogout}>
              注销
            </span>
          </Row>
        </Form>
      );
    }

    return null;
  };

  const renderMeetingLoading = () => {
    if (status === 'calling') {
      return (
        <div className="loading">
          <div className="loading-content">
            <div className="avatar">
              <img
                src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png"
                alt="nemo-avatar"
              />
            </div>
            <div className="name">正在呼叫</div>
            <div
              className="stop"
              onClick={() => {
                hangup(false);
              }}
            >
              <img src={endCall} alt="end-call" />
            </div>
            <audio autoPlay loop src={ring}></audio>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderLayout = () => {
    return layout.map((val) => {
      if (val) {
        // @ts-ignore
        const { isContent, callUri } = val.roster;
        const mediagroupid = isContent ? 1 : 0;
        const key = callUri + mediagroupid;

        return (
          <Video
            key={key}
            index={key}
            // @ts-ignore
            width={val.position.width}
            // @ts-ignore
            height={val.position.height}
            item={val}
            xyRTC={xyRTC}
          ></Video>
        );
      }

      return null;
    });
  };

  const renderAudio = () => {
    const audioClass = audio === 'unmute' ? 'mic_aec' : 'mute_mic';
    let disabledMute = '';

    let audioStatus = '静音';

    if (audio === 'unmute') {
      audioStatus = '静音';
    } else if (audio === 'mute' && disableAudio) {
      audioStatus = '强制静音';

      disabledMute = 'disabled_mute';
    } else if (audio === 'mute' && !disableAudio) {
      audioStatus = '取消静音';
    }

    return (
      <div
        onClick={audioOperate}
        className={`button ${audioClass} ${disabledMute}`}
      >
        <div className="icon"></div>
        {audio === 'unmute' && (
          <div className="aec">
            <div
              className="aec_content"
              style={{ transform: `translateY(-${micLevel}%)` }}
            />
          </div>
        )}
        <div className="title">{audioStatus}</div>
      </div>
    );
  };

  const renderMeeting = () => {
    if (status === 'meeting') {
      return (
        <div style={{ display: status }}>
          <div className="meeting-header">
            <span>{info.meeting}</span>
          </div>

          <div className="meeting-content">
            <div className="meeting-layout" style={layoutStyle}>
              {renderLayout()}
            </div>
          </div>

          <div className="meeting-footer">
            <div className="middle">
              <div onClick={switchLayout} className="button layout">
                <div className="icon"></div>
                <div className="title">窗口布局</div>
              </div>

              {shareContentStatus === 1 ? (
                <div onClick={stopShareContent} className="button share">
                  <div className="icon"></div>
                  <div className="title">结束共享</div>
                </div>
              ) : (
                <div onClick={shareContent} className="button share">
                  <div className="icon"></div>
                  <div className="title">共享</div>
                </div>
              )}

              <div
                onClick={videoOperate}
                className={`button ${
                  video === 'unmuteVideo' ? 'camera' : 'mute_camera'
                }`}
              >
                <div className="icon"></div>
                <div className="title">
                  {video === 'unmuteVideo' ? '关闭摄像头' : '开启摄像头'}
                </div>
              </div>

              {renderAudio()}
            </div>
            <div className="right">
              <div
                className="button end_call"
                onClick={() => {
                  hangup(true);
                }}
              >
                <div className="icon"></div>
                <div className="title">挂断</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container">
      <div>
        <div className="login">
          <h1 className="xy__demo-title"> XY ELECTRON DEV </h1>
          <h3 className="xy__demo-title">
            <span>{env} 环境</span>
            <span onClick={settingProxy} className="xy_setting">
              [设置]
            </span>
          </h3>

          <SettingModal
            visible={setting}
            value={proxy}
            onHandleOk={onSettingProxy}
            onHandleCancel={settingProxy}
          />

          {renderXYLoginForm()}
          {renderExternalLoginForm()}
          {renderMakecallForm()}
        </div>
      </div>

      {renderMeetingLoading()}
      {renderMeeting()}
    </div>
  );
}

export default App;
