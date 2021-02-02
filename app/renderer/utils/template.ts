/**
 * Meeting layout init template data
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2019-10-24 20:41:38
 */

 import { ITemplate } from "../type/index"

// const temp = {
// 	id: 'local',
// 	stream: {},
// 	position: [ 0.75, 0.125, 0.25, 0.33 ],
// 	roster: {},
// 	status: '',
// 	seat: 0,
// 	display: true
// };

/**
 * 画廊模式：
 * 2 0.2812
 * 3-4 0.5625
 * 5-6 0.375
 * 7-8 0.5625
 *
 * 演讲者模式：
 * 2-4 0.4218
 * 5-8 0.5625
 */

// 9:16的比例
export const RATE = 0.5625;

export const hidePosition = [-30, -30, 1, 1];

export const SPEAKER_TEMPLATE = {
  "1-1": [
    {
      position: [0, 0, 1, 1],
    },
  ],
  "2-1": [
    {
      position: [0.75, 0, 0.25, 0.333],
    },
    {
      position: [0, 0, 0.75, 1],
    },
  ],
  "3-1": [
    {
      position: [0.75, 0, 0.25, 0.333],
    },
    {
      position: [0, 0, 0.75, 1],
    },
    {
      position: [0.75, 0.333, 0.25, 0.333],
    },
  ],
  "4-1": [
    {
      position: [0.75, 0, 0.25, 0.333],
    },
    {
      position: [0, 0, 0.75, 1],
    },
    {
      position: [0.75, 0.333, 0.25, 0.333],
    },
    {
      position: [0.75, 0.666, 0.25, 0.333],
    },
  ],
  "5-1": [
    {
      position: [0, 0.75, 0.25, 0.25],
    },
    {
      position: [0.125, 0, 0.75, 0.75],
    },
    {
      position: [0.25, 0.75, 0.25, 0.25],
    },
    {
      position: [0.5, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.75, 0.25, 0.25],
    },
  ],
  "6-1": [
    {
      position: [0, 0.75, 0.25, 0.25],
    },
    {
      position: [0, 0, 0.75, 0.75],
    },
    {
      position: [0.25, 0.75, 0.25, 0.25],
    },
    {
      position: [0.5, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.5, 0.25, 0.25],
    },
  ],
  "7-1": [
    {
      position: [0, 0.75, 0.25, 0.25],
    },
    {
      position: [0, 0, 0.75, 0.75],
    },
    {
      position: [0.25, 0.75, 0.25, 0.25],
    },
    {
      position: [0.5, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.5, 0.25, 0.25],
    },
    {
      position: [0.75, 0.25, 0.25, 0.25],
    },
  ],
  "8-1": [
    {
      position: [0, 0.75, 0.25, 0.25],
    },
    {
      position: [0, 0, 0.75, 0.75],
    },
    {
      position: [0.25, 0.75, 0.25, 0.25],
    },
    {
      position: [0.5, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.75, 0.25, 0.25],
    },
    {
      position: [0.75, 0.5, 0.25, 0.25],
    },
    {
      position: [0.75, 0.25, 0.25, 0.25],
    },
    {
      position: [0.75, 0, 0.25, 0.25],
    },
  ],
};

