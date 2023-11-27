import { VideoFilterStyle } from '@xylink/xy-electron-sdk';
import UnsetEffect from '../UnsetEffect';

import concise from '../assets/filter/01-简洁.png';
import natural from '../assets/filter/02-自然.png';
import exquisite from '../assets/filter/03-精致.png';
import peaceful from '../assets/filter/04-宁静.png';
import soft from '../assets/filter/05-柔和.png';
import luxury from '../assets/filter/06-轻奢.png';
import youth from '../assets/filter/07-青春.png';
import rain from '../assets/filter/08-雨后.png';
import warmth from '../assets/filter/10-热情.png';
import campus from '../assets/filter/09-校园.png';
import fresh from '../assets/filter/11-清新.png';
import galaxy from '../assets/filter/12-银河.png';
import pure from '../assets/filter/13-清澈.png';
import dawn from '../assets/filter/14-清晨.png';
import dream from '../assets/filter/15-梦幻.png';
import highlight from '../assets/filter/16-高光.png';
import elegant from '../assets/filter/17-典雅.png';
import nostalgia from '../assets/filter/18-怀旧.png';
import dark from '../assets/filter/19-暗调.png';
import retro from '../assets/filter/20-老电影.png';

const {
    NONE,
    CONCISE,
    NATURAL,
    EXQUISITE,
    PEACEFUL,
    SOFT,
    LIGHT_LUXURY,
    YOUTH,
    RAIN,
    WARMTH,
    CAMPUS,
    REFRESHING,
    GALAXY,
    PURE,
    DAWN,
    DREAM,
    HIGHLIGHT,
    ELEGANT,
    NOSTALGIA,
    DARK,
    RETRO,
} = VideoFilterStyle;

export const effectList = [
    { value: NONE, label: '无', img: <UnsetEffect/> },
    { value: CONCISE, label: '简洁', img: concise },
    { value: NATURAL, label: '自然', img: natural },
    { value: EXQUISITE, label: '精致', img: exquisite },
    { value: PEACEFUL, label: '宁静', img: peaceful },
    { value: SOFT, label: '柔和', img: soft },
    { value: LIGHT_LUXURY, label: '轻奢', img: luxury },
    { value: YOUTH, label: '青春', img: youth },
    { value: RAIN, label: '雨后', img: rain },
    { value: WARMTH, label: '热情', img: warmth },
    { value: CAMPUS, label: '校园', img: campus },
    { value: REFRESHING, label: '清新', img: fresh },
    { value: GALAXY, label: '银河', img: galaxy },
    { value: PURE, label: '清澈', img: pure },
    { value: DAWN, label: '清晨', img: dawn },
    { value: DREAM, label: '梦幻', img: dream },
    { value: HIGHLIGHT, label: '高光', img: highlight },
    { value: ELEGANT, label: '典雅', img: elegant },
    { value: NOSTALGIA, label: '怀旧', img: nostalgia },
    { value: DARK, label: '暗调', img: dark },
    { value: RETRO, label: '老电影', img: retro }
];
