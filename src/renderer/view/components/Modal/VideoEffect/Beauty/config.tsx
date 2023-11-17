import { VideoBeautyStyle } from '@xylink/xy-electron-sdk';

import dermabrasion from '../assets/beauty/beauty_01.png';
import dermabrasionActive from '../assets/beauty/beauty_01_active.png';
import whitening from '../assets/beauty/beauty_02.png';
import whiteningActive from '../assets/beauty/beauty_02_active.png';
import ruddy from '../assets/beauty/beauty_03.png';
import ruddyActive from '../assets/beauty/beauty_03_active.png';

const { SMOOTH, WHITEN, BLUSH } = VideoBeautyStyle;

export const effectList = [
    { label: '磨皮', value: SMOOTH, img: dermabrasion, activeImg: dermabrasionActive },
    { label: '美白', value: WHITEN, img: whitening, activeImg: whiteningActive },
    { label: '红润', value: BLUSH, img: ruddy, activeImg: ruddyActive },
];
