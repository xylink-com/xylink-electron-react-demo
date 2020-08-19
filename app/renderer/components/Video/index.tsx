/**
 * XYRTC Video Component
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-1-07 10:34:18
 */

import React, { useRef, useEffect } from 'react';
import './index.css';

const Video = (props: any) => {
  const { item, xyRTC } = props;
  const videoRef = useRef(null);
  const videoRenderTimmer = useRef(0);
  const videoRender = useRef();
  const canvasInfo = useRef();

  useEffect(() => {
    canvasInfo.current = props.item.position;

    if (!videoRender.current) {
      // @ts-ignore
      videoRef.current.width = item.position.width;
      // @ts-ignore
      videoRef.current.height = item.position.height;

      videoRender.current = xyRTC.getRender(videoRef.current);
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const { width = 0, height = 0 } = canvasInfo.current || {};

    if (
      props.item.position.width !== width ||
      props.item.position.height !== height
    ) {
      if (videoRef.current) {
        // @ts-ignore
        videoRef.current['width'] = props.item.position.width;
        // @ts-ignore
        videoRef.current.height = props.item.position.height;

        canvasInfo.current = props.item.position;
      }
    }
  }, [props.item]);

  useEffect(() => {
    const { sourceId, isContent, state } = item.roster;

    const renderLoop = () => {
      xyRTC.drawVideoFrame(videoRender.current, sourceId, isContent);

      videoRenderTimmer.current = window.requestAnimationFrame(renderLoop);
    };

    if (sourceId && !videoRenderTimmer.current) {
      videoRenderTimmer.current = window.requestAnimationFrame(renderLoop);
    }

    if ((!sourceId && videoRenderTimmer.current) || state !== 5) {
      console.log('clear animate');
      cancelAnimationFrame(videoRenderTimmer.current);
      // @ts-ignore
      videoRenderTimmer.current = null;
    }

    return () => {
      if (videoRenderTimmer.current) {
        console.log('clear timmer when conponent unmount');
        cancelAnimationFrame(videoRenderTimmer.current);
        // @ts-ignore
        videoRenderTimmer.current = null;
      }
    };
  }, [props.item.sourceId, props.item.roster.state]);

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
        <div className="name">{`${item.roster.displayName || 'Local'}`}</div>
      </div>
    );
  };

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
            <div className="displayname">{item.roster.displayName || ''}</div>
            <div>语音通话中</div>
          </div>
        </div>
      );
    }

    return renderVideoName();
  };

  return (
    <div className="wrap-video" style={item.positionStyle}>
      <div className="video">
        <div className="video-content">
          <div className="video-model">{renderVideoStatus()}</div>
        </div>

        <canvas ref={videoRef} />
      </div>
    </div>
  );
};

export default Video;
