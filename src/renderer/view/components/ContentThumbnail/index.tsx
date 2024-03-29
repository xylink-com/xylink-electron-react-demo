/**
 * 设置
 */
import cn from 'classnames';
import { ipcRenderer } from 'electron';
import React, { useEffect, useRef, useState } from 'react';
import { Checkbox, Button, Modal, Space, message } from 'antd';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import { annotationStatusState, contentThumbnailModalState } from '@/utils/state';
import xyRTC from '@/utils/xyRTC';
import { shareContentType, withDesktopAudioState, contentSharingIsPaused } from '@/utils/state';
import style from './index.module.scss';
import {
  ContentCaptureType,
  ContentStreamMode,
  IApp,
  IAppIcon,
  IAppThumbnail,
  IMonitorInfo,
  IMonitorThumbnail,
  ISendContentParams,
} from '@xylink/xy-electron-sdk';
import store from '@/utils/store';
import SVG from '@/components/Svg';
import regionIcon from './img/icon-region-2x.png';
import { IContentInfo, IMonitor } from '@/type';
import { CONTENT_PAGE_SIZE, CONTENT_LOOP_INTERVAL } from '@/enum';
import ThumbnailRenderer from '@/view/components/ThumbnailRenderer';

type OnRegionSharingHandler = (event: Electron.IpcRendererEvent, region: Electron.Rectangle) => void;

