/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import { useRef, useEffect, useMemo, useState, memo } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ILayout,
  ILine,
  Render,
  XYRTC,
  XYSlaveRTC,
} from '@xylink/xy-electron-sdk';
import cn from 'classnames';
import xyRTCInstance from '@/utils/xyRTC';

import './index.scss';
import FaceInfo from './faceInfo';
import { downloadUrl, getSrcByDeviceType } from '@/utils';
import { useRecoilValue } from 'recoil';
import { annotationStatusState } from '@/utils/state';
import Whiteboard from '@/components/Annotation/whiteboard';
import Toolbar from '@/components/Annotation/toolbar';
import useAnnotationRectStyle from './useAnnotationRectStyle';
import { localVideoFlip } from '@/utils/state';
import dayjs from 'dayjs';

interface IProps {
  item: ILayout;
  index: string;
  templateModel?: string;
  isShowFaceInfo?: boolean;
  xyRTC?: XYRTC | XYSlaveRTC;
  isExternalDrawLocalVideo?: boolean; // isExternalDraw：控制是否是副屏渲染模式，副屏渲染需要手动处理YUV数据
  toggleForceFullScreen?: () => void;
}

const Video = (props: IProps) => {
  const {
    item,
    index,
    isExternalDrawLocalVideo = false,
    templateModel,
    isShowFaceInfo,
    xyRTC = xyRTCInstance,
    toggleForceFullScreen,
  } = props;

  const annotationStatus = useRecoilValue(annotationStatusState);
  const videoFlip = useRecoilValue(localVideoFlip);

  const videoRef = useRef<HTMLCanvasElement>(null);
  const canvasInfo = useRef<any>(null);
  const rendererRef = useRef<Render>();
  const annotationRectStyle = useAnnotationRectStyle(item);

  useEffect(() => {
    if (videoRef.current) {
      canvasInfo.current = props.item.position;

      const dpr = window.devicePixelRatio || 1;

      // 设置canvas style样式
      videoRef.current.style.width = item.position.width + 'px';
      videoRef.current.style.height = item.position.height + 'px';
      // 设置canvas width/height 属性值，需要乘上dpr值，避免画面出现锯齿
      videoRef.current.width = item.position.width * dpr;
      videoRef.current.height = item.position.height * dpr;
    }
  });

  useEffect(() => {
    // 此副作用是动态设置canvas的宽高
    // 受切换 SPEAKER / GALLERY 布局影响，当前video组件的size会动态重新计算，所以需要重新赋值
    // 第三方如果是自定义layout布局模式，即 model: custom 布局模式，则可以不需要执行此副作用计算，自行处理canvas的size
    const { width = 0, height = 0 } = canvasInfo.current || {};

    if (
      props.item.position.width !== width ||
      props.item.position.height !== height
    ) {
      if (videoRef.current) {
        videoRef.current.width = props.item.position.width;
        videoRef.current.height = props.item.position.height;

        canvasInfo.current = props.item.position;
      }
    }
  }, [props.item]);

  useEffect(() => {
    // 非副屏渲染，调用setVideoRender即可
    if (!isExternalDrawLocalVideo) {
      // 有sourceId后，才需要调用渲染函数setVideoRender
      if (props.item.sourceId) {
        // 此副作用受sourceId的影响，在其变动时，重新执行此 setVideoRender 方法
        // 此方法是动态绑定sourceId和canvas元素，SDK内部会启动定时器按照屏幕刷新率30帧/s的方法获取流数据并通过webgl渲染
        // 此方法设置完成后，第三方不需要关注流的渲染，关注业务逻辑即可
        xyRTC.setVideoRender(props.item.sourceId, index);
      }
    }
  }, [props.item.sourceId, isExternalDrawLocalVideo, index, xyRTC]);

  useEffect(() => {
    // 副屏模式下，Local画面需要手动渲染，其他场景请勿手动渲染
    if (isExternalDrawLocalVideo) {
      // 初始化Render WebGL渲染器，Local画面因为接收的主窗口IPC传递过来的YUV数据，需要自行渲染
      // 外接屏幕的所有远端画面，不需要通过此方式处理
      rendererRef.current = new Render(videoRef.current);

      // 监听主窗口IPC传递过来的Local YUV Buffer数据
      ipcRenderer.on('localVideoStream', onLocalVideoStream);
    }

    // 销毁时，清理监听事件
    return () => {
      ipcRenderer.removeListener('localVideoStream', onLocalVideoStream);
    };
  }, [isExternalDrawLocalVideo]);

  /**
   *  副屏渲染Local画面，正常模式下，不需要执行
   */
  const onLocalVideoStream = (event: IpcRendererEvent, msg: any) => {
    const { buffer } = msg;
    const { width, height, rotation } = msg.videoFrame;

    // 调用渲染器绘画画面
    rendererRef.current?.draw(buffer, width, height, rotation);
  };

  const renderVideoName = () => {
    return (
      <div className="video-status">
        <div
          className={
            item.roster.audioMute
              ? 'audio-muted-status'
              : 'audio-unmuted-status'
          }
        ></div>
        <div className="name">{item.roster.displayName}</div>
      </div>
    );
  };

  // 视频状态，由state控制
  const renderVideoStatus = () => {
    const { state, dt } = item.roster;

    if (
      state === 0 ||
      state === 1 ||
      state === 3 ||
      state === 4 ||
      state === 8
    ) {
      const itemWidth = item.position.width;
      const srcUrl = getSrcByDeviceType(dt);

      // 视频暂停默认头像大小
      let avatarWidth = 56;
      if (itemWidth > 480) {
        avatarWidth = 88;
      } else if (itemWidth > 320) {
        avatarWidth = 72;
      }

      return (
        <div className="video-bg">
          <div className="center">
            <img
              className="avatar"
              src={srcUrl}
              alt="avatar"
              style={{ width: avatarWidth }}
            />
          </div>
          {renderVideoName()}
        </div>
      );
    }

    if (state === 2) {
      return (
        <div className="video-bg">
          <div className="center">
            <div>视频请求中...</div>
          </div>
          {renderVideoName()}
        </div>
      );
    }

    if (state === 6 || state === 7) {
      return (
        <div className="video-bg">
          <div className="center">
            <div className="displayName">{item.roster.displayName || ''}</div>
            <div>语音通话中</div>
          </div>
        </div>
      );
    }

    return renderVideoName();
  };

  const isActiveSpeaker = useMemo(() => {
    return !!item.roster.isActiveSpeaker && templateModel === 'GALLERY';
  }, [item.roster.isActiveSpeaker, templateModel]);

  const onCleanAnnotation = () => {
    xyRTC.cleanAnnotation();
  };

  const onSendAnnotationLine = (lineData: ILine) => {
    xyRTC.sendAnnotationLine(lineData);
  };

  /**
   * 下载canvas
   */
  const onDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = item.position.width;
    canvas.height = item.position.height;
    const render = new Render(canvas, {}, { preserveDrawingBuffer: true });
    const frame = xyRTC.getVideoFrame(item.sourceId, true);

    if (frame.hasData) {
      const { buffer, width, height, rotation } = frame;
      render.draw(buffer, width, height, rotation);
    }

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob as Blob);

      downloadUrl(url, `批注_${dayjs().format('YYYYMMDD_HH:mm:ss')}.png`);
    });
  };

  return (
    <div
      className={isActiveSpeaker ? 'wrap-video active-speaker' : 'wrap-video'}
      style={item.positionStyle}
      onDoubleClick={toggleForceFullScreen}
    >
      {annotationStatus && item.roster.isContent && (
        <div className="annotation-wrapper" style={annotationRectStyle}>
          <Toolbar
            annotationStatus={annotationStatus}
            onDownload={onDownload}
          />
          <Whiteboard
            isLocalShare={false}
            onCleanAnnotation={onCleanAnnotation}
            onSendAnnotationLine={onSendAnnotationLine}
          />
        </div>
      )}
      {/* 人脸识别 */}
      {isShowFaceInfo && <FaceInfo item={item}></FaceInfo>}

      <div className="video">
        <div className="video-content">
          <div className="video-model">{renderVideoStatus()}</div>
        </div>

        {/* electron sdk的流由内部webgl渲染，所以业务层需要提供一个canvas元素供内部使用 */}
        {/* 通过 SDK暴露的 setVideoRender 方法，可将sourceId和canvas元素绑定起来，内部会自动执行渲染 */}
        <canvas
          className={
            item.sourceId === 'LocalPreviewID'
              ? cn(videoFlip && 'xy-video-flip')
              : ''
          }
          id={index}
          ref={videoRef}
        />
      </div>
    </div>
  );
};

export default Video;