export const GALLERY_TEMPLATE = {
  "1-1": [
    {
      position: [0, 0, 1, 1],
    },
  ],
  "2-2": [
    {
      position: [0, 0, 0.5, 1],
    },
    {
      position: [0.5, 0, 0.5, 1],
    },
  ],
  "3-2": [
    {
      position: [0, 0.5, 0.5, 0.5],
    },
    {
      position: [0.25, 0, 0.5, 0.5],
    },
    {
      position: [0.5, 0.5, 0.5, 0.5],
    },
  ],
  "4-2": [
    {
      position: [0, 0.5, 0.5, 0.5],
    },
    {
      position: [0, 0, 0.5, 0.5],
    },
    {
      position: [0.5, 0.5, 0.5, 0.5],
    },
    {
      position: [0.5, 0, 0.5, 0.5],
    },
  ],
  "5-2": [
    {
      position: [0, 0.5, 0.333, 0.5],
    },
    {
      position: [0, 0, 0.333, 0.5],
    },
    {
      position: [0.333, 0.5, 0.333, 0.5],
    },
    {
      position: [0.333, 0, 0.333, 0.5],
    },
    {
      position: [0.666, 0, 0.333, 0.5],
    },
  ],
  "6-2": [
    {
      position: [0, 0.5, 0.333, 0.5],
    },
    {
      position: [0, 0, 0.333, 0.5],
    },
    {
      position: [0.333, 0.5, 0.333, 0.5],
    },
    {
      position: [0.333, 0, 0.333, 0.5],
    },
    {
      position: [0.666, 0, 0.333, 0.5],
    },
    {
      position: [0.666, 0.5, 0.333, 0.5],
    },
  ],
  "7-2": [
    {
      position: [0, 0.666, 0.333, 0.333],
    },
    {
      position: [0, 0, 0.333, 0.333],
    },
    {
      position: [0.333, 0.333, 0.333, 0.333],
    },
    {
      position: [0.333, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0.333, 0.333, 0.333],
    },
    {
      position: [0, 0.333, 0.333, 0.333],
    },
  ],
  "8-2": [
    {
      position: [0, 0.666, 0.333, 0.333],
    },
    {
      position: [0, 0, 0.333, 0.333],
    },
    {
      position: [0.333, 0.333, 0.333, 0.333],
    },
    {
      position: [0.333, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0.333, 0.333, 0.333],
    },
    {
      position: [0, 0.333, 0.333, 0.333],
    },
    {
      position: [0.333, 0.666, 0.333, 0.333],
    },
  ],
  "9-2": [
    {
      position: [0, 0.666, 0.333, 0.333],
    },
    {
      position: [0, 0, 0.333, 0.333],
    },
    {
      position: [0.333, 0.333, 0.333, 0.333],
    },
    {
      position: [0.333, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0, 0.333, 0.333],
    },
    {
      position: [0.666, 0.333, 0.333, 0.333],
    },
    {
      position: [0, 0.333, 0.333, 0.333],
    },
    {
      position: [0.333, 0.666, 0.333, 0.333],
    },
    {
      position: [0.666, 0.666, 0.333, 0.333],
    },
  ],
};

// template模版数据包含自己，所以length为6是，代表有5个远端画面，一个本地画面
// 增加rate，方便计算容器的宽高
export const TEMPLATE: ITemplate = {
  SPEAKER: {
    length: 8,
    temp: {
      0: SPEAKER_TEMPLATE["1-1"],
      1: SPEAKER_TEMPLATE["1-1"],
      2: SPEAKER_TEMPLATE["2-1"],
      3: SPEAKER_TEMPLATE["3-1"],
      4: SPEAKER_TEMPLATE["4-1"],
      5: SPEAKER_TEMPLATE["5-1"],
      6: SPEAKER_TEMPLATE["6-1"],
      7: SPEAKER_TEMPLATE["7-1"],
      8: SPEAKER_TEMPLATE["8-1"],
    },
    rate: {
      0: 0.5625,
      1: 0.5625,
      2: 0.4218,
      3: 0.4218,
      4: 0.4218,
      5: 0.5625,
      6: 0.5625,
      7: 0.5625,
      8: 0.5625,
    },
  },
  GALLERY: {
    length: 9,
    temp: {
      0: GALLERY_TEMPLATE["1-1"],
      1: GALLERY_TEMPLATE["1-1"],
      2: GALLERY_TEMPLATE["2-2"],
      3: GALLERY_TEMPLATE["3-2"],
      4: GALLERY_TEMPLATE["4-2"],
      5: GALLERY_TEMPLATE["5-2"],
      6: GALLERY_TEMPLATE["6-2"],
      7: GALLERY_TEMPLATE["7-2"],
      8: GALLERY_TEMPLATE["8-2"],
      9: GALLERY_TEMPLATE["9-2"],
    },
    rate: {
      0: 0.5625,
      1: 0.5625,
      2: 0.2812,
      3: 0.5625,
      4: 0.5625,
      5: 0.375,
      6: 0.375,
      7: 0.5625,
      8: 0.5625,
      9: 0.5625,
    },
  },
};
