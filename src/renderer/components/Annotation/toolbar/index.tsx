import cn from 'classnames';
import style from './index.module.scss';
import { ANNOTATION_KEY_LIST, ANNOTATION_COLOR_LIST } from '@/enum';
import DraggableModal from '../DraggableModal';
import { useEffect, useState } from 'react';
import {
  AnnotationColorKey,
  AnnotationEvent,
  AnnotationKey,
} from '@/type/enum';
import { Modal, Popover } from 'antd';
import whiteboardEvent from '../whiteboard/events';
import { ipcRenderer } from 'electron';
import iconClose from '@/assets/img/annotation/close.png';
import { downloadImgFromScreen } from './downloadWhiteboard';
interface IProps {
  annotationStatus?: boolean;
  isLocalShare?: boolean;
  // videoId?: string;
  onDownload?: ()=>void;
}

const IndexView = (props: IProps) => {
  const {
    annotationStatus = false,
    isLocalShare = false,
    onDownload
  } = props;
  // 当前使用的颜色
  const [currentColor, setCurrentColor] = useState(AnnotationColorKey.RED);
  // 当前的操作类别
  const [current, setCurrent] = useState(AnnotationKey.MOUSE);
  // 显示工具栏
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 分享者监听开始/结束批注的状态，分享者的画板是在另一个单页面中，需要通过主进程传递信息
    ipcRenderer.on('AnnotationStatus', (event, msg) => {
      triggerToolbar(msg);
    });
  }, []);

  // content接收者监听开始/结束批注状态，接收者画板覆盖在content画面上，属于同一个单页面，通过props传输即可
  useEffect(() => {
    setTimeout(()=>{
      triggerToolbar(annotationStatus);
    }, 500)
  }, [annotationStatus]);

  /**
   * 开启/关闭批注工具栏，同时需要切换鼠标状态
   * @param msg 是否关闭工具栏
   */
  const triggerToolbar = (msg: boolean) => {
    setVisible(msg);
    if (msg) {
      setCurrent(AnnotationKey.PENCIL);
      whiteboardEvent.emit(AnnotationEvent.LINE, AnnotationKey.PENCIL);
    } else {
      setCurrent(AnnotationKey.MOUSE);
      whiteboardEvent.emit(AnnotationEvent.MOUSE);
    }
  };

  /**
   * 工具栏操作
   *
   * @param key 工具栏操作类别
   */
  const onHandleCurrent = (key: AnnotationKey) => {
    switch (key) {
      case AnnotationKey.MOUSE:
        setCurrent(key);
        whiteboardEvent.emit(AnnotationEvent.MOUSE);
        break;
      case AnnotationKey.PENCIL:
      case AnnotationKey.HIGHLIGHTER:
      case AnnotationKey.ERASE:
        setCurrent(key);
        whiteboardEvent.emit(AnnotationEvent.LINE, key);
        break;
      case AnnotationKey.CLEAR:
        // 二次确认
        Modal.confirm({
          title: '清除提示',
          icon: null,
          centered: true,
          okText: '确定',
          closable: false,
          cancelText: '取消',
          content: '您将清除所有人的标注内容，请确认是否继续？',
          onOk: async () => {
            whiteboardEvent.emit(AnnotationEvent.CLEAR);
          },
        });

        break;
      case AnnotationKey.SAVE:
        if (!isLocalShare) {
          onDownload?.();
        } else {
          downloadImgFromScreen();
        }
        break;
    }
  };

  const onSwitchColor = (colorKey: AnnotationColorKey) => {
    setCurrentColor(colorKey);
    whiteboardEvent.emit(AnnotationEvent.COLOR, colorKey);
  };

 /**
  * 鼠标移入工具栏，禁止鼠标点击穿透
  */
  const onMouseEnterHandle = () => {
    ipcRenderer.send('ignoreMouseEvent', false);
  };

  /**
   * 关闭批注工具栏，同时通知主窗口关闭批注
   */
  const onStopAnnotation = () => {
    triggerToolbar(false);

    ipcRenderer.send('NoticeAnnotationStatus', false);
  };

  /**
   * 选择颜色的popover弹窗
   *
   * @param child React.ReactNode
   * @returns
   */
  const renderColorPopover = (child: React.ReactNode) => {
    return (
      <Popover
        placement="bottom"
        trigger="hover"
        style={{ backgroundColor: '#000' }}
        content={
          <div className={style.colorList}>
            {ANNOTATION_COLOR_LIST.map((colorItem) => {
              return (
                <img
                  key={colorItem}
                  className={cn(style.color, style[colorItem])}
                  alt={colorItem}
                  onClick={() => onSwitchColor(colorItem)}
                />
              );
            })}
          </div>
        }
      >
        {child}
      </Popover>
    );
  };

  return (
    <DraggableModal
      visible={visible}
      width={440}
      bodyStyle={{
        padding: 0,
        lineHeight: 1,
        width: 440,
        fontSize: 12,
        borderRadius: 5,
      }}
      onMouseEnterHandle={onMouseEnterHandle}
    >
      <div className={style.container}>
        <div className={style.close} onClick={onStopAnnotation}>
          <img src={iconClose} alt="iconClose" />
        </div>

        <div className={style.buttonList}>
          {ANNOTATION_KEY_LIST.map((item) => {
            return (
              <div
                key={item.key}
                className={cn(
                  style.buttonItem,
                  current === item.key && style.active
                )}
                onClick={() => onHandleCurrent(item.key)}
              >
                <div
                  className={style.text}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.text}
                </div>

                {item.key === AnnotationKey.COLOR ? (
                  renderColorPopover(
                    <img
                      className={cn(style.icon, style[currentColor])}
                      alt={item.key}
                    />
                  )
                ) : (
                  <img
                    className={cn(style.icon, style[item.key])}
                    alt={item.key}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DraggableModal>
  );
};

export default IndexView;
