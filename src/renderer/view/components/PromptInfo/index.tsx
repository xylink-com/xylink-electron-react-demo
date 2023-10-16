import xyRTC from '@/utils/xyRTC';
import { ContentCaptureType, ILayout, RecordStatus } from '@xylink/xy-electron-sdk';
import CloudRecordStatus from '../CloudRecordStatus';

import './index.scss';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  signInState,
  cloudRecordInfo,
  shareContentType,
  interactiveState,
  contentSharingIsPaused,
  contentSharingIsManualPaused,
} from '@/utils/state';

interface IProps {
  confCanRecord:Boolean;
  isLocalShareContent: boolean;
  chirmanUri: string;
  forceFullScreenId: string;
  content?: ILayout | null;
  setForceFullScreen: () => void;
}

const PromptInfo = (props: IProps) => {
  const { copywriting } = useRecoilValue(interactiveState);
  const sharingType = useRecoilValue(shareContentType);
  const setSharingIsManualPaused = useSetRecoilState(contentSharingIsManualPaused);
  const [sharingIsPaused, setSharingIsPaused] = useRecoilState(contentSharingIsPaused);
  const [{ promp, isSuccess }, setSignInState] = useRecoilState(signInState);
  const { recordStatus, isSelfRecord } = useRecoilValue(cloudRecordInfo);
  const {
    isLocalShareContent,
    content,
    chirmanUri,
    forceFullScreenId,
    setForceFullScreen,
  } = props;

  const renderCloudRecordStatus = () => {
    let showTimer = RecordStatus.ACTING === recordStatus ||  (RecordStatus.ACTING_BY_OTHERS === recordStatus && isSelfRecord);
    const isRecordPaused = recordStatus === RecordStatus.PAUSE_BY_OTHERS;

    if (
      [RecordStatus.IDLE,RecordStatus.IDLE_BY_OTHERS, RecordStatus.DISABLE].includes(recordStatus)
    ) {
      return null;
    }
    return (
      <div className="meeting-prompt-box">
        <CloudRecordStatus
          showTimer={showTimer}
          isRecordPaused={isRecordPaused}
        />
      </div>
    );
  };

  const renderFullScreenStatus = () => {
    if (!forceFullScreenId) {
      return null;
    }
    return (
      <div className="meeting-prompt-box">
        主屏已锁定
        <div
          className="lock-btn"
          onClick={(e) => {
            e.stopPropagation();
            setForceFullScreen();
          }}
        >
          解锁
        </div>
      </div>
    );
  };

  const switchContentSharingState = () => {
    // 是不是共享桌面
    setSharingIsManualPaused(!sharingIsPaused);
    setSharingIsPaused(!sharingIsPaused);
    // 当前是暂停共享的状态
    if (sharingIsPaused) {
      xyRTC.resumeContentCapture();
    } else {
      xyRTC.pauseContentCapture();
    }
  }

  const renderSharingStatus = () => {
    return (
      <div className="meeting-prompt-box">
        { sharingIsPaused ? '共享已暂停' : '本地共享中' }
        <div
          className="lock-btn"
          onClick={(e) => {
            e.stopPropagation();
            switchContentSharingState();
          }}
        >
          { sharingIsPaused ? '恢复' : '暂停' }
        </div>
      </div>
    )
  }

  const renderSignInStatus = () => {
    if (!promp) {
      return null;
    }

    return (
      <div className="meeting-prompt-box">
        {copywriting.notifyContent}
        {
          isSuccess ? ` (已签到)` : <div
            className="lock-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSignInState((state) => ({
                ...state,
                modal: true,
                promp: false
              }))
            }}
          >
            {copywriting.notifyLabel}
          </div>
        }
      </div>
    );
  };

  /** 共享APP是否已被暂停 */
  const appSharingIsPaused = sharingType === ContentCaptureType.APP && sharingIsPaused;

  return (
    <div className={`meeting-prompt`}>
      {renderCloudRecordStatus()}

      {chirmanUri && <div className="meeting-prompt-box">主会场模式</div>}

      {renderFullScreenStatus()}

      {renderSignInStatus()}

      {isLocalShareContent && renderSharingStatus()}

      {appSharingIsPaused && isLocalShareContent && (
        <div className="meeting-prompt-box">共享已暂停，请保持被共享应用在屏幕最上方</div>
      )}

      {content && (
        <div className="meeting-prompt-box">
          <span>{content.roster.displayName}</span>
          正在共享
        </div>
      )}
    </div>
  );
};

export default PromptInfo;
