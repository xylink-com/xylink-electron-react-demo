/**
 * 静音 按钮
 */
import { memo, useEffect, useMemo, useState } from 'react';
import DebounceButton from '@/components/DebounceButton';
import SVG from '@/components/Svg';
import xyRTC from '@/utils/xyRTC';
import DeviceSelect from '../DeviceSelect';
import { message } from 'antd';
import { UpdateDevice } from '@/type/enum';

interface IProps {
  audio: 'mute' | 'unmute';
  disableAudio?: boolean;
  handStatus: boolean;
  setHandStatus: (is: boolean) => void;
}

const AudioButton = (props: IProps) => {
  const {
    audio,
    disableAudio = false,
    handStatus = false,
    setHandStatus,
  } = props;
  const [micLevel, setMicLevel] = useState(0);

  const audioObj = useMemo(() => {
    let audioClass = 'button-warn mute_mic';
    let audioStatus = '取消静音';
    let svgIcon = 'mic_null';
    let svgType: 'default' | 'danger' = 'default';
    let operate = null;

    if (audio === 'mute' && !disableAudio) {
      audioClass = 'button-warn mute_mic';
      svgIcon = 'cancel_mic_mute';
      svgType = 'danger';
      operate = () => {
        xyRTC.muteMic(false);
      };
    }

    if (audio === 'unmute' && !disableAudio) {
      audioStatus = '静音';
      audioClass = 'mic_aec';
      operate = () => {
        message.info('麦克风已静音');

        xyRTC.muteMic(true);
      };
    }

    if (audio === 'mute' && disableAudio && !handStatus) {
      audioStatus = '举手发言';
      audioClass = 'hand_up';
      svgIcon = 'hand_up';
      operate = () => {
        xyRTC.sendSpeakingRequest();

        setHandStatus(true);
      };
    }

    if (audio === 'mute' && disableAudio && handStatus) {
      audioStatus = '取消举手';
      audioClass = 'hand_down';
      svgIcon = 'hand_down';
      operate = () => {
        xyRTC.cancelSpeakingRequest();

        setHandStatus(false);
      };
    }

    if (audio === 'unmute' && disableAudio) {
      audioStatus = '结束举手';
      audioClass = 'hand_end';
      svgIcon = 'hand_end';

      operate = () => {
        xyRTC.sendSpeakingEnd();

        setHandStatus(false);
      };
    }

    return { audioClass, audioStatus, svgIcon, svgType, operate };
  }, [audio, disableAudio, handStatus, setHandStatus]);

  useEffect(() => {
    if ((audio === 'mute' || audio === 'unmute') && disableAudio) {
      setHandStatus(false);
    }
  }, [audio, disableAudio, setHandStatus]);

  useEffect(() => {
    // 实时获取麦克风声量大小（0-100）
    xyRTC.on('MicEnergyReported', (value: number) => {
      setMicLevel(value);
    });
  }, []);

  return (
    <div className="button-box">
      <DebounceButton
        onClick={audioObj.operate}
        className={`button ${audioObj.audioClass}`}
      >
        <div className="mic-icon">
          {!disableAudio && audio === 'unmute' && (
            <div className="aec">
              <div
                className="aec_content"
                style={{ transform: `translateY(-${micLevel}%)` }}
              />
            </div>
          )}
          <SVG icon={audioObj.svgIcon} type={audioObj.svgType} />
        </div>
        <div className="title">{audioObj.audioStatus}</div>
      </DebounceButton>
      <DeviceSelect type={UpdateDevice.AUDIO}>
        <div className="arrow">
          <SVG icon="arrow" />
        </div>
      </DeviceSelect>
    </div>
  );
};

export default memo(AudioButton);
