import { ReactComponent as Signal } from '@/assets/img/svg/signal.svg';
import { ReactComponent as MeetingHost } from '@/assets/img/svg/meeting_host.svg';
import { ReactComponent as Setting } from '@/assets/img/svg/setting.svg';
import { ReactComponent as Copy } from '@/assets/img/svg/copy.svg';
import { ReactComponent as More } from '@/assets/img/svg/more.svg';
import { ReactComponent as IconMic } from '@/assets/img/svg/icon_mic.svg';
import { ReactComponent as Share } from '@/assets/img/svg/share.svg';
import { ReactComponent as ShareStop } from '@/assets/img/svg/share_stop.svg';
import { ReactComponent as Arrow } from '@/assets/img/svg/arrow.svg';
import { ReactComponent as Layout } from '@/assets/img/svg/layout.svg';
import { ReactComponent as CancelFull } from '@/assets/img/svg/cancel_full.svg';
import { ReactComponent as Full } from '@/assets/img/svg/full.svg';
import { ReactComponent as Next } from '@/assets/img/svg/next.svg';
import { ReactComponent as Previous } from '@/assets/img/svg/previous.svg';
import { ReactComponent as Camera } from '@/assets/img/svg/camera.svg';
import { ReactComponent as MuteCameraError } from '@/assets/img/svg/mute_camera_error.svg';
import { ReactComponent as MuteCamera } from '@/assets/img/svg/mute_camera.svg';
import { ReactComponent as MicNull } from '@/assets/img/svg/mic_null.svg';
import { ReactComponent as MicMute } from '@/assets/img/svg/mic_mute.svg';
import { ReactComponent as MuteMicError } from '@/assets/img/svg/mute_mic_error.svg';
import { ReactComponent as CancelMicMute } from '@/assets/img/svg/cancel_mic_mute.svg';
import { ReactComponent as HandUp } from '@/assets/img/svg/hand_up.svg';
import { ReactComponent as HandDown } from '@/assets/img/svg/hand_down.svg';
import { ReactComponent as HandEnd } from '@/assets/img/svg/hand_end.svg';
import { ReactComponent as EndCall } from '@/assets/img/svg/end_call.svg';
import { ReactComponent as Home } from '@/assets/img/svg/home.svg';
import { ReactComponent as Rotate } from '@/assets/img/svg/rotate.svg';
import { ReactComponent as Play } from '@/assets/img/svg/icon_play.svg';
import { ReactComponent as CONTENT_ONLY } from '@/assets/img/svg/CONTENT_ONLY.svg';
import { ReactComponent as GALLERY } from '@/assets/img/svg/GALLERY.svg';
import { ReactComponent as MAIN_IMAGE } from '@/assets/img/svg/MAIN_IMAGE.svg';
import { ReactComponent as MULTI_PIC_ACTIVE_HIGH_PRIORITY } from '@/assets/img/svg/MULTI_PIC_ACTIVE_HIGH_PRIORITY.svg';
import { ReactComponent as MULTI_PIC_CONTENT_HIGH_PRIORITY } from '@/assets/img/svg/MULTI_PIC_CONTENT_HIGH_PRIORITY.svg';
import { ReactComponent as SPEAKER } from '@/assets/img/svg/SPEAKER.svg';
import { ReactComponent as TWO_PIC_PIP } from '@/assets/img/svg/TWO_PIC_PIP.svg';
import { ReactComponent as TWO_PIC_SYMMETRIC } from '@/assets/img/svg/TWO_PIC_SYMMETRIC.svg';

