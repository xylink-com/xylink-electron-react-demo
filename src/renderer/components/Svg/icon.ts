import { ReactComponent as MeetingHost } from '@/assets/img/svg/meeting_host.svg';
import { ReactComponent as Setting } from '@/assets/img/svg/setting.svg';
import { ReactComponent as Copy } from '@/assets/img/svg/copy.svg';
import { ReactComponent as More } from '@/assets/img/svg/more.svg';
import { ReactComponent as Share } from '@/assets/img/svg/share.svg';
import { ReactComponent as ShareStop } from '@/assets/img/svg/share_stop.svg';
import { ReactComponent as Arrow } from '@/assets/img/svg/arrow.svg';
import { ReactComponent as Layout } from '@/assets/img/svg/layout.svg';
import { ReactComponent as Full } from '@/assets/img/svg/full.svg';
import { ReactComponent as Next } from '@/assets/img/svg/next.svg';
import { ReactComponent as Previous } from '@/assets/img/svg/previous.svg';
import { ReactComponent as Camera } from '@/assets/img/svg/camera.svg';
import { ReactComponent as MuteCamera } from '@/assets/img/svg/mute_camera.svg';
import { ReactComponent as MicNull } from '@/assets/img/svg/mic_null.svg';
import { ReactComponent as MicMute } from '@/assets/img/svg/mic_mute.svg';
import { ReactComponent as CancelMicMute } from '@/assets/img/svg/cancel_mic_mute.svg';
import { ReactComponent as HandUp } from '@/assets/img/svg/hand_up.svg';
import { ReactComponent as HandDown } from '@/assets/img/svg/hand_down.svg';
import { ReactComponent as HandEnd } from '@/assets/img/svg/hand_end.svg';
import { ReactComponent as EndCall } from '@/assets/img/svg/end_call.svg';
import { ReactComponent as Home } from '@/assets/img/svg/home.svg';
import { ReactComponent as Record } from '@/assets/img/svg/record.svg';
import { ReactComponent as RecordStop } from '@/assets/img/svg/record_stop.svg';
import { ReactComponent as Subtitle } from '@/assets/img/svg/subtitle.svg';
import { ReactComponent as SubtitleStop } from '@/assets/img/svg/subtitle_stop.svg';
import { ReactComponent as OPT_MIN } from '@/assets/img/svg/min.svg';
import { ReactComponent as OPT_MAX } from '@/assets/img/svg/max.svg';
import { ReactComponent as OPT_CLOSE } from '@/assets/img/svg/close.svg';
import { ReactComponent as OPT_WIN_MIN } from '@/assets/img/svg/min_win.svg';
import { ReactComponent as AudioOnly } from '@/assets/img/svg/audioOnly.svg';

const IconMap: { [key: string]: any } = {
  meeting_host: MeetingHost,
  setting: Setting,
  copy: Copy,
  more: More,
  share: Share,
  share_stop: ShareStop,
  arrow: Arrow,
  layout: Layout,
  full: Full,
  next: Next,
  previous: Previous,
  camera: Camera,
  mute_camera: MuteCamera,
  mic_null: MicNull,
  mic_mute: MicMute,
  cancel_mic_mute: CancelMicMute,
  hand_up: HandUp,
  hand_down: HandDown,
  hand_end: HandEnd,
  end_call: EndCall,
  home: Home,
  record: Record,
  record_stop: RecordStop,
  subtitle: Subtitle,
  subtitle_stop: SubtitleStop,
  min: OPT_MIN,
  max: OPT_MAX,
  min_win: OPT_WIN_MIN,
  close: OPT_CLOSE,
  audio_only: AudioOnly
};

export { IconMap };
