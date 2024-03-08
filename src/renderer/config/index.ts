import { TServerEnv } from '../type';

const SERVER_MAP = {
  TXDEV: {
    httpServer: 'https://txdev-sdkapi.xylink.com',
  },
  TXQA: {
    httpServer: 'https://testqa-sdkapi.xylink.com',
  },
  PRE: {
    httpServer: 'https://precloudapi.xylink.com',
  },
  PRD: {
    httpServer: 'https://cloudapi.xylink.com',
  },
};

/**
 * 重要提示
 * 重要提示
 * 重要提示
 * PRODUCTION_ACCOUNT需要自行配置
 * 第三方登录，需要填写extId、clientId、clientSecret(1.3.4 版本以上，clientSecret不再使用，可不用配置)
 * 此值需要从对接负责人处获取
 * 重要提示
 * 重要提示
 * 重要提示
 */
const PRODUCTION_ACCOUNT = {
  extId: '0142901e3d83e0a1e225ef92b8663fcaebda7242',
  clientId: 'PsdkO7Sn3ysuIZA9GiVv90D7',
  clientSecret: '1mIkLWUf2uHkUmpoY9YJoUFXdcLGJSeH',
};

const THIRD_ACCOUNT_MAP = {
  TXDEV: {
    clientId: 'sGjH2V76MgCEszDxUOCmOmpn',
    clientSecret: '4OfaY7WRUBGFxzWvqEEiyaOlaogC8UYQ',
    extId: 'd3ec6f6200f798bcaadb479f3aa747c215eaf0f3',
  },
  TXQA: {
    // 7b4cfd22962c460c2c168fc29637140f8a23cd9b
// 9GAhEQRjPyoXQwdEnygHhNzB
// 48f57sTtGhtT12dzNYNhp77Ib3qYSn2y
    extId: '6d9cb3bc7556dd97467aabae448f037737a0ef7b',
    clientId: 'FSvbD7aTmE38cbWjgX06pP6A',
    clientSecret: 'VK4NrmckJrTnDWwC2ThuvpR1sq7q87tJ',
  },
  PRE: {
    extId: '94eb7ae1860451435556a46b96a743b0f6e4351f',
    clientId: 'jBSENo2jINkrlsqu1hJWeaXD',
    clientSecret: 'IIhbtnReNE5pINFgV9NXYhLUlgLAx0HM',
  },
  PRD: PRODUCTION_ACCOUNT,
};

export const SERVER = (env: TServerEnv) => SERVER_MAP[env];
export const ACCOUNT = (env: TServerEnv) => {
  const key =
    <TServerEnv>(
      Object.keys(THIRD_ACCOUNT_MAP).find(
        (key) => env.toLocaleUpperCase().indexOf(key) > -1
      )
    ) || 'PRD';

  return THIRD_ACCOUNT_MAP[key] || THIRD_ACCOUNT_MAP['PRD'];
};
