/**
 * 等候室、被设置onHold
 */
import store from '@/utils/store';
import { IConferenceInfo } from '@xylink/xy-electron-sdk';
import './index.scss';

interface IProps {
  conferenceInfo: IConferenceInfo;
  stopMeeting: (isConfirm: boolean) => void;
}

const Hold = (props: IProps) => {
  const { displayName = '', meetingNumber = '' } =
    props.conferenceInfo || store.get('xyMeetingInfo');

  return (
    <div className="hold">
      <div className="hold-content">
        <p className="hold-title">请稍等，主持人稍后邀请您入会</p>

        <p className="hold-conference-title">会议主题</p>
        <p className="hold-conference">{displayName || meetingNumber}</p>
      </div>
      <div className="hold-level-meeting">
        <span
          onClick={() => {
            props.stopMeeting(false);
          }}
        >
          离开会议
        </span>
      </div>
    </div>
  );
};

export default Hold;
