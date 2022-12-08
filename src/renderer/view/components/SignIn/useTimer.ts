import { EventType } from "@xylink/xy-electron-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from 'dayjs';
interface IProps {
  duration: number;
  endUtcTime: number;
  eventType: EventType;
  endAuto: boolean;
}

const secondToMinute = (result: number) => {
  var m =
    Math.floor(result / 60) < 10
      ? '0' + Math.floor(result / 60)
      : Math.floor((result / 60) % 60);
  var s =
    Math.floor(result % 60) < 10
      ? '0' + Math.floor(result % 60)
      : Math.floor(result % 60);
  return m + ':' + s;
};

export default function useTimer(props: IProps) {
  const { duration: defaultDuration, endUtcTime, eventType, endAuto } = props;
  const [duration, setDuration] = useState(defaultDuration);
  const timer = useRef<NodeJS.Timer>();

  useEffect(() => {
    if (eventType === EventType.START && endAuto) {
      timer.current = setInterval(() => {
        setDuration((prev) => prev - 1)
      }, 1000);
    }else{
      setDuration(0)
    }

    return () => {
      clearInterval(timer.current);
      timer.current = undefined;
    }
  }, [eventType,endAuto]);

  const time = useMemo(() => {
    if (endAuto) {
      return secondToMinute(duration)
    }
    if (eventType === EventType.STOP && endUtcTime > 0) {
      return dayjs(endUtcTime).format('HH:mm:ss')
    }
    return '';
  }, [duration, endUtcTime, eventType, endAuto]);

  return time;
}
