import React, { useState, useEffect, useRef } from 'react';
import { Button, message, Row, Form, Input, Modal, Select } from 'antd';
import { XYRTC } from '@xylink/xy-electron-sdk';
import cloneDeep from 'clone-deep';
import { ipcRenderer } from 'electron';
import SettingModal from './components/Modal';
import Store from 'electron-store';
import { USER_INFO, DEFAULT_PROXY } from './utils/enum';
import Video from './components/Video';
import { TEMPLATE } from "./utils/template";
import { getScreenInfo } from "./utils/index";
import { IInfo, IConfControl, TDeviceType, TModel, IConfInfoChanged, ICallState} from './type/index';
import ring from '../style/ring.ogg';
import endCall from '../style/img/end-call.png';

const store = new Store();
const { confirm } = Modal;
const { Option } = Select;

const proxy: string = (store.get('xyHttpProxy') || DEFAULT_PROXY) as string;
const env: string = String(proxy).split('.')[0] || 'cloud';

/**
 * 此处配置布局模式：自定义布局custom和自动布局auto
 * 不支持动态切换布局模式
 */
const MODEL = "custom";
const maxSize = 4;
const defaultPageInfo = {
  currentPage: 0,
  // 建议每页请求8位以下的数据，如果设定的值大于8位，那么SDK会自动截断至8位
  totalPage: 0,
  maxSize,
};

