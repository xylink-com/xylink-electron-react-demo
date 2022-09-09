/**
 * Header
 */
import { ipcRenderer } from 'electron';
import { IpcRendererEvent } from 'electron/renderer';
import { ReactNode, useEffect, useState } from 'react';
import { isMac } from '@/utils';
import SVG from '../Svg';
import './index.scss';

interface IProps {
  isOpt?: boolean; // 是否显示操作按钮
  maximize?: boolean; // 是否支持放大窗口
  className?: string;
  children?: ReactNode;
  appCloseHandler?: () => void;
}
const AppHeader = (props: IProps) => {
  const { maximize = true, isOpt = true, className = '' } = props;
  const [isMax, setMaxStatus] = useState(false);

  useEffect(() => {
    const handleMaxStatus = (event: IpcRendererEvent, isMax: boolean) => {
      setMaxStatus(isMax);
    };

    ipcRenderer.on('win-fs-status', handleMaxStatus);

    return () => {
      ipcRenderer.off('win-fs-status', handleMaxStatus);
    };
  }, []);

  const appMinusHandler = () => {
    ipcRenderer.send('window-minus');
  };

  const appFullScreenHandler = () => {
    ipcRenderer.send('window-toggle-fullscreen', !isMax);
  };

  const appCloseHandler = () => {
    if (props.appCloseHandler) {
      props.appCloseHandler();
    } else {
      ipcRenderer.send('window-close');
    }
  };

  return (
    <div className={`app-header ${className}`}>
      <div className="app-header-content">{props.children}</div>

      {!isMac && isOpt && (
        <div className="app-opt-bar">
          <span className="opt-item app-minus" onClick={appMinusHandler}>
            <SVG icon="min" />
          </span>

          {maximize && (
            <span
              v-if="showFs"
              className="opt-item app-fs"
              onClick={appFullScreenHandler}
            >
              <SVG icon={isMax ? 'min_win' : 'max'} />
            </span>
          )}

          <span className="opt-item app-close" onClick={appCloseHandler}>
            <SVG icon="close" />
          </span>
        </div>
      )}
    </div>
  );
};

export default AppHeader;
