/**
 * 会中底部按钮"更多" 包含设置和键盘功能
 *
 */
import { useState, useEffect, useMemo } from 'react';
import { message, Popover } from 'antd';
import xyRTC from '@/utils/xyRTC';
import SVG from '@/components/Svg';
import NumberKeyBoard from '../NumberKeyBoard';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  callModeState,
  settingModalState,
  toolbarState,
  videoState,
  currentTabState,
  farEndControlState,
  annotationStatusState,
  canAnnotationState,
  contentStatusState,
  shareContentType,
} from '@/utils/state';
import {
  CallMode,
  ContentCaptureType,
  ShareContentState,
} from '@xylink/xy-electron-sdk';

import './index.scss';
import { ipcRenderer } from 'electron';

const { SENDING } = ShareContentState;
interface IProps {
  contentPartCount: number;
}
const More = (props: IProps) => {
  const [callMode, setCallMode] = useRecoilState(callModeState);
  const [visible, setVisible] = useState(false);
  const setCurrentTabState = useSetRecoilState(currentTabState);
  const setSettingVisible = useSetRecoilState(settingModalState);
  const setToolVisible = useSetRecoilState(toolbarState);
  const [farEndControl, setFarEndControl] = useRecoilState(farEndControlState);
  const videoMuteState = useRecoilValue(videoState);
  const [annotationStatus, setAnnotationStatus] = useRecoilState(
    annotationStatusState
  );
  const confCanAnnotation = useRecoilValue(canAnnotationState);
  const contentStatus = useRecoilValue(contentStatusState);
  const contentType = useRecoilValue(shareContentType);
  const [regionWindowLoaded, setRegionWindowLoaded] = useState(false);

  useEffect(() => {
    ipcRenderer.on('regionSharingWindowLoaded', (event, loaded: boolean) => {
      console.log('regionSharingWindowLoaded', loaded)
      setRegionWindowLoaded(loaded);
    });
  }, []);

  const canAnnotation = useMemo(() => {
    // 共享弹窗加载完成才可以批注，content接收者除外
    return (regionWindowLoaded || props.contentPartCount > 0) && confCanAnnotation;
  }, [regionWindowLoaded, props.contentPartCount, confCanAnnotation]);

  useEffect(() => {
    setToolVisible((state) => ({
      ...state,
      canHidden: !visible,
    }));
  }, [visible, setToolVisible]);

  // 切换语音模式
  const switchCallMode = () => {
    setVisible(false);

    const { AudioOnly, AudioVideo } = CallMode;
    const mode = callMode === AudioVideo ? AudioOnly : AudioVideo;

    xyRTC.switchCallMode(mode);

    // 语音模式，需关闭本地摄像头
    // 退出语音模式，如果之前是开启摄像头，此时需要开启
    if (videoMuteState === 'unmuteVideo') {
      xyRTC.muteCamera(mode === AudioOnly);
    }

    // 开启语音模式时，停止遥控摄像头操作
    if (mode === AudioOnly && farEndControl.show) {
      setFarEndControl((state) => ({ ...state, show: false, callUri: '' }));
    }

    setCallMode(mode);
  };

  const onFarEndControl = () => {
    if (farEndControl.disabled) {
      return;
    }

    if (!farEndControl.show && !farEndControl.callUri) {
      message.info('当前没有可以控制的摄像头');
      return;
    }

    if (callMode === CallMode.AudioOnly) {
      message.info('语音模式下，不支持遥控摄像头操作');
      return;
    }

    setFarEndControl((state) => ({
      ...state,
      show: !state.show,
    }));
  };

  const switchAnnotation = () => {
    if (!canAnnotation) {
      return;
    }

    setAnnotationStatus((prevStatus) => {
      prevStatus ? xyRTC.stopAnnotation() : xyRTC.startAnnotation();

      if (contentStatus === SENDING) {
        // 分享者
        ipcRenderer.send('AnnotationStatus', !prevStatus);
      }

      return !prevStatus;
    });

    setVisible(false);
  };

  const content = (
    <ul className="more-select">
      {/*TODO 作为发送者，如果共享app, 目前还不支持 */}
      {((contentStatus === SENDING &&
        contentType === ContentCaptureType.SCREEN) ||
        props.contentPartCount > 0) && (
        <li
          className={!canAnnotation ? 'disabled' : ''}
          onClick={switchAnnotation}
        >
          {annotationStatus ? '停止批注' : '批注'}
        </li>
      )}

      <li onClick={switchCallMode}>
        {callMode === CallMode.AudioOnly ? '退出语音模式' : '语音模式'}
      </li>
      <li
        onClick={() => {
          setVisible(false);
        }}
      >
        <NumberKeyBoard>键盘</NumberKeyBoard>
      </li>
      <li
        onClick={() => {
          setVisible(false);
          setSettingVisible(true);
          setCurrentTabState('video-effect');
        }}
      >
        虚拟背景和美颜
      </li>
      <li
        onClick={() => {
          setVisible(false);
          setSettingVisible(true);
        }}
      >
        设置
      </li>
      <li
        className={farEndControl.disabled ? 'disabled' : ''}
        onClick={onFarEndControl}
      >
        {farEndControl.show ? '退出遥控模式' : '遥控摄像头'}
      </li>
    </ul>
  );

  return (
    <>
      <Popover
        content={content}
        visible={visible}
        onVisibleChange={setVisible}
        trigger="click"
        placement="top"
        overlayClassName="xy-popover more-select-popover"
        align={{
          offset: [0, 2],
        }}
      >
        <div className={`button`}>
          <SVG icon={'more'} />
          <div className="title">更多</div>
        </div>
      </Popover>
    </>
  );
};

export default More;
