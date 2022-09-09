/**
 * 会议呼叫页面
 */
import { memo, useEffect, useRef } from 'react';
import { IConferenceInfo } from '@xylink/xy-electron-sdk';
import './index.scss';

import defaultAvatar from '@/assets/img/type/conference.png';

interface IProps {
  conferenceInfo: IConferenceInfo;
  stopMeeting: (isConfirm: boolean) => void;
}

const MeetingLoading = (props: IProps) => {
  const bgmAudioRef = useRef<HTMLAudioElement>(null);
  const { displayName } = props.conferenceInfo;

  useEffect(() => {
    const bgmAudioEle = bgmAudioRef.current;
    (async () => {
      if (bgmAudioEle?.paused) {
        try {
          await bgmAudioEle.play();
        } catch (error) {
          console.log('bgmAudio play error:', error);
        }
      }
    })();

    return () => {
      bgmAudioEle?.pause();
    };
  }, []);

  return (
    <div className="loading">
      <div className="loading-content">
        <div className="avatar">
          <img src={defaultAvatar} alt="avatar" />
        </div>
        <div className="name">
          <div className="calling">正在呼叫 {displayName}</div>
        </div>
        <div
          className="stop-btn"
          onClick={() => {
            props.stopMeeting(false);
          }}
        />
        {/* <audio ref={bgmAudioRef} loop src={ring}></audio> */}
      </div>
    </div>
  );
};

export default memo(MeetingLoading);
