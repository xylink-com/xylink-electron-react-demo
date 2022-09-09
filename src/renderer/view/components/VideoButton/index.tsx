/**
 * 开启关闭摄像头
 */
import { memo } from 'react';
import SVG from '@/components/Svg';
import DebounceButton from '@/components/DebounceButton';
import DeviceSelect from '../DeviceSelect';
import { useRecoilValue } from 'recoil';
import { callModeState } from '@/utils/state';
import { CallMode } from '@xylink/xy-electron-sdk';

interface IProps {
  video: string;
  videoOperate: () => void;
}

const VideoButton = (props: IProps) => {
  const { video, videoOperate } = props;
  const callMode = useRecoilValue(callModeState);

  let videoClass = 'button-warn mute_camera';
  let svgIcon = 'camera';
  let svgType: 'default' | 'danger' = 'default';

  if (video === 'unmuteVideo') {
    videoClass = 'camera';
    svgIcon = 'camera';
  } else {
    videoClass = 'button-warn mute_camera';
    svgIcon = 'mute_camera';
    svgType = 'danger';
  }

  return (
    <div
      className={`button-box ${
        callMode === CallMode.AudioOnly ? 'disabled-button' : ''
      }`}
    >
      <DebounceButton className={`button ${videoClass}`} onClick={videoOperate}>
        <SVG icon={svgIcon} type={svgType} />
        <div className="title">
          {video === 'unmuteVideo' ? '关闭摄像头' : '开启摄像头'}
        </div>
      </DebounceButton>
      <DeviceSelect type="video">
        <div className="arrow">
          <SVG icon="arrow" />
        </div>
      </DeviceSelect>
    </div>
  );
};

export default memo(VideoButton);