const ContentThumbnail = () => {
  const [visible, setVisible] = useRecoilState(contentThumbnailModalState);
  const [withDesktopAudio, setWithDesktopAudio] = useRecoilState(
    withDesktopAudioState
  );
  const setContentType = useSetRecoilState(shareContentType);
  const sharingIsPaused = useRecoilValue(contentSharingIsPaused);
  const setAnnotationStatus = useSetRecoilState(annotationStatusState);

  const [currentPage, setCurrentPage] = useState(1);
  const [enableFluentMode, setEnableFluentMode] = useState(false);
  const [bEnableAnnotation, setBEnableAnnotation] = useState(true);
  const [thumbnailsList, setThumbnailsList] = useState<IContentInfo[]>([]);
  const [curSelectedContent, setCurSelectedContent] = useState<IContentInfo | null>(null);

  const loopTimerRef = useRef(0);
  const visibleRef = useRef(visible);
  const currentRegionMonitor = useRef<IMonitorThumbnail>();
  const thumbnailsMapRef = useRef<Map<React.Key, IContentInfo>>(new Map);

  const onCancel = () => {
    setVisible(false);
  };

  const getThumbnailList = () => {
    const thumbnails: IContentInfo[] = [];
    // 获取屏幕缩略图
    const monitorInfoList: IMonitorInfo[] = xyRTC.getMonitorInfos();

    monitorInfoList.forEach((monitorInfo, index) => {
      const monitor = thumbnailsMapRef.current.get(monitorInfo.monitorName);

      if (monitor) {
        thumbnails.push(monitor);
      }
      else {
        // 获取缩略图，创建新的缩略图数据
        const monitorThumb: IMonitorThumbnail = xyRTC.getMonitorThumbnail(monitorInfo.monitorName);

        if (monitorThumb.hasData) {
          const info: IContentInfo = {
            info: {...monitorThumb, rect: monitorInfo.rect},
            key: monitorInfo.monitorName,
            name: index === 0 ? '当前屏幕' : `共享屏幕${index}`,
            type: ContentCaptureType.SCREEN
          };
          thumbnails.push(info);
        }
      }
    });

    // 屏幕部分区域共享
    thumbnails.push({
      name: '屏幕部分区域共享',
      info: thumbnails[0].info,
      key: 'region-sharing',
      screenRegionSharing: true,
      type: ContentCaptureType.SCREEN
    });

    // 获取 app 缩略图
    const appInfoList: IApp[] = xyRTC.getAppList();

    for (const appInfo of appInfoList) {
      const { hwnd, appName } = appInfo;
      const appContentInfo = thumbnailsMapRef.current.get(hwnd);

      if (appContentInfo) {
        thumbnails.push(appContentInfo);
      } else {
        const appData: IApp & IAppThumbnail = { ...xyRTC.getAppThumbnail(hwnd), ...appInfo };
        // 有些应用可能获取的缩略图有问题，比如任务管理器，需要判断一下是是不是有问题的图片，如果有问题则使用 icon 代替
        let appIcon: IAppIcon | null = null;

        if (!appData.hasData) {
          appIcon = xyRTC.getAppIcon(hwnd);
          Object.assign(appData, appIcon);

          if (!appData.hasData) continue; // 如果缩略图和 icon 都拿不到，则直接过滤掉
        }
        const content: IContentInfo = {
          info: appData,
          key: hwnd,
          type: ContentCaptureType.APP,
          name: (
            <span className={style.appLabel}>
              <span title={appName}>{appName.split(' - ')[0]}</span>
            </span>
          ),
        }
        thumbnails.push(content);
      }
    }
    return thumbnails;
  }

  useEffect(() => {
    setCurSelectedContent(prev => {
      if (!thumbnailsList.length) return null;
      return prev || thumbnailsList[0];
    });
    const thumbnailsMap = new Map<React.Key, IContentInfo>();
    thumbnailsList.forEach(item => {
      thumbnailsMap.set(item.key, item);
    });
    thumbnailsMapRef.current = thumbnailsMap;
  }, [thumbnailsList]);

  useEffect(() => {
    visibleRef.current = visible;
    const loop = () => {
      if (!visibleRef.current) return window.clearTimeout(loopTimerRef.current);
      const thumbnails = getThumbnailList();
      setThumbnailsList(thumbnails);
      CONTENT_LOOP_INTERVAL > 0 && (loopTimerRef.current = window.setTimeout(loop, CONTENT_LOOP_INTERVAL));
    }
    visible ? loop() : setThumbnailsList([]);
    return () => {
      window.clearTimeout(loopTimerRef.current);
    }
  }, [visible]);

  const startShare = () => {
    if (!curSelectedContent) {
      message.info('请选择一个共享内容');
      return;
    }

    // 可能当前正在接收content, 并且处于批注状态, 需要先关掉批注
    setAnnotationStatus((prevStatus) => {
      if (prevStatus) {
        xyRTC.stopAnnotation();
        ipcRenderer.send('AnnotationStatus', false);
      }

      return false;
    });

    const { type, info ,screenRegionSharing} = curSelectedContent;

    if (type === ContentCaptureType.SCREEN) {
      const desktopShareType = screenRegionSharing ? 'area' : 'fullScreen';
      // 桌面共享直接隐藏缩略图弹窗，无需等
      if (!screenRegionSharing) {
        xyRTC.startSendContent({
          contentStreamMode: ContentStreamMode.BOTH,
          contentCaptureType: ContentCaptureType.SCREEN,
          contentInfo: {
            source: (info as IMonitor).monitorName,
            enableFluentMode,
            localContentPreview: false,
            withAudio: withDesktopAudio,
            bEnableAnnotation
          },
        });

        setVisible(false);
        setContentType(ContentCaptureType.SCREEN);
        setCurSelectedContent(null);
      }

      return ipcRenderer.send('screenRegionShare', {type: desktopShareType, rect:( info as IMonitor).rect});
    }else if(type === ContentCaptureType.APP){
      xyRTC.startSendContent({
        contentCaptureType: type,
        contentStreamMode: ContentStreamMode.BOTH,
        contentInfo: {
          source: '',
          viewId:(info as IAppThumbnail).hwnd,
          withAudio: withDesktopAudio,
          enableFluentMode,
          localContentPreview: false,
          bEnableAnnotation
        },
      });
    }

    setVisible(false);
    setCurSelectedContent(null);
    setContentType(type);
  };

  // 区域共享监听，桌面共享不会走到这里
  useEffect(() => {
    const startRegionShare: OnRegionSharingHandler = (_event, region) => {

      console.log('startRegionShare region, ', region);

      const { x, y, width: w, height: h } = region || {};

      xyRTC.startSendContent({
        contentStreamMode: ContentStreamMode.BOTH,
        contentCaptureType: ContentCaptureType.SCREEN,
        contentInfo: {
          source: '',
          enableFluentMode,
          localContentPreview: false,
          withAudio: withDesktopAudio,
          region:  { x, y, w, h },
          bEnableAnnotation
        },
      });

      setVisible(false);
      setContentType(ContentCaptureType.SCREEN);
      setCurSelectedContent(null);
    }

    ipcRenderer.on('startRegionShare', startRegionShare);

    return () => {
      ipcRenderer.off('startRegionShare', startRegionShare);
    }
  }, [enableFluentMode, withDesktopAudio, curSelectedContent, bEnableAnnotation]);

  useEffect(()=>{
    const updateDisplayRegion: OnRegionSharingHandler = (_event, region) => {
      console.log('updateDisplayRegion region, ', region);
      // 如果是暂停的状态，则不应该恢复
      !sharingIsPaused && xyRTC.resumeContentCapture();
      const { x, y, width: w, height: h } = region;
      const res = xyRTC.updateContentCaptureRegion({ x, y, w, h });
      console.log(res);
    };

    const onregionSharingWindowWillChange = () => {
      // 将要移动窗口的时候, 把共享先暂停
      xyRTC.pauseContentCapture();
    }
    ipcRenderer.on('updateDisplayRegion', updateDisplayRegion);
    ipcRenderer.on('regionSharingWindowWillChange', onregionSharingWindowWillChange);

    return ()=>{
      ipcRenderer.off('updateDisplayRegion', updateDisplayRegion);
      ipcRenderer.off('regionSharingWindowWillChange', onregionSharingWindowWillChange);

    }
  }, [sharingIsPaused])

  const { totalPage, paginationList } = React.useMemo(() => {
    const startIdx = (currentPage - 1) * CONTENT_PAGE_SIZE;
    const paginationList = thumbnailsList.slice(startIdx, startIdx + CONTENT_PAGE_SIZE);
    const totalPage = Math.ceil(thumbnailsList.length / CONTENT_PAGE_SIZE);
    if (currentPage > totalPage && totalPage) setCurrentPage(totalPage);
    return { paginationList, totalPage };
  }, [thumbnailsList, currentPage]);

  return (
    <Modal
      title="请选择共享内容"
      wrapClassName={cn('xy__setting-modal', style.modal)}
      maskClosable={false}
      closable={true}
      visible={visible}
      footer={null}
      width={710}
      closeIcon={<SVG icon='close' className={style.closeIcon} />}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
    >
      <div className={style.container}>
        <div className={style.contentListWrapper}>
          <div className={style.contentItemList}>
            {
              paginationList.map(thumbnail => {
                if (thumbnail.screenRegionSharing) {
                  return (
                    <ContentBox
                      label="区域共享"
                      key={thumbnail.key}
                      className={style.iconContentBox}
                      checked={thumbnail.key === curSelectedContent?.key}
                      onClick={() => {
                        currentRegionMonitor.current = (thumbnail.info as IMonitorThumbnail);
                        setCurSelectedContent(thumbnail);
                      }}
                      onDoubleClick={startShare}
                    ><img width={40} src={regionIcon} /></ContentBox>
                  )
                }

                const { height, width, buffer } = thumbnail.info;
                return (
                  <ContentBox
                    key={thumbnail.key}
                    onDoubleClick={startShare}
                    checked={thumbnail.key === curSelectedContent?.key}
                    onClick={() => {
                      setCurSelectedContent(thumbnail);
                      thumbnail.type === ContentCaptureType.APP &&
                        setBEnableAnnotation(false);
                    }}
                    label={thumbnail.name}
                  >
                    <ThumbnailRenderer
                      height={height}
                      width={width}
                      buffer={buffer}
                    />
                  </ContentBox>
                );
              })
            }

          </div>

          <Space className={style.pagination}>
            {
              currentPage > 1 &&
              <Button onClick={() => setCurrentPage(prev => prev - 1)}>上一页</Button>
            }
            {
              totalPage > currentPage &&
              <Button onClick={() => setCurrentPage(prev => prev + 1)}>下一页</Button>
            }
          </Space>
        </div>
        <div className={style.footer}>
          <Space size={24}>
          <Checkbox
              checked={!bEnableAnnotation}
              disabled={curSelectedContent?.type === ContentCaptureType.APP}
              onChange={(e) => {
                setBEnableAnnotation(!e.target.checked);
              }}
            >
              共享内容时禁止他人批注
            </Checkbox>
            <Checkbox
              checked={withDesktopAudio}
              onChange={(e) => {
                setWithDesktopAudio(e.target.checked);
                store.set('xyWithDesktopAudio', e.target.checked);
              }}
            >
              共享内容时采集电脑声音
            </Checkbox>
            <Checkbox
              checked={enableFluentMode}
              onChange={(e) => setEnableFluentMode(e.target.checked)}
            >
              视频流畅度优先
            </Checkbox>
          </Space>

          <Button className={style.footerSharingBtn} type="primary" onClick={startShare}>开始共享</Button>
        </div>
      </div>
    </Modal>
  );
};

export interface ThumbnailItemProps {
  height: number;
  width: number;
  checked?: boolean;
  buffer: ArrayBuffer;
  label?: React.ReactNode;
  onStartSendContent: () => void;
}
interface ContentBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  label?: React.ReactNode;
}

const ContentBox = (props: React.PropsWithChildren<ContentBoxProps>) => {
  const { className, checked, children, label, onClick, ...restProps } = props;
  return (
    <div className={cn(style.contentItem, checked && style.checkedItem, className)} onClick={onClick} {...restProps}>
      <div className={style.contentItemInner}>{children}</div>
      <div className={style.contentItemLabel}>{label}</div>
    </div>
  );
}

export default ContentThumbnail;
