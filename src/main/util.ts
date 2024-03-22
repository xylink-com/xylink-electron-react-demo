// import { URL } from 'url';
import path from 'path';
import { app, systemPreferences } from 'electron';
import { format } from 'url';
import log from 'electron-log';

export let resolveHtmlPath: (htmlFileName: string, hashName?: string,  search?: string) => string;

const { platform, env } = process;

export const isMac = platform === 'darwin';
export const isWin = platform === 'win32';
export const isLinux = platform === 'linux';
export const isDevelopment = env.NODE_ENV === 'development';

export const isShowFrame = isMac || isLinux;

if (isDevelopment) {
  const port = env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string, hashName = '', search ='') => {
    let url = `http://localhost:${port}/${htmlFileName}`;
    if (search) {
      url += search;
    }
    if (hashName) {
      url += `#${hashName}`;
    }

    return url;
  };
} else {
  resolveHtmlPath = (htmlFileName: string, hashName = '', search ='') => {
    return format({
      pathname: path.join(__dirname, '../renderer/', htmlFileName),
      protocol: 'file',
      hash: hashName,
      search,
      slashes: true,
    });
  };
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export const checkCameraAccess = async () => {
  const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera');

  log.info('[checkDeviceAccessPrivilege] cameraPrivilege:', cameraPrivilege);

  if (cameraPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }
};

export const checkMicrophoneAccess = async () => {
  const micPrivilege = systemPreferences.getMediaAccessStatus('microphone');

  log.info('[checkDeviceAccessPrivilege] micPrivilege:', micPrivilege);

  if (micPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone');
  }
};

// 检查设备访问权限
export const checkDeviceAccessPrivilege = async () => {
  await checkCameraAccess();

  await checkMicrophoneAccess();

  const screenPrivilege = systemPreferences.getMediaAccessStatus('screen');

  log.info('[checkDeviceAccessPrivilege] screenPrivilege:', screenPrivilege);
};
