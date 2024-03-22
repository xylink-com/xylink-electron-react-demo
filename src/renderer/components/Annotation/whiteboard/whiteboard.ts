import { ANNOTATION_COLOR, ANNOTATION_WIDTH } from '@/enum';
import {
  AnnotationColorKey,
  AnnotationEvent,
  AnnotationKey,
} from '@/type/enum';
import { ILine, IReceiveLine } from '@xylink/xy-electron-sdk';
import {
  DRAW_TYPE,
  DrawJsonData,
  Whiteboard,
  EVENT as WhiteboardEvent,
} from '@xylink/xy-whiteboard';
import { ipcRenderer } from 'electron';
import toolbarEvent from './events';
import { IPencilAnnotationKey } from '@/type';

const { PENCIL, ERASE, HIGHLIGHTER , MOUSE} = AnnotationKey;
const { RED } = AnnotationColorKey;

const DEFAULT_WHITEBOARD_CONFIG = {
  drawType: DRAW_TYPE.NONE,
  strokeColor: ANNOTATION_COLOR[RED] + 'ff',
  strokeWidth: ANNOTATION_WIDTH[PENCIL],
};

interface IConfig {
  isLocalShare: boolean;
  // 白板container 父元素
  containerId: string;
  // 切换操作类别
  onUpdateAnnotationKey: (key: AnnotationKey) => void;
  // 接收者会由此回调，需要给分享者发送绘制后的数据
  onUpdateDrawData: (lineData: ILine) => void;
  // 接收者会由此回调, 通知分享者清除画板
  onNoticeClearBoard: () => void;
}
class AnnotationBoard {
  private config: IConfig;
  private board: Whiteboard;
  private currentAnnotationKey: AnnotationKey = MOUSE;
  private currentColorKey: AnnotationColorKey = RED;

  private container: HTMLElement = document.body;
  private isLocalShare = true;
  private canvasClearTimer: NodeJS.Timeout | undefined;

  constructor(config: IConfig) {
    const { drawType, strokeColor } = DEFAULT_WHITEBOARD_CONFIG;
    const { containerId, isLocalShare } = config;
    const container = document.getElementById(containerId)!;

    this.container = container;
    this.isLocalShare = isLocalShare;
    this.config = config;
    this.board = new Whiteboard({
      containerId,
      width: container.clientWidth,
      height: container.clientHeight,
      drawType,
      config: {
        backgroundColor: 'transparent',
        stroke: strokeColor,
        strokeWidth: this.calcLineWeight(),
      },
    });

    this.initBoardEvent();
    this.initToolbarEvent();
    this.onReceiveRemoteDraw();
    this.observerParentSize();
  }

  /**
   * 计算线宽，接收content者，画板大小与content画面大小一致，线宽会等比例缩放
   * @returns {number}
   */
  private calcLineWeight() {
    const dpr = window.devicePixelRatio || 1;
    let calcStrokeWidth = DEFAULT_WHITEBOARD_CONFIG.strokeWidth;

    if ([PENCIL, HIGHLIGHTER, ERASE].includes(this.currentAnnotationKey)) {
      const remoteScale = (this.container?.clientWidth || 1000) / 1000;
      const scale = this.isLocalShare ? 1 : remoteScale;

      calcStrokeWidth =
        (ANNOTATION_WIDTH[this.currentAnnotationKey as IPencilAnnotationKey] /
          dpr) *
        scale;
    }

    return calcStrokeWidth;
  }

  /**
   * 初始化绘制画板
   */
  private initBoardEvent() {
    this.board.on(WhiteboardEvent.DRAW_TYPE, (type: DRAW_TYPE) => {
      const { PENCIL, ERASER } = DRAW_TYPE;
      if ([PENCIL, ERASER].includes(type)) {
        ipcRenderer.send('ignoreMouseEvent', false);
      }else{
        ipcRenderer.send('ignoreMouseEvent', true);
      }
    });

    if (!this.isLocalShare) {
      this.board.on(WhiteboardEvent.DRAW_DATA, (data: DrawJsonData) => {
        // 数据处理并发送数据
        const widthScale = 1000 / (this.container?.clientWidth || 1000);
        const heightScale = 1000 / (this.container?.clientHeight || 1000);

        const points = data.attrs.points.map(
          (item: { x: number; y: number }) => {
            return {
              x: Math.round(item.x * widthScale * 10) / 10,
              y: Math.round(item.y * heightScale * 10) / 10,
            };
          }
        );

        this.config.onUpdateDrawData({
          weight:
            ANNOTATION_WIDTH[this.currentAnnotationKey as IPencilAnnotationKey] || 3,
          color: data.attrs.stroke,
          ended: true,
          points,
        });

        // 清除画板
        if (this.canvasClearTimer) {
          clearTimeout(this.canvasClearTimer);
          this.canvasClearTimer = undefined;
        }
        this.canvasClearTimer = setTimeout(() => {
          this.board?.clear();
        }, 1000);
      });
    }
  }