import { ReactComponent as CONTENT_ONLY_active } from '@/assets/img/svg/CONTENT_ONLY_active.svg';
import { ReactComponent as GALLERY_active } from '@/assets/img/svg/GALLERY_active.svg';
import { ReactComponent as MAIN_IMAGE_active } from '@/assets/img/svg/MAIN_IMAGE_active.svg';
import { ReactComponent as MULTI_PIC_ACTIVE_HIGH_PRIORITY_active } from '@/assets/img/svg/MULTI_PIC_ACTIVE_HIGH_PRIORITY_active.svg';
import { ReactComponent as MULTI_PIC_CONTENT_HIGH_PRIORITY_active } from '@/assets/img/svg/MULTI_PIC_CONTENT_HIGH_PRIORITY_active.svg';
import { ReactComponent as SPEAKER_active } from '@/assets/img/svg/SPEAKER_active.svg';
import { ReactComponent as TWO_PIC_PIP_active } from '@/assets/img/svg/TWO_PIC_PIP_active.svg';
import { ReactComponent as TWO_PIC_SYMMETRIC_active } from '@/assets/img/svg/TWO_PIC_SYMMETRIC_active.svg';
import { ReactComponent as Record } from '@/assets/img/svg/record.svg';
import { ReactComponent as RecordStop } from '@/assets/img/svg/record_stop.svg';
import { ReactComponent as Subtitle } from '@/assets/img/svg/subtitle.svg';
import { ReactComponent as SubtitleStop } from '@/assets/img/svg/subtitle_stop.svg';
import { ReactComponent as OPT_MIN } from '@/assets/img/svg/min.svg';
import { ReactComponent as OPT_MAX } from '@/assets/img/svg/max.svg';
import { ReactComponent as OPT_CLOSE } from '@/assets/img/svg/close.svg';
import { ReactComponent as modalClose } from '@/assets/img/svg/close2.svg';
import { ReactComponent as OPT_WIN_MIN } from '@/assets/img/svg/min_win.svg';

import { ReactComponent as AudioOnly } from '@/assets/img/svg/audioOnly.svg';
import { ReactComponent as External } from '@/assets/img/svg/external.svg';
import { ReactComponent as Direction } from '@/assets/img/svg/direction.svg';
import { ReactComponent as Plus } from '@/assets/img/svg/plus.svg';
import { ReactComponent as Minus } from '@/assets/img/svg/minus.svg';

const IconMap: { [key: string]: any } = {
  signal: Signal,
  meeting_host: MeetingHost,
  setting: Setting,
  copy: Copy,
  more: More,
  icon_mic: IconMic,
  share: Share,
  share_stop: ShareStop,
  arrow: Arrow,
  layout: Layout,
  cancel_full: CancelFull,
  full: Full,
  next: Next,
  previous: Previous,
  camera: Camera,
  mute_camera_error: MuteCameraError,
  mute_camera: MuteCamera,
  mic_null: MicNull,
  mic_mute: MicMute,
  mute_mic_error: MuteMicError,
  cancel_mic_mute: CancelMicMute,
  hand_up: HandUp,
  hand_down: HandDown,
  hand_end: HandEnd,
  end_call: EndCall,
  home: Home,
  rotate: Rotate,
  play: Play,
  record: Record,
  record_stop: RecordStop,
  subtitle: Subtitle,
  subtitle_stop: SubtitleStop,
  SPEAKER,
  GALLERY,
  MAIN_IMAGE,
  MULTI_PIC_ACTIVE_HIGH_PRIORITY,
  MULTI_PIC_CONTENT_HIGH_PRIORITY,
  CONTENT_ONLY,
  TWO_PIC_PIP,
  TWO_PIC_SYMMETRIC,
  SPEAKER_active,
  GALLERY_active,
  MAIN_IMAGE_active,
  MULTI_PIC_ACTIVE_HIGH_PRIORITY_active,
  MULTI_PIC_CONTENT_HIGH_PRIORITY_active,
  CONTENT_ONLY_active,
  TWO_PIC_PIP_active,
  TWO_PIC_SYMMETRIC_active,
  min: OPT_MIN,
  max: OPT_MAX,
  min_win: OPT_WIN_MIN,
  close: OPT_CLOSE,
  modalClose,
  audio_only: AudioOnly,
  external: External,
  direction: Direction,
  plus: Plus,
  minus: Minus,
};

export { IconMap };
