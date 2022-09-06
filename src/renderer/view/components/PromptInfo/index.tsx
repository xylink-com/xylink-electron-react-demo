import { RECORD_STATE_MAP } from '@/enum';
import { IRecordPermission, ILayout } from '@xylink/xy-electron-sdk';
import CloudRecordStatus from '../CloudRecordStatus';

import './index.scss';

interface IProps {
  recordPermission: IRecordPermission;
  isRecordPaused: boolean;
  isLocalShareContent: boolean;
  chirmanUri: string;
  recordStatus: number;
  forceFullScreenId: string;
  content?: ILayout | null;
  setForceFullScreen: () => void;
}

const PromptInfo = (props: IProps) => {
  const {
    recordPermission,
    isRecordPaused,
    isLocalShareContent,
    content,
    chirmanUri,
    recordStatus,
    forceFullScreenId,
    setForceFullScreen,
  } = props;

  const renderCloudRecordStatus = () => {
    if (
      !recordPermission.isStartRecord &&
      RECORD_STATE_MAP.acting !== recordStatus
    ) {
      return null;
    }
    return (
      <div className="meeting-prompt-box">
        <CloudRecordStatus
          showTimer={RECORD_STATE_MAP.acting === recordStatus}
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

  return (
    <div className={`meeting-prompt`}>
      {renderCloudRecordStatus()}

      {chirmanUri && <div className="meeting-prompt-box">主会场模式</div>}

      {renderFullScreenStatus()}

      {isLocalShareContent && (
        <div className="meeting-prompt-box">本地共享中</div>
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
