import React, { useState, useRef, useEffect } from 'react';
import { ILayout, XYSlaveRTC } from '@xylink/xy-electron-sdk';
import Video from '../components/Video';
import { ipcRenderer } from 'electron';
import cloneDeep from 'clone-deep';
import { TEMPLATE } from '@/utils/template';
import { getScreenInfo } from '@/utils/layout';
import SVG from '@/components/Svg';
import AppHeader from '@/components/Header';
import { isDevelopment } from '@/utils';

function SlaveScreen() {
  const xyRTC = useRef<XYSlaveRTC | null>(null);
  const layoutRef = useRef<ILayout[]>([]);
  const localInfoRef = useRef(null);
  const cacheScreenInfo = useRef({
    rateWidth: 0,
    rateHeight: 0,
  });

  const [layout, setLayout] = useState<ILayout[]>([]);
  const [screenInfo, setScreenInfo] = useState({
    layoutWidth: 0,
    layoutHeight: 0,
  });

  useEffect(() => {
    initMainWindowEvent();

    console.log('start init start： ', XYSlaveRTC);

    xyRTC.current = XYSlaveRTC.getXYInstance({
      // 动态设置环境，当构建正式包时，dll从当前程序的dll目录加载，dev开发时，从sdk目录加载

      dllPath:
        isDevelopment
          ? '../cpp_sdk/win32/dll'
          : './dll',
    });

    xyRTC.current?.setLogLevel('NONE');

    // 此处收到videoStreams回调是因为主窗口启动了外接屏幕渲染模式
    // 启动之后，requestLayout请求远端视频流时，需要携带外接屏幕deviceId
    // 指定deviceId之后，返回的视频流会通过底层跨渲染进行传输到外接屏幕下，直接通过Video组件调用setVideoRender渲染即可；
    // 注意：此处数据不包含Local数据，当前的做法是通过主窗口ipcRenderer传递到外接窗口下，然后合并数据显示画面；
    xyRTC.current?.on('VideoStreams', (e: ILayout[]) => {
      console.log('demo get video streams: ', e);

      layoutRef.current = e;
      createLayout();
    });

    console.log('xyRTC.current: ', xyRTC.current);

    startSlave();
  }, []);

  const initMainWindowEvent = () => {
    // 接收主窗口推送的local roster信息
    // 此处缓存local信息，并配合videoStreams回调返回所有远端信息计算最新的layout数据，并渲染画面
    ipcRenderer.on('localInfo', onLocalInfo);

    // 监听外接屏幕关闭事件，当关闭后，需要销毁所有资源和事件
    ipcRenderer.on('closedExternalWindow', onClosedExternalWindow);
  };

  const onLocalInfo = (event: any, msg: any) => {
    console.log('local layout info: ', msg);

    localInfoRef.current = msg;
    createLayout();
  };

  const onClosedExternalWindow = (event: any, msg: any) => {
    console.log('close external window...');

    closeExternalScreen();
  };

  const createLayout = () => {
    const layoutList = cloneDeep(layoutRef.current);
    const localInfo = localInfoRef.current;

    // 将local数据补充到layoutList的首位，通过模板动态创建布局画面
    localInfo && layoutList.unshift(localInfo);

    const nextTemplateRate = TEMPLATE.GALLERY.rate[layoutList.length] || 0.5625;
    // 第一个参数为空，会使用document.body的size计算screen信息，如需指定elementId，配置第一个参数即可
    cacheScreenInfo.current = getScreenInfo('', nextTemplateRate, [92, 0]);
    const nextLayout = calculateBaseLayoutList(layoutList);

    console.log('nextLayout:', nextLayout);

    setLayout(nextLayout);
  };

  const calculateBaseLayoutList = (list: ILayout[]): ILayout[] => {
    const { rateHeight, rateWidth } = cacheScreenInfo.current;

    setScreenInfo({
      layoutHeight: rateHeight,
      layoutWidth: rateWidth,
    });

    let positionStyle = {
      left: '0px',
      top: '0px',
      width: '0px',
      height: '0px',
    };
    const positionInfo = TEMPLATE.GALLERY.temp[list.length];

    const layoutList = list.map((item, index) => {
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

  const closeExternalScreen = () => {
    console.log('close external screen in ex');

    xyRTC.current?.stopSlave();
    setLayout([]);
    ipcRenderer.removeListener('localInfo', onLocalInfo);
    ipcRenderer.removeListener('closedExternalWindow', onClosedExternalWindow);
  };

  const onStopSlave = async () => {
    // 通知主进程关闭外接屏幕窗口，由主进程统一向主窗口和副窗口发送关闭事件，销毁资源
    ipcRenderer.send('closeExternalWindow', true);
  };

  const startSlave = () => {
    console.log('startSlave');
    // 注册副屏窗口，deviceID可以自行指定
    // 指定后，在主sdk上可以收到外接屏幕事件，之后可以在请流时，reqList列表数据中指定deviceId即可在副屏接收到视频流videoStreams回调
    xyRTC.current?.startSlave({ deviceID: 'ex_screen_1' });
  };

  const layoutStyle = React.useMemo(() => {
    const { layoutWidth, layoutHeight } = screenInfo;

    return {
      width: `${layoutWidth}px`,
      height: `${layoutHeight}px`,
    };
  }, [screenInfo]);

  const renderLayout = () => {
    return (
      layout &&
      layout.map((val) => {
        if (val) {
          const { isContent, callUri } = val.roster;
          const mediagroupid = isContent ? 1 : 0;
          const key = callUri + mediagroupid;

          // 所有远端数据，通过xyRendererRTC自动处理画面播放
          // local画面单独处理，需要监听ipc传递过来的yuv数据手动渲染
          return (
            <Video
              key={key}
              index={key}
              item={val}
              xyRTC={xyRTC.current!}
              isExternalDrawLocalVideo={val.isLocal}
            ></Video>
          );
        }

        return null;
      })
    );
  };

  return (
    <div>
      <AppHeader isOpt = {false} className="meeting-header">
        <span>副屏窗口</span>
      </AppHeader>

      <div className="meeting-content">
        <div className="meeting-layout" style={layoutStyle}>
          {renderLayout()}
        </div>
      </div>

      <div className="meeting-footer">
        <div className="right">
          <div className="button button-warn" onClick={onStopSlave}>
            <SVG icon="end_call" type="danger" />
            <div className="title">关闭</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlaveScreen;
