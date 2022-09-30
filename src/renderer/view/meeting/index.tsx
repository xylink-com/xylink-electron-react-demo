import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { message, Modal } from 'antd';
import { ipcRenderer } from 'electron';
import XYRTC from '@/utils/xyRTC';
import cloneDeep from 'clone-deep';
import store from '@/utils/store';
import {
  DEFAULT_LOGIN_INFO,
  DEFAULT_PAGE_INFO,
  DEFAULT_CONF_INFO,
  LOCAL_VIEW_ID,
  RECORD_STATE_MAP,
  DEFAULT_MEETING_INFO,
} from '@/enum';
import { KICK_OUT_MAP, SDK_ERROR_MAP } from '@/enum/error';
import { TEMPLATE } from '@/utils/template';
import { isMac } from '@/utils/index';
import { getScreenInfo } from '@/utils/layout';
import { MeetingStatus, ITemplateModel } from '@/type/enum';
import { useMagicMouse } from '@/utils/magicMouse';
import Video from '../components/Video';
import Barrage from '../components/Barrage';
import InOutReminder from '../components/InOutReminder';
import MeetingHeader from '../components/Header';
import MeetingLoading from '../components/Loading';
import SVG from '@/components/Svg';
import AppHeader from '@/components/Header';
import AudioButton from '../components/AudioButton';
import Hold from '../components/Hold';
import VideoButton from '../components/VideoButton';
import More from '../components/More';
import PromptInfo from '../components/PromptInfo';
import SettingModal from '../components/Modal';
import EndCall from '../components/EndCall';
import { IAudio } from '@/type';
import {
  IAudioStatus,
  ICallState,
  IConfControl,
  IConferenceInfo,
  IConfInfo,
  IHowlingDetected,
  IInOutReminder,
  IOnHoldInfo,
  IScreenInfo,
  ISubTitle,
  ILayout,
  ITokenInfo,
  IAIFaceRecv,
  IAIFaceInfo,
  IRecordNotification,
  IRecordStateChange,
  IRestApiResult,
  IConfHost,
  IReqObj,
  LayoutModel,
  CallMode,
} from '@xylink/xy-electron-sdk';
import {
  callModeState,
  callState,
  deviceChangeState,
  faceTypeState,
  settingInfoState,
  toolbarState,
  videoState,
} from '@/utils/state';

import './index.scss';

const { confirm } = Modal;

