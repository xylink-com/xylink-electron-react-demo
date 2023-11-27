import { useState, useEffect, useRef, useMemo } from 'react';
import { message, Modal } from 'antd';
import XYRTC from '@/utils/xyRTC';
import cloneDeep from 'clone-deep';
import store from '@/utils/store';
import {
  DEFAULT_LOGIN_INFO,
  DEFAULT_PAGE_INFO,
  DEFAULT_CONF_INFO,
  LOCAL_VIEW_ID,
  DEFAULT_MEETING_INFO,
  SUCCESS_CODE,
} from '@/enum';
import { KICK_OUT_MAP, SDK_ERROR_MAP } from '@/enum/error';
import Video from '../components/Video';
import Barrage from '../components/Barrage';
import InOutReminder from '../components/InOutReminder';
import { TEMPLATE } from '@/utils/template';
import { debounce, isMac } from '@/utils/index';
import { getScreenInfo } from '@/utils/layout';
import { farEndControlSupport } from '@/utils';
import { ipcRenderer } from 'electron';
import MeetingHeader from '../components/Header';
import MeetingLoading from '../components/Loading';
import SVG from '@/components/Svg';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/Header';
import { MeetingStatus } from '@/type/enum';
import { IAudio } from '@/type';
import AudioButton from '../components/AudioButton';
import Hold from '../components/Hold';
import VideoButton from '../components/VideoButton';
import FarEndControl from '../components/FarEndControl';
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
  IAIFaceRecv,
  IRecordStateChange,
  IRestApiResult,
  IConfHost,
  IReqObj,
  LayoutModel,
  IAppWindowCaptureState,
  CallMode,
  IInteractiveToolInfo,
  ISignInfo,
  ProcessType,
  TemplateModel,
  ContentCaptureType,
  RecordStatus,
  ShareContentState,
  IMeetingMuteQuery
} from '@xylink/xy-electron-sdk';
import More from '../components/More';
import PromptInfo from '../components/PromptInfo';
import {
  callModeState,
  callState,
  deviceChangeState,
  faceTypeState,
  settingInfoState,
  toolbarState,
  videoState,
  farEndControlState,
  interactiveState,
  signInState,
  broadCastState,
  shareContentType,
  contentSharingIsPaused,
  contentSharingIsManualPaused,
  contentThumbnailModalState,
  cloudRecordInfo,
  holdInfoState,
  AIFaceMapState,
} from '@/utils/state';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} from 'recoil';
import SettingModal from '../components/Modal';
import { useMagicMouse } from '@/utils/magicMouse';
import EndCall from '../components/EndCall';
import SignIn from '../components/SignIn';
import LayoutSelect from '../components/LayoutSelect';
// import CaptionButton from '../components/SubtitleButton';
import Captions from '../components/Subtitles';

