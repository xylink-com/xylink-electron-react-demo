import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './index.scss';

export const secondToDate = (result: number) => {
  const h =
    Math.floor(result / 3600) < 10
      ? '0' + Math.floor(result / 3600)
      : Math.floor(result / 3600);
  const m =
    Math.floor((result / 60) % 60) < 10
      ? '0' + Math.floor((result / 60) % 60)
      : Math.floor((result / 60) % 60);
  const s =
    Math.floor(result % 60) < 10
      ? '0' + Math.floor(result % 60)
      : Math.floor(result % 60);
  return h + ':' + m + ':' + s;
};

interface IProps {
  showTimer: boolean;
  isRecordPaused: boolean;
}

const Timer = (props: IProps) => {
  const { showTimer, isRecordPaused } = props;
  const [timerCount, setTimerCount] = useState(0);
  const meetingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCreateMeetingTimeCount = useCallback(() => {
    meetingTimeout.current = setTimeout(() => {
      meetingTimeout.current && clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;

      if(!isRecordPaused){
        setTimerCount((count) => count + 1);
        onCreateMeetingTimeCount();
      }
    }, 1000);
  }, [isRecordPaused]);

  useEffect(() => {
    onCreateMeetingTimeCount();

    return () => {
      meetingTimeout.current && clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;
    };
  }, [onCreateMeetingTimeCount]);

  const timer = useMemo(() => secondToDate(timerCount), [timerCount]);

  return (
    <div className="record-time">
      <div className={timerCount % 2 === 0 ? 'icon' : 'icon hide'}></div>
      云端录制&nbsp;
      {showTimer && !isRecordPaused ? timer : isRecordPaused ? '暂停中' : '录制中'}
    </div>
  );
};

export default Timer;
