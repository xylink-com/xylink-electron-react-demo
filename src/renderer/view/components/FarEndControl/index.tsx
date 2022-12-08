import { useState, useMemo } from 'react';
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

  const supportState = useMemo(() => {
    return farEndControlSupport(farEndControl.feccOri)
  }, [farEndControl.feccOri])

  const onFarEndControl = (command: SDKFECCCommand) => {
    if (xyRTC) {
      if ([SDKFECCCommand.FECC_STEP_RIGHT, SDKFECCCommand.FECC_STEP_LEFT].includes(command) && !supportState.supportHorizontal) {
        message.info('当前没有可以左右转动的摄像头');
        return;
      }
      if ([SDKFECCCommand.TILT_CAMERA_STEP_UP, SDKFECCCommand.TILT_CAMERA_STEP_DOWN].includes(command) && !supportState.supportVertical) {
        message.info('当前没有可以上下转动的摄像头');
        return;
      }
      xyRTC.farEndHardwareControl(farEndControl.callUri, command, 30)
    }
  }

  const onPress = (isActive: boolean, direction: string) => {
    setDirectionInfo({
      isActive,
      direction
    })
  }

  return (
    <div className="far-hard-control">
      {
        supportState.supportZoom && <div className="item plus" onClick={() => onFarEndControl(SDKFECCCommand.FECC_ZOOM_IN)}>
          <SVG className="control-direction" icon="plus" />
        </div>
      }
      <div className={directionInfo.isActive ? `control-direction-wrapper ${directionInfo.direction}` : 'control-direction-wrapper'}>
        <div className="top">
          <div className="item up" onClick={() => onFarEndControl(SDKFECCCommand.TILT_CAMERA_STEP_UP)} onMouseDown={() => onPress(true, 'up')} onMouseUp={() => onPress(false, 'up')}>
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
        <div className="middle">
          <div className="item left" onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_LEFT)} onMouseDown={() => onPress(true, 'left')} onMouseUp={() => onPress(false, 'left')}>
            <SVG className="control-direction" icon="direction" />
          </div>
          <div className="item right" onClick={() => onFarEndControl(SDKFECCCommand.FECC_STEP_RIGHT)} onMouseDown={() => onPress(true, 'right')} onMouseUp={() => onPress(false, 'right')}>
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
        <div className="bottom">
          <div className="item bottom" onClick={() => onFarEndControl(SDKFECCCommand.TILT_CAMERA_STEP_DOWN)} onMouseDown={() => onPress(true, 'bottom')} onMouseUp={() => onPress(false, 'bottom')}>
            <SVG className="control-direction" icon="direction" />
          </div>
        </div>
      </div>
      {
        supportState.supportZoom && <div className="item minus" onClick={() => onFarEndControl(SDKFECCCommand.FECC_ZOOM_OUT)}>
          <SVG className="control-direction" icon="minus" />
        </div>
      }
    </div>
  );
};

export default IndexView;