import './index.scss';
import ContentThumbnail from '../components/ContentThumbnail';

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
  // 会控弹幕
  const [subTitle, setSubTitle] = useState<ISubTitle | null>(null);
  const [inOutReminder, setInOutReminder] = useState<IInOutReminder[]>([]);
  const [forceFullScreenId, setForceFullScreenId] = useState('');
  const [templateModel, setTemplateModel] = useState<TemplateModel>(
    TemplateModel.SPEAKER
  );
  // 自己开启录制的状态
  const [{recordStatus, isSelfRecord}, setCloudRecordInfo] = useRecoilState(cloudRecordInfo);
  const resetCloudRecordInfo = useResetRecoilState(cloudRecordInfo);
  const [confCanRecord, setConfCanRecord] = useState(true);

  const [confInfo, setConfInfo] = useState<IConfInfo>(DEFAULT_CONF_INFO);
  const [holdInfo, setHoldInfo] = useRecoilState(holdInfoState);
  // 会控下发主会场
  const [chirmanUri, setChirmanUri] = useState('');
  const [confHost, setConfHost] = useState({ isHost: false });

  const [meetingState, setMeetingState] = useRecoilState(callState);
  const settingInfo = useRecoilValue(settingInfoState);

  const [sharingIsManualPaused, setSharingIsManualPaused] = useRecoilState(contentSharingIsManualPaused);
  const [toolbarVisible, setToolVisible] = useRecoilState(toolbarState);
  const setFaceType = useSetRecoilState(faceTypeState);
  const setCallMode = useSetRecoilState(callModeState);
  const setDeviceChangeType = useSetRecoilState(deviceChangeState);
  // 遥控摄像头
  const [farEndControl, setFarEndControl] = useRecoilState(farEndControlState);
  // 签到相关
  const [{ processType }, setInteractiveState] =
    useRecoilState(interactiveState);
  const setSignInState = useSetRecoilState(signInState);
  const resetInteractive = useResetRecoilState(interactiveState);
  const resetSignIn = useResetRecoilState(signInState);
  // 支持同声传译
  const [supportAiCaption, setSupportAiCaption] = useState(false);
  // 人脸识别
  const setAIFaceMap = useSetRecoilState(AIFaceMapState);
  const setContentThumbnailVisible = useSetRecoilState(
    contentThumbnailModalState
  );
  const broadCast = useRecoilValue(broadCastState);
  const setContentIsPaused = useSetRecoilState(contentSharingIsPaused);
  const setContentType = useSetRecoilState(shareContentType);
  // 人脸识别
  const AIFaceMapRef = useRef(new Map());
  const AIFaceTimerRef = useRef(new Map());

  const videoStreamRef = useRef<ILayout[]>([]);
  // 共享状态
  const shareContentStatusRef = useRef(0);

  useMagicMouse();
  const navigate = useNavigate();

  const disableRecord = useMemo(() => {
    // 会控禁用录制， 录制状态时disable, 别人正在处理录制中或者暂停状态，这三种情况禁止开启录制
    if (
      !confCanRecord ||
      recordStatus === RecordStatus.DISABLE ||
      ([RecordStatus.ACTING_BY_OTHERS, RecordStatus.PAUSE_BY_OTHERS].includes(
        recordStatus
      ) &&
        !isSelfRecord)
    ) {
      return true;
    }
    return false;
  }, [confCanRecord, recordStatus, isSelfRecord]);

  useEffect(() => {
    // mac
    ipcRenderer.send('resizable', true);

    return () => {
      ipcRenderer.send('exit-fullscreen');
      ipcRenderer.send('resizable', false);
    };
  }, []);

  // 检查是否支持同传字幕
  useEffect(() => {
    const supportAiCaptionResultCallback = (e: boolean) => {
      setSupportAiCaption(e);
    };

    xyRTC.current.on('SupportAiCaptionResult', supportAiCaptionResultCallback);
  }, []);

  useEffect(() => {
    setVideo(
      store.get('xyMeetingInfo').muteVideo ? 'muteVideo' : 'unmuteVideo'
    );

    const xyRTCTemp = xyRTC.current;

    xyRTC.current.on('CallState', (e: ICallState) => {
      console.log('call state e: ', e, meetingState);
      const { state, reason, error } = e;

      if (state === 'Connected') {
        if (meetingState !== 'meeting') {
          // xyRTC.current.checkAiCaptionSupport();

          setMeetingState(MeetingStatus.MEETING);
        }

        xyRTC.current.broadcastEletronicBadge(broadCast);
      } else if (state === 'Disconnected') {
        if (error !== SUCCESS_CODE) {
          console.log('error', error, SDK_ERROR_MAP[error])
          message.info(SDK_ERROR_MAP[error] || reason);
          // token过期退出登录
          if (error === 'XYSDK:964104') {
            xyRTC.current.logout();
            navigate('/');
          }
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
    xyRTC.current.on('TemplateModelChanged', (e: TemplateModel) => {
      console.log('TemplateModelChanged: ', e);
      setTemplateModel(e);
    });

    xyRTC.current.on('VideoStreams', (e: ILayout[]) => {
      const { model } = settingInfo;

      videoStreamRef.current = e;

      if (model === LayoutModel.CUSTOM) {
        calcCustomVideoStreamLayout();
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

    xyRTC.current.on('AppWindowCaptureState', (e: IAppWindowCaptureState) => {
      console.log('AppWindowCaptureState:', e);
      if (e.isClosed) { // app 如果被关闭，则停止共享
        xyRTC.current.stopSendContent();
        message.info('由于共享应用已被关闭，屏幕共享已停止');
      } else {
        if (!sharingIsManualPaused) { // 如果手动暂停了，则不处理终端下发的暂停状态
          setContentIsPaused(e.isPaused);
        }
      }
    });

    xyRTC.current.on('KickOut', (e: string) => {
      console.log('demo get kick out message: ', e);

      endMeeting();

      onLogout();

      message.info(`${KICK_OUT_MAP[e] || '未知异常，重新登录'}`);
    });

    xyRTC.current.on('ContentState', (e: ShareContentState) => {
      const lastShareContentStatus = shareContentStatusRef.current;
      const { IDLE, SENDING, RECEIVING } = ShareContentState;

      if (e === IDLE || e === SENDING || e === RECEIVING) {
        shareContentStatusRef.current = e;
        setShareContentStatus(e);
      }
      if (e === SENDING) {
        message.info(`您正在分享Content内容`);
      } else if (e === IDLE && lastShareContentStatus !== IDLE) {
        message.info(`已结束分享内容`);
        setContentIsPaused(false);
        setContentType(ContentCaptureType.INVALID);
        ipcRenderer.send('closeScreenRegionShare');
        // 防止远端顶掉共享导致没有停止捕获
        xyRTC.current.stopShareContent();
      }
    });

    // 会议控制消息
    // 可以通过此消息获取：会控播放地址/主会场callUri/麦克风状态/是否是强制静音麦克风
    // 自定义布局模式下，主会场callUri需要记录下来，后续requestLayout计算需要使用
    xyRTC.current.on('ConfControl', (e: IConfControl) => {
      console.log('meeting control message: ', e);

      const { disableMute, disableContent, disableRecord, feccIsDisabled, chirmanUri } = e;

      // 强制静音
      setDisableAudio(disableMute);

      // 共享权限
      setDisableContent(disableContent);

      // 会控控制录制权限
      setConfCanRecord(!disableRecord);

      // 会控禁止遥控摄像头权限
      setFarEndControl(state=>({...state,disabled: feccIsDisabled}));

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

    // 人脸识别消息
    xyRTC.current.on('AIFaceRecv', (e: IAIFaceRecv) => {

      const { calluri  } = e || {};

      // 设置人脸识别信息
      AIFaceMapRef.current.set(calluri, e);
      setAIFaceMap(new Map(AIFaceMapRef.current));

      // 定时清理
      updateFaceTimer(calluri);
    });


    // 会控下发 关闭摄像头操作
    xyRTC.current.on('MeetingMuteQuery', (e: IMeetingMuteQuery) => {
      message.info('主持人已关闭您的摄像头');

      setVideo('muteVideo');
      xyRTC.current.muteCamera(true);
    });

    // 自己开启录制状态改变
    xyRTC.current.on('RecordingStateChanged', (e: IRecordStateChange) => {
      console.log('RecordingStateChanged: ', e);

      // 录制过程中，由于本人和会控都有可能操作，所以需要自己区分是否是本人在录制
      let isSelfRecord: boolean | undefined;
      if(e.recordState === RecordStatus.ACTING){
        isSelfRecord = true;
      }else if(e.recordState === RecordStatus.IDLE || e.recordState === RecordStatus.IDLE_BY_OTHERS){
        isSelfRecord = false;
      }

      setCloudRecordInfo((prev)=>{
        return {
          isSelfRecord: isSelfRecord ?? prev.isSelfRecord,
          recordStatus: e.recordState
        }
      });

      if (e.recordState === RecordStatus.IDLE) {
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

    // 互动工具回调
    xyRTC.current.on('InteractiveToolInfo', (e: IInteractiveToolInfo) => {
      setInteractiveState(e);
    });

    // 签到结果
    xyRTC.current.on('SubmitSignatureInfosResult', (e: ISignInfo) => {
      console.log('SubmitSignatureInfosResult:', e);
      if (e.code !== 0) {
        message.info('签到失败，请稍候重试');
        return;
      }

      message.success('签到成功');

      setSignInState({
        promp: true,
        modal: false,
        isSuccess: true,
      });
    });

    return () => {
      // 移除监听事件
      xyRTCTemp.removeAllListeners();
    };
  }, []);

  // 自定义布局，需要自己处理窗口变化
  useEffect(() => {
    const debounceVideoStreamLayout = debounce(
      calcCustomVideoStreamLayout,
      150,
      100
    );

    if (settingInfo.model === LayoutModel.CUSTOM) {
      window.addEventListener('resize', debounceVideoStreamLayout);
    }

    return () => {
      window.removeEventListener('resize', debounceVideoStreamLayout);
    };
  }, []);

  useEffect(() => {
    const term = layout.find((item) => {
      const isSupportFarControl = farEndControlSupport(
        item.roster.feccOri
      ).supportSome;
      const isInBigScreen =
        item.position.width > (screenInfo.layoutWidth || 0) * 0.5;
      return isSupportFarControl && isInBigScreen;
    });

    setFarEndControl((state) => ({
      ...state,
      callUri: term?.roster.callUri || '',
      feccOri: term?.roster.feccOri,
    }));
  }, [layout]);

  /**
   * 自定义布局计算screen and layout data
   */
  const calcCustomVideoStreamLayout = () => {
    const e = videoStreamRef.current;

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
  };

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
    let timer = AIFaceTimerRef.current.get(calluri);

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      AIFaceMapRef.current?.delete(calluri);
      AIFaceTimerRef.current?.delete(calluri);

      setAIFaceMap(new Map(AIFaceMapRef.current));
    }, 3000);

    AIFaceTimerRef.current.set(calluri, timer);
  };

  const clearFaceTimer = () => {
    for (const [key, value] of AIFaceTimerRef.current) {
      if (value) clearTimeout(value);
      if (key) AIFaceTimerRef.current?.delete(key);
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
          : currentPage;

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

  // 重置录制状态
  const resetRecordStatus = () => {
    resetCloudRecordInfo();
    setConfCanRecord(true);
  };

  const endMeeting = () => {
    setAudio('mute');
    setMeetingState(MeetingStatus.CALLING);
    setLayout([]);
    setPageInfo(DEFAULT_PAGE_INFO);
    setInOutReminder([]);
    setSubTitle(null);
    setTemplateModel(TemplateModel.SPEAKER);
    setFaceType('');
    setCallMode(CallMode.AudioVideo);
    setHandStatus(false);
    setDeviceChangeType('');
    setConfHost({ isHost: false });
    // 退出会议时把视频是否静音还原
    setVideo(store.get('xyMeetingInfo').muteVideo ? 'muteVideo' : 'unmuteVideo');

    AIFaceMapRef.current = new Map();
    setAIFaceMap(AIFaceMapRef.current);

    setConferenceInfo(DEFAULT_MEETING_INFO);
    setFarEndControl((state) => ({ ...state, show: false }));
    resetRecordStatus();
    resetInteractive();
    resetSignIn();
    clearFaceTimer();
    setSupportAiCaption(false);
    console.log('endCall stop')

    xyRTC.current.endCall();

    // 关闭会控弹框
    ipcRenderer.send('meetingControlWin', false);

    ipcRenderer.send('exit-fullscreen');

    ipcRenderer.send('closeScreenRegionShare');

    if (shareContentStatus === ShareContentState.SENDING) {
      stopShareContent();
    }

    navigate('/join');

    ipcRenderer.removeAllListeners('domReady');
    ipcRenderer.removeAllListeners('secondWindow');
    ipcRenderer.removeAllListeners('currentWindowId');
  };

  const stopShareContent = () => {
    setContentIsPaused(false);
    setSharingIsManualPaused(false);
    xyRTC.current.stopSendContent();
  };

  const shareContent = () => {
    if (disableContent) {
      message.info('没有双流分享权限');
      return;
    }

    // const withDesktopAudio = store.get('xyWithDesktopAudio');

    // xyRTC.current.startSendContent(withDesktopAudio);
    setContentThumbnailVisible(true);
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

    // 录制空闲时可以开启录制
    if ([RecordStatus.IDLE, RecordStatus.IDLE_BY_OTHERS].includes(recordStatus)) {
      xyRTC.current.startCloudRecord();
    } else if (isSelfRecord) {
      // 本人录制中
      xyRTC.current.stopCloudRecord();
    }
  };

  // 切换layout
  const switchLayout = async (templateModel?: TemplateModel) => {
    if (shareContentStatus === 1) {
      return;
    }
    try {
      const result = await xyRTC.current.switchLayout(templateModel);
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

  const { layoutWidth, layoutHeight } = screenInfo;
  const layoutStyle = {
    width: `${layoutWidth}px`,
    height: `${layoutHeight}px`,
  };

  const setForceFullScreen = async (id = '') => {
    try {
      await xyRTC.current.forceFullScreen(id);
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

  const onHostMeetingUrl =  (e: any) => {
    console.log('HostMeetingUrl: ', e);
    const { members, pc } = e;
    const conferenceInfo = store.get('xyMeetingInfo');
    const { meetingNumber = '' } = conferenceInfo || {};
    const url = confHost?.isHost ? pc : members;

    if (url) {
      ipcRenderer.send('meetingControlWin', { url, meetingNumber });
    }
  }

  useEffect(() => {
    // 会控链接
    xyRTC.current.on('HostMeetingUrl',onHostMeetingUrl);

    return ()=>{
      xyRTC.current.off('HostMeetingUrl', onHostMeetingUrl)
    }
  }, [confHost?.isHost]);

  const openMeetingControlWin = () => {
    xyRTC.current.getConfMgmtUrl();
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
            toggleForceFullScreen={() => toggleForceFullScreen(val.id)}
          ></Video>
        );
      }

      return null;
    });
  };

  const renderMeeting = () => {
    const isLocalRecording =
      (recordStatus === RecordStatus.ACTING ||
        RecordStatus.ACTING_BY_OTHERS === recordStatus ||
        recordStatus === RecordStatus.PAUSE_BY_OTHERS) &&
      isSelfRecord;
    if (meetingState === 'meeting') {
      return (
        <>
          <div id="meeting-content" className={`meeting-content ${!isMac ? 'margin30': ''}`}>
            <PromptInfo
              confCanRecord={confCanRecord}
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
            {supportAiCaption && <Captions />}
            <div
              className={`middle ${toolbarVisible.show ? 'visible' : 'hidden'}`}
            >
              <More />

              <div onClick={openMeetingControlWin} className={`button host`}>
                <SVG icon="meeting_host" />
                <div className="title">
                  {confHost?.isHost ? '主持会议' : '参会者'}
                </div>
                <div className="tag">{confInfo?.participantCount || 1}</div>
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

              <div
                className={`button-box ${
                  shareContentStatus === 1 ? 'disabled-button' : ''
                }`}
              >
                <div onClick={() => switchLayout()} className="button layout">
                  <SVG icon="layout" />
                  <div className="title">窗口布局</div>
                </div>
                <LayoutSelect
                  contentPartCount={confInfo.contentPartCount}
                  templateModel={templateModel}
                  switchLayout={switchLayout}
                >
                  <div className="arrow">
                    <SVG icon="arrow" />
                  </div>
                </LayoutSelect>
              </div>

              <div
                onClick={recordOperate}
                className={`button ${
                  isLocalRecording ? 'pause_record' : 'record'
                } ${disableRecord ? 'disabled-button' : ''}`}
              >
                <SVG icon={isLocalRecording ? 'record_stop' : 'record'} />
                <div className="title">
                  {isLocalRecording ? '停止录制' : '开始录制'}
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

              {/* {supportAiCaption && <CaptionButton />} */}

              <EndCall
                stopMeeting={() => {
                  hangup(false);
                }}
              />
            </div>
          </div>
          {toolbarVisible.show &&
            farEndControl.show &&
            !!farEndControl.callUri && <FarEndControl />}
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
        {meetingState === 'meeting' && (
          <MeetingHeader conferenceInfo={conferenceInfo} holdInfo={holdInfo} />
        )}
      </AppHeader>

      {meetingState === 'calling' && (
        <MeetingLoading conferenceInfo={conferenceInfo} stopMeeting={hangup} />
      )}

      {holdInfo?.isOnhold && (
        <Hold conferenceInfo={conferenceInfo} stopMeeting={hangup} />
      )}

      {!holdInfo?.isOnhold && renderMeeting()}

      <SettingModal />
      <ContentThumbnail />
      {ProcessType.SIGN_IN === processType && <SignIn />}
    </div>
  );
}

export default Meeting;
