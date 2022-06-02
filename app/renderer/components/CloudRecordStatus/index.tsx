import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import './index.css';

export const secondToDate = (result: number) => {
  var h =
    Math.floor(result / 3600) < 10
      ? "0" + Math.floor(result / 3600)
      : Math.floor(result / 3600);
  var m =
    Math.floor((result / 60) % 60) < 10
      ? "0" + Math.floor((result / 60) % 60)
      : Math.floor((result / 60) % 60);
  var s =
    Math.floor(result % 60) < 10
      ? "0" + Math.floor(result % 60)
      : Math.floor(result % 60);
  return h + ":" + m + ":" + s;
};

interface IProps {
  showTimer: boolean; // 是否显示时间倒计时
  isRecordPaused: boolean;
}

const Timmer = (props:IProps) => {
  const { showTimer, isRecordPaused } = props;
  const [timerCount, setTimerCount] = useState(0);
  const meetingTimeout = useRef<any>(null);

  const onCreateMeetingTimeCount = useCallback(() => {
    meetingTimeout.current = setTimeout(() => {
      clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;

      setTimerCount((count) => count + 1);
      onCreateMeetingTimeCount();
    }, 1000);
  }, []);

  useEffect(() => {
    onCreateMeetingTimeCount();

    return () => {
      clearTimeout(meetingTimeout.current);
      meetingTimeout.current = null;
    };
  }, [onCreateMeetingTimeCount]);

  const timmer = useMemo(() => secondToDate(timerCount), [timerCount]);

  return (
    <>
      <div className={timerCount % 2 === 0 ? "icon" : "icon hide"}></div>
      <div className="record-time">
        云端录制&nbsp;
        {showTimer ? timmer :isRecordPaused? "暂停中": "录制中"}
      </div>
    </>
  );
};

export default Timmer;