  /**
   * 监听工具栏事件
   */
  private initToolbarEvent() {
    // 切换成鼠标
    toolbarEvent.on(AnnotationEvent.MOUSE, () => {
      this.currentAnnotationKey = AnnotationKey.MOUSE;
      this.board?.switchDrawType(DRAW_TYPE.NONE);
      this.config.onUpdateAnnotationKey(AnnotationKey.MOUSE);
    });

    // 切换绘制线条类型
    toolbarEvent.on(
      AnnotationEvent.LINE,
      (
        lineType:
          | AnnotationKey.PENCIL
          | AnnotationKey.ERASE
          | AnnotationKey.HIGHLIGHTER
      ) => {
        this.currentAnnotationKey = lineType;

        this.board?.switchDrawType(
          lineType === ERASE ? DRAW_TYPE.ERASER : DRAW_TYPE.PENCIL
        );
        this.board?.setStrokeWidth(this.calcLineWeight());

        // 橡皮擦不需要颜色
        if (lineType !== ERASE) {
          this.board?.setStrokeColor(
            ANNOTATION_COLOR[this.currentColorKey || RED] +
              (lineType === PENCIL ? 'ff' : '7f')
          );
        }

        this.config.onUpdateAnnotationKey(lineType);
      }
    );

    // 清空面板
    toolbarEvent.on(AnnotationEvent.CLEAR, () => {
      this.board?.clear();

      if (!this.isLocalShare) {
        this.config.onNoticeClearBoard();
      }
    });

    // 颜色切换
    toolbarEvent.on(AnnotationEvent.COLOR, (color: AnnotationColorKey) => {
      this.currentColorKey = color;

      if ([PENCIL, HIGHLIGHTER].includes(this.currentAnnotationKey)) {
        const opacify = this.currentAnnotationKey === PENCIL ? 'ff' : '7f';
        this.board?.setStrokeColor(ANNOTATION_COLOR[color] + opacify);
      }
    });
  }

  /**
   * 共享者接收远端绘制的数据
   */
  private onReceiveRemoteDraw() {
    ipcRenderer.on(
      'AnnotationReceiveLine',
      (_event: any, line: IReceiveLine) => {
        const dpr = window.devicePixelRatio || 1;
        const widthScale = 1000 / (this.container.clientWidth || 1000);
        const heightScale = 1000 / (this.container.clientHeight || 1000);

        const points = line.points.map((item) => {
          return {
            x: Math.round((item.x / widthScale) * 10) / 10,
            y: Math.round((item.y / heightScale) * 10) / 10,
          };
        });

        this.board.setCanvasByJson({
          className: 'Line',
          attrs: {
            name: 'line',
            points,
            stroke: line.color,
            strokeWidth: line.weight / dpr,
          },
        });
      }
    );

    ipcRenderer.on('AnnotationClean', () => {
      this.board.clear();
    });
  }

  /**
   * 监听父元素大小变化，实时更新画板大小
   */
  private observerParentSize() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.board?.setCanvasSize({ width, height, scale: false });
        if ([PENCIL, HIGHLIGHTER, ERASE].includes(this.currentAnnotationKey)) {
          this.board?.setStrokeWidth(this.calcLineWeight());
        }
      }
    });

    resizeObserver.observe(this.container);
  }

  /**
   * 实例销毁
   */
  // public destroy() {
  //   this.board.destroy();
  //   this.canvasClearTimer = undefined;
  //   this.container = document.body;
  //   this.currentAnnotationKey = PENCIL;
  //   this.currentColorKey = RED;
  //   this.isLocalShare = true;
  // }
}

export default AnnotationBoard;