function Meeting() {
  const xyRTC = useRef(XYRTC);
  const cachePageInfo = useRef(DEFAULT_PAGE_INFO);
  const cacheConfInfo = useRef(DEFAULT_CONF_INFO);
  const cacheScreenInfo = useRef({
    rateWidth: 0,
    rateHeight: 0,
  });
  const layoutRef = useRef<ILayout[]>([]);

  const [conferenceInfo, setConferenceInfo] =
    useState<IConferenceInfo>(DEFAULT_MEETING_INFO);
  const [screenInfo, setScreenInfo] = useState<IScreenInfo>({
    layoutWidth: 0,
    layoutHeight: 0,
  });
  const [layout, setLayout] = useState<ILayout[]>([]);
  const [audio, setAudio] = useState<IAudio>(() => {
    return store.get('xyMeetingInfo').muteAudio ? 'mute' : 'unmute';
  });
  const [video, setVideo] = useRecoilState(videoState);
  const [disableAudio, setDisableAudio] = useState(false);
  const [handStatus, setHandStatus] = useState(false);
  const [shareContentStatus, setShareContentStatus] = useState(0);
  const [disableContent, setDisableContent] = useState(false);
  const [pageInfo, setPageInfo] = useState(DEFAULT_PAGE_INFO);
  const [subTitle, setSubTitle] = useState<ISubTitle | null>(null);
  const [inOutReminder, setInOutReminder] = useState<IInOutReminder[]>([]);
  const [facePositionInfo, setFacePositionInfo] = useState(new Map()); // AI Face 位置信息
  const [faceInfo, setFaceInfo] = useState(new Map()); // AI Face 人脸信息
  const [forceFullScreenId, setForceFullScreenId] = useState('');
  const [templateModel, setTemplateModel] = useState<ITemplateModel>(
    ITemplateModel.SPEAKER
  );
  // 自己开启录制的状态
  const [recordStatus, setRecordStatus] = useState(RECORD_STATE_MAP.idel);
  // 其它端是否录制暂停中
  const [isRecordPaused, setIsRecordPaused] = useState(false);
  // 录制权限相关
  const [recordPermission, setRecordPermission] = useState({
    isStartRecord: false, // 是否已经开启录制，我们真正需要的是远端是否开启录制
    canRecord: true, // 录制开关
    confCanRecord: true, // 会控中开启关闭录制权限
  });
  // 会议人数信息
  const [confInfo, setConfInfo] = useState<IConfInfo>(DEFAULT_CONF_INFO);
  // 等候室信息
  const [holdInfo, setHoldInfo] = useState<IOnHoldInfo>({
    isOnhold: false,
  });
  // 会控下发主会场
  const [chirmanUri, setChirmanUri] = useState('');
  // 是否是主持人
  const [confHost, setConfHost] = useState({meetingId:"", isHost: false});
  // 会议状态
  const [meetingState, setMeetingState] = useRecoilState(callState);
  // Toolbar显示隐藏状态
  const [toolbarVisible, setToolVisible] = useRecoilState(toolbarState);
  // 设置页面信息
  const settingInfo = useRecoilValue(settingInfoState);
  const setFaceType = useSetRecoilState(faceTypeState);
  const setCallMode = useSetRecoilState(callModeState);
  const setDeviceChangeType = useSetRecoilState(deviceChangeState);

  const facePositionInfoRef = useRef(new Map()); // AI Face 位置信息
  const faceInfoRef = useRef(new Map()); // AI Face 人脸信息
  const faceInfoTimerRef = useRef(new Map()); // 定时清理 Face信息

  useMagicMouse();

  const navigate = useNavigate();

  useEffect(() => {
    // mac
    ipcRenderer.send('resizable', true);

    return () => {
      ipcRenderer.send('exit-fullscreen');
      ipcRenderer.send('resizable', false);
    };
  }, []);

  useEffect(() => {
    setVideo(
      store.get('xyMeetingInfo').muteVideo ? 'muteVideo' : 'unmuteVideo'
    );

    xyRTC.current.setLogLevel('INFO');

    // 呼叫状态
    xyRTC.current.on('CallState', (e: ICallState) => {
      console.log('call state e: ', e, meetingState);
      const { state, reason, error } = e;

      if (state === 'Connected') {
        if (meetingState !== MeetingStatus.MEETING) {
          setMeetingState(MeetingStatus.MEETING);

          setVideo(
            store.get('xyMeetingInfo').muteVideo ? 'muteVideo' : 'unmuteVideo'
          );
        }
      } else if (state === 'Disconnected') {
        if (error !== 'XYSDK:969001') {
          message.info(SDK_ERROR_MAP[error] || reason);
        } else {
          message.info(reason);
        }

        hangup(false);
      }
    });

    // 云会议室信息
    xyRTC.current.on('ConferenceInfo', (e: IConferenceInfo) => {
      console.log('conference info:', e);

      setConferenceInfo(e);
    });

    // 等候室信息
    xyRTC.current.on('OnHold', (e: IOnHoldInfo) => {
      setHoldInfo(e);
    });

    // 切换布局
    xyRTC.current.on('TemplateModelChanged', (e: ITemplateModel) => {
      console.log('TemplateModelChanged: ', e);
      setTemplateModel(e);
    });

    xyRTC.current.on('VideoStreams', (e: ILayout[]) => {
      const { model } = settingInfo;

      if (model === LayoutModel.CUSTOM) {
        // 每次推送都会携带local数据，如果分页不需要展示，则移除local数据
        if (cachePageInfo.current.currentPage !== 0) {
          const localIndex = e.findIndex(
            (item: ILayout) => item.sourceId === LOCAL_VIEW_ID
          );

          if (localIndex >= 0) {
            e.splice(localIndex, 1);
          }
        }

        const nextTemplateRate = TEMPLATE.GALLERY.rate[e.length] || 0.5625;
        // 此处无id是container的容器，则使用document.body的size计算screen
        cacheScreenInfo.current = getScreenInfo(
          'container',
          nextTemplateRate,
          [92, 0]
        );

        const nextLayout = calculateBaseLayoutList(e);

        console.log('nextLayout:', nextLayout);

        layoutRef.current = nextLayout;
        setLayout(nextLayout);
      } else {
        const nextLayout = cloneDeep(e);

        layoutRef.current = nextLayout;
        setLayout(nextLayout);
      }
    });

    xyRTC.current.on('ScreenInfo', (e: IScreenInfo) => {
      setScreenInfo(e);
    });

    xyRTC.current.on('ForceFullScreen', (id: string) => {
      console.log('Event forceFullScreen id:', id);
      setForceFullScreenId(id);
    });

    xyRTC.current.on('KickOut', (e: string) => {
      console.log('demo get kick out message: ', e);

      endMeeting();

      onLogout();

      message.info(`${KICK_OUT_MAP[e] || '未知异常，重新登录'}`);
    });

    xyRTC.current.on('ContentState', (e: number) => {
      if (e === 1) {
        message.info(`您正在分享Content内容`);
      } else if (e === 0) {
        message.info(`已结束分享内容`);
      }

      setShareContentStatus(e);
    });

    // 麦克风/摄像头设备变化事件
    xyRTC.current.on('MediaDeviceEvent', (value: string) => {
      console.log('device change type:', value);

      setDeviceChangeType(value);
    });

    // 会议控制消息
    // 可以通过此消息获取：会控播放地址/主会场callUri/麦克风状态/是否是强制静音麦克风
    // 自定义布局模式下，主会场callUri需要记录下来，后续requestLayout计算需要使用
    xyRTC.current.on('ConfControl', (e: IConfControl) => {
      console.log('meeting control message: ', e);

      const { disableMute, disableContent, disableRecord, chirmanUri } = e;

      // 强制静音
      setDisableAudio(disableMute);

      // 共享权限
      setDisableContent(disableContent);

      // 会控控制录制权限
      setRecordPermission((permission) => ({
        ...permission,
        confCanRecord: !disableRecord,
      }));
      // 会控触发主会场
      setChirmanUri(chirmanUri);
    });

    // 会控取消举手 回调
    xyRTC.current.on('ConfHandupCancelled', () => {
      setHandStatus(false);
    });

    // local 音频状态
    xyRTC.current.on('AudioStatusChanged', (e: IAudioStatus) => {
      const { muteMic } = e;

      if (muteMic === 'mute') {
        setAudio('mute');
      } else if (muteMic === 'unmute') {
        setAudio('unmute');
      }
    });

    // 会议信息发生变化，会推送此消息，开始计算请求layout
    xyRTC.current.on('ConfInfoChanged', (e: IConfInfo) => {
      console.log('react conf info change:', e);

      setConfInfo(e);

      const { model } = settingInfo;

      if (model === LayoutModel.AUTO) {
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

      console.log('next page info: ', nextPageInfo);

      // 缓存页码信息
      cachePageInfo.current = nextPageInfo;

      startRequestLayout();
    });

    //  是否检测到啸叫
    xyRTC.current.on('HowlingDetected', (e: IHowlingDetected) => {
      console.log('HowlingDetected:', e);
      if (e) {
        message.info('已检测到回声，可能您离终端太近!');
      }
    });

    // 字幕
    xyRTC.current.on('SubTitle', (e: ISubTitle) => {
      setSubTitle(e);
    });

    // 出入会
    xyRTC.current.on('InOutReminder', (e: IInOutReminder[]) => {
      setInOutReminder(e);
    });

    xyRTC.current.on('SDKError', (e: string) => {
      console.log('sdk error: ', e);
    });

    // token
    xyRTC.current.on('RefreshTokenResult', (e: ITokenInfo) => {
      console.log('RefreshTokenResult:', e);
    });

    // 人脸坐标消息
    xyRTC.current.on('AIFaceRecv', (e: IAIFaceRecv) => {
      const { calluri, positionArr = [] } = e || {};

      const faceIds: number[] = [];

      // 获取人脸信息(名称等)
      positionArr.forEach((position) => {
        if (position.faceId > -1) {
          const info = faceInfoRef.current.get(position.faceId);

          if (!info) {
            faceIds.push(position.faceId);
          }
        }
      });

      if (faceIds.length > 0) xyRTC.current.getFaceInfo(faceIds);

      // 设置人脸位置信息
      facePositionInfoRef.current.set(calluri, e);

      setFacePositionInfo(new Map(facePositionInfoRef.current));

      // 定时清理
      updateFaceTimer(calluri);
    });

    // getFaceInfo 对应的 人脸具体信息
    xyRTC.current.on('AIFaceInfo', (e: IAIFaceInfo[]) => {
      e.forEach((info) => {
        faceInfoRef.current.set(info.userId, info);
      });

      setFaceInfo(new Map(faceInfoRef.current));
    });

    // 会控下发 关闭摄像头操作
    xyRTC.current.on('MeetingMuteQuery', () => {
      message.info('主持人已关闭您的摄像头');

      setVideo('muteVideo');
      xyRTC.current.muteCamera(true);
    });

    // 别人开启或关闭云端录制
    xyRTC.current.on('RecordStatusNotification', (e: IRecordNotification) => {
      // 是否已经开启录制
      setRecordPermission((permission) => ({
        ...permission,
        isStartRecord: e.isStart,
      }));

      if (e.status) {
        // 这种是是录制状态改变暂停或录制中，可以是本地或者远端
        // RECORDING_STATE_ACTING/RECORDING_STATE_PAUSED
        setIsRecordPaused(e.status === 'RECORDING_STATE_PAUSED');
      }
    });

    // 自己开启录制状态改变
    xyRTC.current.on('RecordingStateChanged', (e: IRecordStateChange) => {
      // 本地开启关闭录制后，RecordStatusNotification没有最后一次上报，因此只能手动处理了
      // RecordingStateChanged触发，远端肯定没有开启录制
      setRecordPermission((permission) => ({
        ...permission,
        isStartRecord: false,
      }));

      // 本地开启关闭录制后，RecordStatusNotification没有最后一次上报，因此只能手动处理了
      // RecordingStateChanged触发，远端肯定没有录制暂停
      setIsRecordPaused(false);

      if (e.reason === 'XYSDK:963902') {
        setRecordPermission((permission) => ({
          ...permission,
          canRecord: false,
        }));

        return;
      }

      setRecordStatus(e.recordState);

      if (e.reason !== 'STATE:200') {
        message.info(e.message);
        return;
      }

      if (e.recordState === RECORD_STATE_MAP.idel) {
        message.info('云端录制完成，录制视频已保存到云会议室管理员的文件夹中');
      }
    });

    // 自己开启录制状态改变
    xyRTC.current.on('PageInfo', (e: any) => {
      console.log('PageInfo: ', e);
      setPageInfo(e);
    });

    // 上传日志 结果 上报
    xyRTC.current.on('LogUploadResult', (e: IRestApiResult) => {
      console.log('LogUploadResult:', e);
    });

    // 会控主持人回调
    xyRTC.current.on('ConfHostChanged', (e: IConfHost) => {
      console.log('ConfHostChanged:', e);

      setConfHost(e);
    });

    return () => {
      // 移除监听事件
      xyRTC.current.removeAllListeners();
    };
  }, []);

  const disableRecord = useMemo(() => {
    const { isStartRecord, canRecord, confCanRecord } = recordPermission;

    // RecordStatusNotification上报时，isStartRecord可能是本地录制的状态，而我们只关心远端是否开启录制，因此
    // 用(isStartRecord && recordStatus !== RECORD_STATE_MAP.acting) 判断远端是否开启了录制
    if (
      (isStartRecord && recordStatus !== RECORD_STATE_MAP.acting) ||
      !canRecord ||
      !confCanRecord
    ) {
      return true;
    }

    if (
      ![RECORD_STATE_MAP.idel, RECORD_STATE_MAP.acting].includes(recordStatus)
    ) {
      return true;
    }

    return false;
  }, [recordPermission, recordStatus]);

  const disabledPage = useMemo(() => {
    if (settingInfo.model === LayoutModel.CUSTOM) {
      return false;
    }

    const { participantCount, chairManUrl } = confInfo;
    const localLayout = layout.find((item) => item.sourceId === LOCAL_VIEW_ID);
    const isRemoteManUrl =
      chairManUrl && chairManUrl !== localLayout?.roster.callUri;
    // 1. 主会场出现 2. local+远端content 3. 本地共享content 4. 只有一个人
    return shareContentStatus === 1 || isRemoteManUrl || participantCount === 1;
  }, [shareContentStatus, confInfo, layout, settingInfo.model]);

  // content详情
  const contentInfo = useMemo(() => {
    const { contentPartCount } = confInfo;
    if (contentPartCount < 1) {
      return null;
    }

    return layout.find((item) => item.roster.isContent);
  }, [confInfo, layout]);

  const onMouseEnter = () => {
    setToolVisible((state) => ({
      ...state,
      enableHidden: false,
    }));
  };

  const onMouseLeave = () => {
    setToolVisible((state) => ({
      ...state,
      enableHidden: true,
    }));
  };
  // 定时清理face position
  const updateFaceTimer = (calluri: string) => {
    let timer = faceInfoTimerRef.current.get(calluri);

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      facePositionInfoRef.current?.delete(calluri);
      faceInfoTimerRef.current?.delete(calluri);

      setFacePositionInfo(new Map(facePositionInfoRef.current));
    }, 3000);

    faceInfoTimerRef.current.set(calluri, timer);
  };

  const clearFaceTimer = () => {
    for (const [key, value] of faceInfoTimerRef.current) {
      if (value) clearTimeout(value);
      if (key) faceInfoTimerRef.current?.delete(key);
    }
  };

  const calculateBaseLayoutList = (list: ILayout[]) => {
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

    const layoutList = list.map((item, index: number) => {
      const [x, y, w, h] = positionInfo[index].position;
      const layoutX = Math.round(rateWidth * x);
      const layoutY = Math.round(rateHeight * y);
      const layoutWidth = Math.round(rateWidth * w);
      const layoutHeight = Math.round(rateHeight * h);

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
    // resolution: 0:90, 1: 180, 2:360, 3: 720, 4: 1080
    // quality: 0: low, 1: normal, 2: high
    const {
      contentPartCount = 0,
      participantCount = 0,
      chairManUrl = '',
    } = cacheConfInfo.current;
    const { maxSize, currentPage } = cachePageInfo.current;
    const reqList: IReqObj[] = [];
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
        callUri: '',
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
      const endSize = (page + 1) * maxSize;
      // 如果最大的size大于成员总数，那么就以成员总数为结尾
      const realSize = participantCount >= endSize ? endSize : participantCount;

      for (i; i < realSize; i++) {
        if (reqList.length === 0 && currentPage === 0) {
          reqList.push({
            isContent: false,
            callUri: '',
            resolution: 3,
            quality: 1,
          });
        } else {
          reqList.push({
            isContent: false,
            callUri: '',
            resolution: 1,
            quality: 0,
          });
        }
      }
    }

    console.log('custom request layout: ', reqList);

    // 更新页码信息
    setPageInfo({ ...cachePageInfo.current });

    xyRTC.current.requestLayout(reqList, maxSize, currentPage);
  };

  const switchPage = (type: string) => {
    console.log('cachePageInfo.current: ', cachePageInfo.current);
    const { currentPage, totalPage } = cachePageInfo.current;
    let nextPage = currentPage;
    const { model } = settingInfo;

    if (model === LayoutModel.AUTO) {
      const currentPage = pageInfo.currentPage;
      const targetPage =
        type === 'next'
          ? currentPage + 1
          : type === 'previous'
          ? currentPage - 1
          : type === 'home'
          ? 0
          : type;

      xyRTC.current.switchPage(targetPage).then(
        (res: any) => console.log('switch page success: ', res),
        (err: any) => console.log('switch page fail: ', err)
      );

      return;
    }

    if (type === 'next') {
      if (currentPage + 1 > totalPage) {
        message.info('已经在最后一页啦');
        return;
      } else {
        nextPage = currentPage + 1;
      }

      // 缓存页码信息
      cachePageInfo.current.currentPage = nextPage;
    } else if ('previous') {
      if (currentPage - 1 < 0) {
        message.info('已经在首页啦');
        return;
      } else {
        nextPage = currentPage - 1;
      }

      // 缓存页码信息
      cachePageInfo.current.currentPage = nextPage;
    }

    console.log('switch page: ', cachePageInfo.current);

    startRequestLayout();
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
        // onCancel() { },
      });
    } else {
      endMeeting();
    }
  };

  const appCloseHandler = () => {
    confirm({
      title: '退出会议',
      content: '关闭窗口会退出会议，是否确认？',
      cancelText: '取消',
      okText: '确定',
      centered: true,
      onOk() {
        endMeeting();
      },
      // onCancel() { },
    });
  };

  const endMeeting = () => {
    setAudio('mute');
    setVideo('muteVideo');
    setMeetingState(MeetingStatus.CALLING);
    setLayout([]);
    setPageInfo(DEFAULT_PAGE_INFO);
    setInOutReminder([]);
    setSubTitle(null);
    setTemplateModel(ITemplateModel.SPEAKER);
    setFaceType('');
    setCallMode(CallMode.AudioVideo);
    setHandStatus(false);
    setDeviceChangeType('');

    facePositionInfoRef.current = new Map();
    faceInfoRef.current = new Map();

    setConferenceInfo(DEFAULT_MEETING_INFO);
    setFacePositionInfo(facePositionInfoRef.current);
    setFaceInfo(faceInfoRef.current);

    // 重置录制状态
    setIsRecordPaused(false);
    setRecordStatus(RECORD_STATE_MAP.idel);
    setRecordPermission({
      isStartRecord: false,
      canRecord: true,
      confCanRecord: true,
    });

    clearFaceTimer();

    xyRTC.current.endCall();

    // 关闭会控弹框
    ipcRenderer.send('meetingControlWin', false);

    ipcRenderer.send('exit-fullscreen');

    navigate('/join');

    ipcRenderer.removeAllListeners('domReady');
    ipcRenderer.removeAllListeners('secondWindow');
    ipcRenderer.removeAllListeners('currentWindowId');
  };

  const stopShareContent = () => {
    xyRTC.current.stopSendContent();
  };

  const shareContent = () => {
    if (disableContent) {
      message.info('没有双流分享权限');
      return;
    }

    const withDesktopAudio = store.get('xyWithDesktopAudio');

    xyRTC.current.startSendContent(withDesktopAudio);
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

  // 开始/停止录制
  const recordOperate = () => {
    if (disableRecord) {
      return;
    }

    if (recordStatus === RECORD_STATE_MAP.idel) {
      xyRTC.current.startCloudRecord();
    } else if (recordStatus === RECORD_STATE_MAP.acting) {
      xyRTC.current.stopCloudRecord();
    }
  };

  // 切换layout
  const switchLayout = async () => {
    try {
      const result = await xyRTC.current.switchLayout();
      console.log('switchLayout success: ', result);

      // setTemplateModel(result);
    } catch (err: any) {
      console.log('switchLayout fail: ', err);
      message.info(err?.msg || '切换失败');
    }
  };

  const onLogout = () => {
    xyRTC.current.logout();

    store.set('xyLoginInfo', DEFAULT_LOGIN_INFO);

    navigate('/');
  };

  const setForceFullScreen = async (id = '') => {
    try {
      xyRTC.current.forceFullScreen(id);
    } catch (error) {
      console.log('强制全屏error: ', error);
    }
  };

  const toggleForceFullScreen = (id: string) => {
    // 分页大于1，即使只显示一个画面，也可以全屏
    if (
      layout.length === 1 &&
      pageInfo.currentPage <= 1 &&
      !forceFullScreenId
    ) {
      return;
    }

    setForceFullScreen(forceFullScreenId ? '' : id);
  };

  const openMeetingControlWin = () => {
    // 会控链接
    const { members } = xyRTC.current.getConfMgmtUrl();

    const conferenceInfo = store.get('xyMeetingInfo');
    const { meetingNumber = '' } = conferenceInfo || {};

    if (members) {
      ipcRenderer.send('meetingControlWin', { url: members, meetingNumber });
    }
  };

  const renderLayout = () => {
    const layoutLen = layout.length;
    const hasContent = layout.find((item) => item.roster.isContent);
    const count = layoutLen - (hasContent ? 1 : 0);

    return layout.map((val, index) => {
      if (val) {
        const { isContent, callUri } = val.roster;
        const mediaGroupId = isContent ? 1 : 0;
        const key = callUri + mediaGroupId;

        const positionInfo = facePositionInfo.get(callUri);

        // 非对称布局 ， 大屏显示 人脸信息
        // 对称布局，最多四画面显示 人脸信息, 会中5人以上，有一人content only,或将一人onHold变为4人需识别
        const isShowFaceInfo =
          (templateModel === 'SPEAKER' &&
            (layoutLen > 1 ? index === 1 : true)) ||
          (templateModel === 'GALLERY' && count < 5);

        return (
          <Video
            key={key}
            index={key}
            item={val}
            templateModel={templateModel}
            isShowFaceInfo={isShowFaceInfo}
            faceInfo={faceInfo}
            facePositionInfo={positionInfo}
            toggleForceFullScreen={() => toggleForceFullScreen(val.id)}
          ></Video>
        );
      }

      return null;
    });
  };

  const renderMeeting = () => {
    const { layoutWidth, layoutHeight } = screenInfo;
    const layoutStyle = {
      width: `${layoutWidth}px`,
      height: `${layoutHeight}px`,
    };

    if (meetingState === 'meeting') {
      return (
        <>
          <div className="meeting-content">
            <PromptInfo
              recordPermission={recordPermission}
              isRecordPaused={isRecordPaused}
              recordStatus={recordStatus}
              forceFullScreenId={forceFullScreenId}
              setForceFullScreen={setForceFullScreen}
              isLocalShareContent={shareContentStatus === 1}
              chirmanUri={chirmanUri}
              content={contentInfo}
            />

            {!disabledPage && (
              <div className="previous-box">
                {pageInfo.currentPage > 0 && (
                  <div
                    className="previous-button"
                    onClick={() => {
                      switchPage('previous');
                    }}
                  >
                    <SVG icon="previous" />
                  </div>
                )}
                {pageInfo.currentPage > 1 && (
                  <div
                    className="home-button"
                    onClick={() => {
                      switchPage('home');
                    }}
                  >
                    回首页
                  </div>
                )}
              </div>
            )}

            {!disabledPage && pageInfo.currentPage < pageInfo.totalPage && (
              <div className="next-box">
                <div
                  className="next-button"
                  onClick={() => {
                    switchPage('next');
                  }}
                >
                  <SVG icon="next" />
                  {pageInfo.totalPage > 1 && pageInfo.currentPage > 0 && (
                    <div className="page-number">
                      {pageInfo.currentPage} /
                      {pageInfo.totalPage > 100 ? '...' : pageInfo.totalPage}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="meeting-layout" style={layoutStyle}>
              {renderLayout()}
            </div>

            {subTitle && <Barrage subTitle={subTitle} />}

            <InOutReminder reminders={inOutReminder} />
          </div>

          <div
            className="meeting-footer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div
              className={`middle ${toolbarVisible.show ? 'visible' : 'hidden'}`}
            >
              <More />

              <div onClick={openMeetingControlWin} className={`button host`}>
                <SVG icon="meeting_host" />
                <div className="title">
                {confHost?.isHost ? '主持会议' : '参会者'}
                </div>
                <div className="tag">{confInfo?.visibleEpCount || 1}</div>
              </div>

              {shareContentStatus === 1 ? (
                <div
                  onClick={stopShareContent}
                  className="button button-warn share-stop"
                >
                  <SVG icon="share_stop" type="danger" />
                  <div className="title">结束共享</div>
                </div>
              ) : (
                <div onClick={shareContent} className="button share">
                  <SVG icon="share" />
                  <div className="title">共享</div>
                </div>
              )}

              <div onClick={switchLayout} className="button layout">
                <SVG icon="layout" />
                <div className="title">窗口布局</div>
              </div>

              <div
                onClick={recordOperate}
                className={`button ${
                  recordStatus === RECORD_STATE_MAP.acting
                    ? 'pause_record'
                    : 'record'
                } ${disableRecord ? 'disabled-button' : ''}`}
              >
                <SVG
                  icon={
                    recordStatus === RECORD_STATE_MAP.acting
                      ? 'record_stop'
                      : 'record'
                  }
                />
                <div className="title">
                  {recordStatus === RECORD_STATE_MAP.acting
                    ? '停止录制'
                    : '开始录制'}
                </div>
              </div>

              <div className="line" />

              <VideoButton video={video} videoOperate={videoOperate} />

              <AudioButton
                audio={audio}
                disableAudio={disableAudio}
                handStatus={handStatus}
                setHandStatus={setHandStatus}
              />

              <EndCall
                stopMeeting={() => {
                  hangup(false);
                }}
              />
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="container" id="container">
      <AppHeader
        className={`meeting-header-wrapper ${
          isMac ? (toolbarVisible.show ? 'visible' : 'hidden') : ''
        }`}
        appCloseHandler={appCloseHandler}
      >
        {meetingState === MeetingStatus.MEETING && (
          <MeetingHeader conferenceInfo={conferenceInfo} holdInfo={holdInfo} />
        )}
      </AppHeader>

      {meetingState === MeetingStatus.CALLING && (
        <MeetingLoading conferenceInfo={conferenceInfo} stopMeeting={hangup} />
      )}

      {holdInfo?.isOnhold && (
        <Hold conferenceInfo={conferenceInfo} stopMeeting={hangup} />
      )}

      {!holdInfo?.isOnhold && renderMeeting()}

      <SettingModal />
    </div>
  );
}

export default Meeting;
