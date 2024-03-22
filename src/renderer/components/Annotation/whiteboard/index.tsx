import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { AnnotationKey } from '@/type/enum';
import style from './index.module.scss';
import { ipcRenderer } from 'electron';
import { ILine } from '@xylink/xy-electron-sdk';
import cn from 'classnames';
import AnnotationBoard from './whiteboard';

const { PENCIL, ERASE, HIGHLIGHTER, MOUSE } = AnnotationKey;

export interface IProps {
  isLocalShare: boolean;
  onCleanAnnotation?: () => void; // 接收者用到
  onSendAnnotationLine?: (lineData: ILine) => void; // 接收者用到
}

const IndexView = ({
  isLocalShare,
  onCleanAnnotation,
  onSendAnnotationLine,
}: IProps) => {
  const whiteboardEleRef = useRef<HTMLDivElement>(null);
  const [currentAnnotationKey, setCurrentAnnotationKey] = useState(MOUSE);

  /**
   * 接收者通知分享者清除画板
   */
  const onNoticeClearBoard = () => {
    onCleanAnnotation?.();
  };

  /**
   * 接收者给分享者发送绘制后的数据
   *
   * @param {ILine} lineData 线数据
   */
  const onUpdateDrawData = (lineData: ILine) => {
    onSendAnnotationLine?.(lineData);
  };

  /**
   * 更新批注操作类别
   *
   * @param key 批注操作类别
   */
  const onUpdateAnnotationKey = (key: AnnotationKey) => {
    setCurrentAnnotationKey(key);
  };

  useEffect(() => {
    if (whiteboardEleRef.current) {
      new AnnotationBoard({
        isLocalShare,
        containerId: 'xyWhiteboard',
        onNoticeClearBoard,
        onUpdateDrawData,
        onUpdateAnnotationKey,
      });

      // 保存批注图片时，弹出保存路径得弹窗，导致窗口失去焦点；等弹窗消失后鼠标样式会渲染错误，没有渲染画笔样式（electron bug）；因此通过以此以下操作让鼠标样式重新渲染一下
      window.onfocus = ()=>{
        const defaultCursor = whiteboardEleRef.current!.style.cursor;
        whiteboardEleRef.current!.style.cursor = 'default';
        setTimeout(()=>{
          whiteboardEleRef.current!.style.cursor = defaultCursor;
        }, 100)
      }
    }
  }, []);

  const onMouseEnterHandle = (e: SyntheticEvent) => {
    e.stopPropagation();
    if ([PENCIL, ERASE, HIGHLIGHTER].includes(currentAnnotationKey)) {
      ipcRenderer.send('ignoreMouseEvent', false);
    } else {
      ipcRenderer.send('ignoreMouseEvent', true);
    }
  };

  const onMouseLeaveHandle = (e: SyntheticEvent) => {
    e.stopPropagation();
    ipcRenderer.send('ignoreMouseEvent', false);
  };

  return (
    <div
      ref={whiteboardEleRef}
      id="xyWhiteboard"
      className={cn(style.xyWhiteboard, style[currentAnnotationKey])}
      onMouseEnter={onMouseEnterHandle}
      onMouseLeave={onMouseLeaveHandle}
    ></div>
  );
};

export default IndexView;