function App() {
  const statusRef = useRef('xyLogin');
  const xyRTC = useRef<any>(null);
  const cachePageInfo = useRef(defaultPageInfo);
  const cacheConfInfo = useRef<IConfInfoChanged>({
    contentPartCount: 0,
    participantCount: 0,
    chairManUrl: "",
  });
  const cacheScreenInfo = useRef({
    rateWidth: 0,
    rateHeight: 0,
  });

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

  const [model, setModel] = useState<TModel>(MODEL);
  const [layout, setLayout] = useState<any[]>([]);
  const [audio, setAudio] = useState('unmute');
  const [video, setVideo] = useState('unmuteVideo');
  const [disableAudio, setDisableAudio] = useState(false);
  const [shareContentStatus, setShareContentStatus] = useState(0);
  const [setting, setSetting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [deviceChangeType, setDeviceChangeType] = useState<TDeviceType>("");
  const [pageInfo, setPageInfo] = useState(defaultPageInfo);

  useEffect(() => {
    xyRTC.current = XYRTC.getXYInstance({
      httpProxy: proxy,
      model: 'auto'
    });

    xyRTC.current.setLogLevel('INFO');

    xyRTC.current.on('CallState', (e: ICallState) => {
      console.log('call state e: ', e, status);
      const { state, reason } = e;

      if (state === 'Connected') {
        if (status !== 'meeting') {
          setStatus('meeting');
          message.info('入会成功');
        }
      } else if (state === 'Disconnected') {
        message.info(reason);
        hangup(false);
      } else if (state === 'Connecting') {
      } else if (state === 'Disconnecting') {
      }
    });

    xyRTC.current.on('LoginState', (e: any) => {
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

    xyRTC.current.on('VideoStreams', (e: any) => {
     
      console.log("demo get video streams: ", e);

      if (model === "custom") {
        // 每次推送都会携带local数据，如果分页不需要展示，则移除local数据
        if (cachePageInfo.current.currentPage !== 0) {
          const localIndex = e.findIndex(
            (item:any) => item.sourceId === "LocalPreviewID"
          );

          if (localIndex >= 0) {
            e.splice(localIndex, 1);
          }
        }

        const nextTemplateRate = TEMPLATE.GALLERY.rate[e.length] || 0.5625;
        // 此处无id是container的容器，则使用document.body的size计算screen
        cacheScreenInfo.current = getScreenInfo("container", nextTemplateRate, [92,0]);

        const nextLayout = calculateBaseLayoutList(e);

        console.log("nextLayout:", nextLayout);

        setLayout(nextLayout);
      } else {
        setLayout(cloneDeep(e));
      }
    });

    xyRTC.current.on('ScreenInfo', (e: any) => {
      setScreenInfo(e);
    });

    xyRTC.current.on("KickOut", (e:string) => {
      console.log("demo get kick out message: ", e);
      const errorMap:{[key:string]:string} = {
        4000: "多个重复长连接建立",
        4001: "用户在另一台设备登录",
        4003: "登录过期"
      };

      onLogout();

      message.info(`账号异常：${errorMap[e] || "未知异常，重新登录"}`);
    });

    xyRTC.current.on('ContentState', (e: any) => {
      if (e === 1) {
        message.info(`您正在分享Content内容`);
      } else if (e === 0) {
        message.info(`已结束分享内容`);
      }

      setShareContentStatus(e);
    });

    // 实时获取麦克风声量大小（0-100）
    xyRTC.current.on("MicEnergyReported", (value:number) => {
      setMicLevel(value);
    });

    // 麦克风/摄像头设备变化事件
    xyRTC.current.on("MediaDeviceEvent", (value:TDeviceType) => {
      setDeviceChangeType(value);
    });

    // 会议控制消息
    // 可以通过此消息获取：会控播放地址/主会场callUri/麦克风状态/是否是强制静音麦克风
    // 自定义布局模式下，主会场callUri需要记录下来，后续requestLayout计算需要使用
    xyRTC.current.on('ConfControl', (e: IConfControl) => {
      console.log('ConfControl message: ', e);
      console.log("metting control message: ", e);

      const {disableMute, muteMic} = e;
      setDisableAudio(disableMute);
      if(muteMic === "mute"){
        setAudio('mute');
      }else if(muteMic === "unmute"){
        setAudio('unmute');
      }
    });

    // 会议信息发生变化，会推送此消息，开始计算请求layout
    xyRTC.current.on("ConfInfoChanged", (e: IConfInfoChanged) => {
      console.log("react conf info change:", e);

      if (model === "auto") {
        // 自动布局内部计算了layout请流，不需要外部处理
        return;
      }

      const { participantCount, contentPartCount } = e;
      cacheConfInfo.current = e;

      const { maxSize } = cachePageInfo.current;
      // 会议产生变动，那么就重新计算总页数
      // participantCount + contentPartCount 代表people + content的总个数
      let totalPage = Math.ceil(
        (participantCount + contentPartCount) / maxSize
      );
      totalPage = totalPage > 0 ? totalPage : 0;

      const nextPageInfo = { ...cachePageInfo.current };

      nextPageInfo.totalPage = totalPage;

      // 如果当前的页码大于最新最大的页码，就更新到最后一页
      if (nextPageInfo.currentPage > totalPage) {
        nextPageInfo.currentPage = totalPage;
      }

      console.log("next page info: ", nextPageInfo);

      // 缓存页码信息
      cachePageInfo.current = nextPageInfo;

      startRequestLayout();
    });
  }, []);

  const calculateBaseLayoutList = (list:any[]) => {
    const { rateHeight, rateWidth } = cacheScreenInfo.current;

    setScreenInfo({
      layoutHeight: rateHeight,
      layoutWidth: rateWidth,
    });

    let positionStyle = {
      left: "0px",
      top: "0px",
      width: "0px",
      height: "0px",
    };
    const positionInfo = TEMPLATE.GALLERY.temp[list.length];

    const layoutList = list.map((item:any, index:number) => {
      const [x, y, w, h] = positionInfo[index].position;
      let layoutX = Math.round(rateWidth * x);
      let layoutY = Math.round(rateHeight * y);
      let layoutWidth = Math.round(rateWidth * w);
      let layoutHeight = Math.round(rateHeight * h);

      positionStyle = {
        left: `${layoutX}px`,
        top: `${layoutY}px`,
        width: `${layoutWidth}px`,
        height: `${layoutHeight}px`,
      };

      const position = {
        width: layoutWidth,
        height: layoutHeight,
      };

      return { ...item, positionStyle, position };
    });

    return layoutList;
  };

  
  const startRequestLayout = () => {
    console.log("request layout cacheConfInfo: ", cacheConfInfo.current);

    // resolution: 0:90, 1: 180, 2:360, 3: 720, 4: 1080
    // quality: 0: low, 1: normal, 2: high
    const {
      contentPartCount = 0,
      participantCount = 0,
      chairManUrl = "",
    } = cacheConfInfo.current;
    const { maxSize, currentPage } = cachePageInfo.current;
    const reqList = [];
    // 存在主会场，那么需要指定callUri字段
    // 如果有content，那么content会上大屏，分辨率请高一些
    // 如果无content，那么content可以请高分辨率的
    // 第0页请求主会场数据，其他分页数据请求people数据
    if (chairManUrl && currentPage === 0) {
      reqList.push({
        isContent: false,
        callUri: chairManUrl,
        resolution: contentPartCount ? 2 : 3,
        quality: 1,
      });
    }

    // 如果有分享content，那么就请高分辨率的content画面
    // callUri可以无需指定
    if (contentPartCount > 0 && currentPage === 0) {
      reqList.push({
        isContent: true,
        callUri: "",
        resolution: 4,
        quality: 2,
      });
    }

    // 如果participantCount的数据大于0，则说明会中有participantCount个人
    // 那么就基于participantCount来做分页请流
    // requestLayout需要指定三个参数：
    // @param reqList 请流列表
    // @param maxViewCount 每页最多可请求多少数据流，最大可设定位8位
    // @param pageIndex：页码，指定请求第几页数据
    if (participantCount > 0) {
      // 第0页和第1页是相同的数据，请求保持一致
      const page = currentPage - 1 <= 0 ? 0 : currentPage - 1;
      let i = page * maxSize;
      let endSize = (page + 1) * maxSize;
      // 如果最大的size大于成员总数，那么就以成员总数为结尾
      let realSize = participantCount >= endSize ? endSize : participantCount;

      for (i; i < realSize; i++) {
        if (reqList.length === 0 && currentPage === 0) {
          reqList.push({
            isContent: false,
            callUri: "",
            resolution: 3,
            quality: 1,
          });
        } else {
          reqList.push({
            isContent: false,
            callUri: "",
            resolution: 1,
            quality: 0,
          });
        }
      }
    }

    console.log("custom request layout: ", reqList);

    // 更新页码信息
    setPageInfo({ ...cachePageInfo.current });

    xyRTC.current.requestLayout(reqList, maxSize, currentPage);
  };

  const switchPage = (type:string) => {
    console.log("cachePageInfo.current: ", cachePageInfo.current);
    const { currentPage, totalPage } = cachePageInfo.current;
    let nextPage = currentPage;

    if (model === "auto") {
      message.info("自动布局不支持分页显示");
      return;
    }

    if (shareContentStatus === 1) {
      message.info("正在分享content，不允许分页");
      return;
    }

    if (type === "next") {
      if (currentPage + 1 > totalPage) {
        message.info("已经在最后一页啦");
        return;
      } else {
        nextPage = currentPage + 1;
      }

      // 缓存页码信息
      cachePageInfo.current.currentPage = nextPage;
    } else if ("previous") {
      if (currentPage - 1 < 0) {
        message.info("已经在首页啦");
        return;
      } else {
        nextPage = currentPage - 1;
      }

      // 缓存页码信息
      cachePageInfo.current.currentPage = nextPage;
    }

    console.log("switch paage: ", cachePageInfo.current);

    startRequestLayout();
  };
  
  const onLogin = (e: any) => {
    const { phone, password } = e;

    xyRTC.current.login(phone, password);
  };

  const onExternalLogin = (e: any) => {
    const { extID, extUserId, displayName } = e;

    xyRTC.current.loginExternalAccount(extID, extUserId, displayName);
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

    xyRTC.current.endCall();
  };

  const mackCall = () => {
    // 登录&连接服务器成功，可以入会
    const { meeting, meetingPassword, meetingName } = info;

    if (!meeting || !meetingName) {
      message.info('请填写入会信息');
      return;
    }

    const result = xyRTC.current.makeCall(meeting, meetingPassword, meetingName);

    if (result.code === 3002) {
      message.info('请登录后发起呼叫');
    } else {
      setStatus('calling');
    }
  };

  const stopShareContent = () => {
    xyRTC.current.stopSendContent();
  };

  const shareContent = () => {
    xyRTC.current.startSendContent();
  };

  // 开启/关闭摄像头
  const videoOperate = () => {
    if (video === 'unmuteVideo') {
      setVideo('muteVideo');

      xyRTC.current.muteCamera(true);
    } else {
      setVideo('unmuteVideo');
      xyRTC.current.muteCamera(false);
    }
  };

  // 切换layout
  const switchLayout = () => {
    xyRTC.current.switchLayout();
  };

  // mic 操作
  const audioOperate = () => {
    if (audio === 'unmute') {
      setAudio('mute');
      message.info('麦克风已静音');

      xyRTC.current.muteMic(true);
    } else {
      setAudio('unmute');
      xyRTC.current.muteMic(false);
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

  const switchModel = (val: TModel) => {
    console.log("val: ", val);
    store.set("xyLayoutModel", val);
    setModel(val);

    ipcRenderer.send("relaunch", val);
  };

  const onLogout = () => {
    xyRTC.current.logout();
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
            item={val}
            xyRTC={xyRTC.current}
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
            <div
                onClick={() => {
                  switchPage("previous");
                }}
                className="button layout"
              >
                <div className="icon"></div>
                <div className="title">上一页（{pageInfo.currentPage}）</div>
              </div>

              <div
                onClick={() => {
                  switchPage("next");
                }}
                className="button layout"
              >
                <div className="icon"></div>
                <div className="title">下一页</div>
              </div>

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

              <div onClick={settingProxy} className="button setting">
                  <div className="icon"></div>
                  <div className="title">设置</div>
              </div>
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
    <div className="container" id="container">
      <div>
        <div className="login">
        <h1 className="xy__demo-title"> XY ELECTRON DEV </h1>
          <div className="xy__demo-line">
            <div>
              <span>{env} 环境</span>
              <span onClick={settingProxy} className="xy_setting">
                [设置]
              </span>
            </div>

            <div style={{ marginLeft: "20px" }}>
              <span>布局模式：</span>
              <Select value={model} onChange={switchModel}>
                <Option value="auto">自动布局</Option>
                <Option value="custom">自定义布局</Option>
              </Select>
            </div>
          </div>

          <SettingModal
            visible={setting}
            value={proxy}
            xyRTC={xyRTC.current}
            deviceChangeType={deviceChangeType}
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
