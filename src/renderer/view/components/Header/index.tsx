/**
 * 会议头部
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IConferenceInfo, IOnHoldInfo } from '@xylink/xy-electron-sdk';
import Timer from '@/components/Timer';
import store from '@/utils/store';
import xyRTC from '@/utils/xyRTC';
import Internals from '../Internals';
import { message, Popover, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ClipboardJS from 'clipboard';
import SVG from '@/components/Svg';
import { throttle } from '@/utils';
import { useSetRecoilState } from 'recoil';
import { toolbarState } from '@/utils/state';

import './index.scss';

interface IProps {
  conferenceInfo: IConferenceInfo;
  holdInfo: IOnHoldInfo;
}

let clipboard: any;

const MeetingHeader = ({ conferenceInfo, holdInfo }: IProps) => {
  const {
    meetingNumber = '',
    displayName = '',
    numberType = '',
  } = conferenceInfo || store.get('xyMeetingInfo');

  const { isOnhold = false } = holdInfo || {};
  const [level, setLeveL] = useState(4);
  const [internalsVisible, setInternalsVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [encrypt, setEncrypt] = useState('');
  const setToolVisible = useSetRecoilState(toolbarState);

  useEffect(() => {
    setToolVisible((state) => ({
      ...state,
      canHidden: !visible,
    }));
  }, [visible]);

  useEffect(() => {
    const levelHandler = (e: number) => {
      setLeveL(e);
    };

    // 网络状况
    xyRTC.on('NetworkIndicatorLevel', levelHandler);

    return () => {
      xyRTC.off('NetworkIndicatorLevel', levelHandler);
    };
  }, []);

  useEffect(() => {
    const { encrypt } = xyRTC.getStatistics() || {};

    setEncrypt(encrypt);
  }, []);

  useEffect(() => {
    if (visible) {
      clipboard = new ClipboardJS('#copyBtn');
      clipboard.on(
        'success',
        throttle(() => {
          message.success('复制成功', 2);
        }, 2000)
      );
    }
    return () => {
      clipboard && clipboard.destroy();
    };
  }, [visible]);

  const toggleInternal = () => {
    setInternalsVisible(true);
  };

  const meetingContent = (
    <>
      <div className="meeting-popover-name" title={displayName}>
        {displayName}
      </div>
      <div className="meeting-popover-number">
        会议号：<span className="number">{meetingNumber}</span>
        <span className="copy" id="copyBtn" data-clipboard-text={meetingNumber}>
          <SVG icon="copy" />
          复制会议号
        </span>
      </div>
    </>
  );

  return (
    <div className="meeting-header">
      <span className="header-time">
        <div
          className={`header-signal signal_${level}`}
          onClick={toggleInternal}
        />
        <Tooltip
          overlayInnerStyle={{ fontSize: '12px' }}
          placement="bottomLeft"
          title={`已经使用${encrypt}加密`}
        >
          <span className="icon-encrypt" />
        </Tooltip>

        {!isOnhold && <Timer />}
      </span>

      <span className="header-conference">
        <span className="header-conference-name">
          {displayName}
          {numberType !== 'CONFERENCE' && `(${meetingNumber})`}
        </span>
        {numberType === 'CONFERENCE' && (
          <Popover
            content={meetingContent}
            visible={visible}
            onVisibleChange={setVisible}
            placement="bottom"
            overlayClassName="meeting-popover"
          >
            <ExclamationCircleOutlined className="info-icon" />
          </Popover>
        )}
      </span>

      {internalsVisible &&
        createPortal(
          <Internals
            onClose={() => {
              setInternalsVisible(false);
            }}
          />,
          document.body
        )}
    </div>
  );
};

export default MeetingHeader;
