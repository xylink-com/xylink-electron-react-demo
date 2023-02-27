/**
 * 会中底部按钮"更多" 包含设置和键盘功能
 *
 */
import { useState, useEffect } from 'react';
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
  farEndControlState
} from '@/utils/state';
import { CallMode } from '@xylink/xy-electron-sdk';

import './index.scss';

const More = () => {
  const [callMode, setCallMode] = useRecoilState(callModeState);
  const [visible, setVisible] = useState(false);
  const setSettingVisible = useSetRecoilState(settingModalState);
  const setToolVisible = useSetRecoilState(toolbarState);
  const [farEndControl, setFarEndControl] = useRecoilState(farEndControlState);
  const videoMuteState = useRecoilValue(videoState);

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

    setCallMode(mode);
  };

  const onFarEndControl = ()=>{
    if(!farEndControl.show && !farEndControl.callUri){
      message.info('当前没有可以控制的摄像头')
      return;
    }
    setFarEndControl((state) => ({
      ...state,
      show: !state.show
    }))
  }

  const content = (
    <ul className="more-select">
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
        }}
      >
        设置
      </li>
      <li
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
