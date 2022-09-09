/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import { useRef, useEffect, useMemo } from 'react';
import {
  IAIFaceRecv,
  IFacePosition,
  ILayout,
  Render,
  FaceType,
} from '@xylink/xy-electron-sdk';
import xyRTC from '@/utils/xyRTC';
import { useRecoilValue } from 'recoil';
import { broadCastState, faceTypeState } from '@/utils/state';

import './index.scss';

interface IProps {
  item: ILayout;
  index: string;
  templateModel?: string;
  isShowFaceInfo?: boolean;
  faceInfo?: any;
  facePositionInfo?: IAIFaceRecv;
  toggleForceFullScreen?: () => void;
}

const Video = (props: IProps) => {
  const {
    item,
    index,
    templateModel,
    isShowFaceInfo = false,
    faceInfo,
    facePositionInfo,
    toggleForceFullScreen,
  } = props;

  const faceType = useRecoilValue(faceTypeState);
  const broadCast = useRecoilValue(broadCastState);

  const videoRef = useRef<HTMLCanvasElement>(null);
  const canvasInfo = useRef<any>(null);

  useEffect(() => {
    // 有sourceId后，才需要调用渲染函数setVideoRender
    if (props.item.sourceId) {
      // 此副作用受sourceId的影响，在其变动时，重新执行此 setVideoRender 方法
      // 此方法是动态绑定sourceId和canvas元素，SDK内部会启动定时器按照屏幕刷新率30帧/s的方法获取流数据并通过webgl渲染
      // 此方法设置完成后，第三方不需要关注流的渲染，关注业务逻辑即可
      xyRTC.setVideoRender(props.item.sourceId, index);
    }
  }, [props.item.sourceId, index, xyRTC]);

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
    const { state } = item.roster;

    if (
      state === 0 ||
      state === 1 ||
      state === 3 ||
      state === 4 ||
      state === 8
    ) {
      return (
        <div className="video-bg">
          <div className="center">
            <div>视频暂停</div>
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

  const getFacePosition = (position: IFacePosition) => {
    const w = item.position.width;
    const h = item.position.height;
    const _videoWidth = item.roster.videoWidth || 0;
    const _videoHeight = item.roster.videoHeight || 0;

    let nW = w;
    let nH = h;

    let xOffset = 0;
    let yOffset = 0;

    if (_videoHeight > 0 && _videoWidth > 0) {
      const scale = w / h;
      const vScale = _videoWidth / _videoHeight;

      if (vScale >= scale) {
        if (_videoWidth >= w) {
          nH = _videoHeight / (_videoWidth / w);
        } else {
          nH = _videoHeight * (w / _videoWidth);
        }

        yOffset = (h - nH) / 2;
      } else {
        if (_videoHeight >= h) {
          nW = _videoWidth / (_videoHeight / h);
        } else {
          nW = _videoWidth * (h / _videoHeight);
        }

        xOffset = (w - nW) / 2;
      }
    }

    const a = 10000; // 缩放系数

    const x1 = (position.left * nW) / a + xOffset;
    const y1 = (position.top * nH) / a + yOffset;

    const x2 = (position.right * nW) / a + xOffset;
    const y2 = (position.bottom * nH) / a + yOffset;

    let startX = x1;

    if (item.sourceId === 'LocalPreviewID') {
      startX = w - x2;
    }

    return {
      startX,
      startY: y1,
      width: x2 - x1,
      height: y2 - y1,
    };
  };

  const renderFaceInfo = () => {
    if (
      !(
        isShowFaceInfo &&
        item.roster.state === 5 &&
        !item.roster.isContent &&
        facePositionInfo
      )
    ) {
      return;
    }

    const { calluri = '', type, positionArr = [] } = facePositionInfo;
    const isDetect = faceType === FaceType.Detect;
    const isElectronicBadge = faceType === FaceType.EletronicBadge;
    const positionLen = positionArr.length;

    return positionArr.map((position: IFacePosition, index: number) => {
      const { faceId } = position;
      const { userName, userTitle = '' } = faceInfo.get(faceId) || {};

      const { startX, startY, width, height } = getFacePosition(position) || {};

      const key = calluri + index;

      // 电子铭牌 一个人， 固定显示铭牌信息
      if (broadCast) {
        const style =
          positionLen === 1
            ? { left: '20%', bottom: '12%' }
            : { left: startX + 'px', top: startY + height + 20 + 'px' };

        if (userName) {
          return (
            <div key={key} className="face-card" style={style}>
              <div className="face-user-name">{userName}</div>
              {userTitle && <div className="face-user-title">{userTitle}</div>}
            </div>
          );
        }

        return <div key={key} />;
      }

      // 扫描模式
      // 电子铭牌模式  电子铭牌 多人，在face底部20px
      if (isDetect || isElectronicBadge) {
        const style = {
          width: width + 'px',
          height: height + 'px',
          left: startX + 'px',
          top: startY + 'px',
        };

        const detectStyle = {
          width: width + 'px',
          height: height + 'px',
          backgroundSize: `${width}px ${height}px`,
        };

        const badgeStyle = {
          marginTop: height + 20 + 'px',
        };

        return (
          <div key={key} className="face-scan" style={style}>
            {isDetect && userName && (
              <div className="face-scan-name">
                <div className="face-user-name">{userName}</div>
                {userTitle && (
                  <div className="face-user-title">{userTitle}</div>
                )}
              </div>
            )}
            {isDetect && <div className="face-detect" style={detectStyle} />}

            {isElectronicBadge && userName && (
              <div key={key} className="face-card" style={badgeStyle}>
                <div className="face-user-name">{userName}</div>
                {userTitle && (
                  <div className="face-user-title">{userTitle}</div>
                )}
              </div>
            )}
          </div>
        );
      }

      return null;
    });
  };

  const isActiveSpeaker = useMemo(() => {
    return !!item.roster.isActiveSpeaker && templateModel === 'GALLERY';
  }, [item.roster.isActiveSpeaker, templateModel]);

  return (
    <div
      className={isActiveSpeaker ? 'wrap-video active-speaker' : 'wrap-video'}
      style={item.positionStyle}
      onDoubleClick={toggleForceFullScreen}
    >
      {/* 人脸识别 */}
      {renderFaceInfo()}

      <div className="video">
        <div className="video-content">
          <div className="video-model">{renderVideoStatus()}</div>
        </div>

        {/* electron sdk的流由内部webgl渲染，所以业务层需要提供一个canvas元素供内部使用 */}
        {/* 通过 SDK暴露的 setVideoRender 方法，可将sourceId和canvas元素绑定起来，内部会自动执行渲染 */}
        <canvas
          className={item.sourceId === 'LocalPreviewID' ? 'local-video' : ''}
          id={index}
          ref={videoRef}
        />
      </div>
    </div>
  );
};

export default Video;
