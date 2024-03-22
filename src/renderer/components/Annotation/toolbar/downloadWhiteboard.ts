import { downloadUrl } from '@/utils';
import dayjs from 'dayjs';
import { ipcRenderer } from 'electron';

const callback = (_event: any, buffer: Buffer) => {
  const blob = new Blob([buffer], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `批注_${dayjs().format('YYYYMMDD_HH:mm:ss')}.png`);

  ipcRenderer.off('receiveCaptureScreenImg', callback)
}

/**
 * 共享者下载标注图片
 */
export const downloadImgFromScreen = () => {
  const { searchParams } = new URL(location.href);
  const type = searchParams.get('type') || '';

  ipcRenderer.on('receiveCaptureScreenImg', callback);

  ipcRenderer.send('captureScreenImg', type === 'fullScreen');
};
