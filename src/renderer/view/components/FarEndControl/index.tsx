import { useState, useMemo, useRef } from 'react';
import SVG from '@/components/Svg';
import xyRTC from '@/utils/xyRTC';
import { SDKFECCCommand } from '@xylink/xy-electron-sdk';
import { useRecoilState } from 'recoil';
import { farEndControlState } from '@/utils/state';
import { farEndControlSupport } from '@/utils';
import './index.scss';
import { message } from 'antd';

const IndexView = () => {

  const [farEndControl] = useRecoilState(farEndControlState);

  const [directionInfo, setDirectionInfo] = useState({
    isActive: false,
    direction: ''
  });

  const clickTimeRef = useRef({
    start: 0,
    end: 0
  })

  const supportState = useMemo(() => {
    return farEndControlSupport(farEndControl.feccOri)
  }, [farEndControl.feccOri])

  const onFarEndControl = (command: SDKFECCCommand) => {
    const leftTime = clickTimeRef.current.end - clickTimeRef.current.start;

    // 超过200ms按持续遥控处理
    if (leftTime > 200) {
      return;
    }

    if (xyRTC) {
      if ([SDKFECCCommand.FECC_STEP_RIGHT, SDKFECCCommand.FECC_STEP_LEFT].includes(command) && !supportState.supportHorizontal) {
        return;
      }
      if ([SDKFECCCommand.TILT_CAMERA_STEP_UP, SDKFECCCommand.TILT_CAMERA_STEP_DOWN].includes(command) && !supportState.supportVertical) {
        return;
      }

      xyRTC.farEndHardwareControl(farEndControl.callUri, command, 30)
    }
  }

  const onPress = (isActive: boolean, direction: string, command: SDKFECCCommand) => {
    // 记录按下的时间
    clickTimeRef.current[isActive ? 'start' : 'end'] = new Date().getTime();

    setDirectionInfo({
      isActive,
      direction
    });

    if (xyRTC) {
      if (isActive && [SDKFECCCommand.FECC_TURN_LEFT, SDKFECCCommand.FECC_TURN_RIGHT].includes(command) && !supportState.supportHorizontal) {
        message.info('当前没有可以左右转动的摄像头');
        return;
      }
      if (isActive && [SDKFECCCommand.TILT_CAMERA_TURN_UP, SDKFECCCommand.TILT_CAMERA_TURN_DOWN].includes(command) && !supportState.supportVertical) {
        message.info('当前没有可以上下转动的摄像头');
        return;
      }
      if (!isActive && command === SDKFECCCommand.FECC_TURN_STOP && !supportState.supportHorizontal) {
        return;
      }
      if (!isActive && command === SDKFECCCommand.TILT_CAMERA_TURN_STOP && !supportState.supportVertical) {
        return;
      }

      xyRTC.farEndHardwareControl(farEndControl.callUri, command, 30)
    }
  }

  return (
    <div className="far-hard-control">
      {
        supportState.supportZoom && <div
          className="item plus"
          onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_ZOOM_IN)}
          onMouseDown={() => onPress(true, '', SDKFECCCommand.FECC_ZOOM_IN)}
          onMouseUp={() => onPress(false, '', SDKFECCCommand.FECC_ZOOM_TURN_STOP)}
        >
          <SVG className="control-direction" icon="plus" />
        </div>
      }
      <div className={directionInfo.isActive ? `control-direction-wrapper ${directionInfo.direction}` : 'control-direction-wrapper'}>
        <div className="top">
          <div
            className="item up"
            onClick={() => onFarEndControl(SDKFECCCommand.TILT_CAMERA_STEP_UP)}
            onMouseDown={() => onPress(true, 'up', SDKFECCCommand.TILT_CAMERA_TURN_UP)}
            onMouseUp={() => onPress(false, 'up', SDKFECCCommand.TILT_CAMERA_TURN_STOP)}
          >
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
        <div className="middle">
          <div
            className="item left"
            onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_LEFT)}
            onMouseDown={() => onPress(true, 'left', SDKFECCCommand.FECC_TURN_LEFT)}
            onMouseUp={() => onPress(false, 'left', SDKFECCCommand.FECC_TURN_STOP)}
          >
            <SVG className="control-direction" icon="direction" />
          </div>
          <div
            className="item right"
            onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_RIGHT)}
            onMouseDown={() => onPress(true, 'right', SDKFECCCommand.FECC_TURN_RIGHT)}
            onMouseUp={() => onPress(false, 'right', SDKFECCCommand.FECC_TURN_STOP)}
          >
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
        <div className="bottom">
          <div
            className="item bottom"
            onClick={() => onFarEndControl(SDKFECCCommand.TILT_CAMERA_STEP_DOWN)}
            onMouseDown={() => onPress(true, 'bottom', SDKFECCCommand.TILT_CAMERA_TURN_DOWN)}
            onMouseUp={() => onPress(false, 'bottom', SDKFECCCommand.TILT_CAMERA_TURN_STOP)}
          >
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
      </div>
      {
        supportState.supportZoom && <div
          className="item minus"
          onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_ZOOM_OUT)}
          onMouseDown={() => onPress(true, '', SDKFECCCommand.FECC_ZOOM_OUT)}
          onMouseUp={() => onPress(false, '', SDKFECCCommand.FECC_ZOOM_TURN_STOP)}
        >
          <SVG className="control-direction" icon="minus" />
        </div>
      }
    </div>
  );
};

export default IndexView;
