import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Menu,
  Tray,
  powerMonitor,
  desktopCapturer,
  crashReporter
} from 'electron';
import Store from 'electron-store';
import MenuBuilder from './menu';
import {
  checkDeviceAccessPrivilege,
  getAssetPath,
  isMac,
  isWin,
  isShowFrame,
  resolveHtmlPath,
} from './util';
import log from 'electron-log';
import { release } from 'os';
import path from 'path';

Store.initRenderer();

const isDevelopment = process.env.NODE_ENV !== 'production';

// on Linux: ~/.config/{app name}/logs/{process type}.log
// on macOS: ~/Library/Logs/{app name}/{process type}.log
// on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log

log.info('process info:', {
  electron: process.versions.electron,
  architecture: process.env.PROCESSOR_ARCHITECTURE,
  node: process.versions.node,
  chrome: process.versions.chrome,
  userData: app.getPath('userData'),
  crashDumps: app.getPath('crashDumps'),
  appData: app.getPath('appData'),
  temp: app.getPath('temp'),
  exe: app.getPath('exe'),
  logs: app.getPath('logs'),
  app: app.getAppPath(),
});

const width = 960;
const height = 600;

// 外接屏幕窗口引用
let externalWindow: BrowserWindow | null = null;
// 主窗口引用
let mainWindow: BrowserWindow | null = null;
// 会控窗口
let meetingControlWindow: BrowserWindow | null = null;

let webMeetingWindow: BrowserWindow | null = null;
// 区域共享弹窗
let screenRegionShareWindow: BrowserWindow | null = null;

const icon = getAssetPath('logo512.png');

let number = ''; // 会议号
const PROTOCOL = 'xylink-electron';


app.setPath('crashDumps', app.getPath('logs'));
crashReporter.start({ uploadToServer: false, ignoreSystemCrashHandler:false, rateLimit :false });

function registerScheme() {
  if (isWin) {
    const args = [];
    if (!app.isPackaged) {
      args.push(path.resolve(process.argv[1]));
    }
    args.push('--');

    // if (!app.isDefaultProtocolClient(PROTOCOL, process.execPath, args)) {
    //   app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);
    // }
    // app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);

    handleArgv(args);
  }
}

registerScheme();

function handleArgv(argv: string[]) {
  const prefix = `${PROTOCOL}:`;

  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(url: string) {
  // xylink-electron://joinMeeting?number=123
  const urlObj = new URL(url);
  const { searchParams } = urlObj;
  number = searchParams.get('number') || '';

  // createWindow可传入此参数，做其他业务处理
  log.log('handleUrl number:', number);
}

// 即使GPU奔溃，仍然可以使用webgl api
app.disableDomainBlockingFor3DAPIs();

// electron 的硬件加速功能，在 win7 或者 Linux 系统上，容易出现黑屏或者卡死
// 禁用硬件加速，共享屏幕批注白板时，会大概率出现穿透的问题
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// 缩小窗口
ipcMain.on('window-minus', () => {
  if (mainWindow) {
    if (!mainWindow.isMinimized()) mainWindow.minimize();
  }
});

// 关闭窗口
ipcMain.on('window-close', () => {
  if (mainWindow && isWin) {
    mainWindow.setSkipTaskbar(true);
    mainWindow.hide(); // 隐藏窗口
  }
});

// 放大缩小
ipcMain.on('window-toggle-fullscreen', (event, isFs: boolean) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isMac) {
      mainWindow.setFullScreen(isFs);

      mainWindow?.webContents.send('win-fs-status', isFs);
    } else {
      mainWindow.isMaximized()
        ? mainWindow.unmaximize()
        : mainWindow.maximize();

      mainWindow.webContents.send('win-fs-status', mainWindow.isMaximized());
    }
  }

  event.preventDefault();
});

// mac 退出全屏
ipcMain.on('exit-fullscreen', (event) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setFullScreen(false);

    mainWindow.setContentSize(width, height);
  }

  event.preventDefault();
});

// 设置窗口是否可以被用户全屏
ipcMain.on('resizable', (event, isResizable) => {
  if (isMac && mainWindow) {
    mainWindow.setResizable(isResizable);
    mainWindow.setMinimizable(isResizable);
    mainWindow.setMaximizable(isResizable);
    mainWindow.setFullScreenable(isResizable);
  }
});

// 主动申请一次摄像头、麦克风权限
ipcMain.on('check-device-access-privilege', async () => {
  await checkDeviceAccessPrivilege();

  mainWindow && mainWindow.webContents.send('check-device-finished', true);
});

// 重新打开窗口
ipcMain.on('relaunch', () => {
  app.relaunch();
  app.exit(0);
});

// 主窗口通知主进程关闭外接屏幕窗口
ipcMain.on('closeExternalWindow', (event, msg) => {
  console.log('closed external window');

  if (msg) {
    externalWindow && externalWindow.close();
  }
});

// 打开外接屏
ipcMain.on('openWindow', (event, arg) => {
  if (arg) {
    const displays = screen.getAllDisplays();

    console.log('displays', displays);
    const externalDisplay = displays.find((display) => {
      return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    console.log('args: ', arg);
    console.log('externalDisplay: ', externalDisplay);

    if (externalWindow) {
      externalWindow.close();
    }

    if (externalDisplay) {
      mainWindow && mainWindow.webContents.send('secondWindow', true);

      externalWindow = new BrowserWindow({
        x: externalDisplay.bounds.x + 50,
        y: externalDisplay.bounds.y + 50,
        width: 1000,
        height: 660,
        backgroundColor: '#fff',
        titleBarStyle: 'hidden',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
        title: '小鱼Electron 外接屏幕',
        show: false,
        icon,
      });

      if (isDevelopment) {
        externalWindow.webContents.openDevTools();
      }

      externalWindow.loadURL(resolveHtmlPath('index.html', '/slaveScreen'));

      externalWindow.webContents.on('did-finish-load', () => {
        const winId = {
          externalId: externalWindow?.webContents.id,
          mainId: mainWindow?.webContents.id,
        };

        // 向外接屏幕发送当前窗口和主窗口的窗口id信息，便于渲染进程之间通信
        mainWindow && mainWindow.webContents.send('currentWindowId', winId);
        externalWindow &&
          externalWindow.webContents.send('currentWindowId', winId);

        mainWindow && mainWindow.webContents.send('domReady', true);
      });

      externalWindow.once('ready-to-show', () => {
        externalWindow && externalWindow.show();
      });

      externalWindow.on('close', () => {
        console.log('close external window');

        if (mainWindow) {
          mainWindow.webContents.send('clearTimer', true);
          mainWindow.webContents.send('closedExternalWindow', true);
        }

        if (externalWindow) {
          externalWindow.webContents.send('closedExternalWindow', true);
        }
      });

      externalWindow.on('closed', () => {
        console.log('closed external window');

        externalWindow = null;
      });
    } else {
      mainWindow && mainWindow.webContents.send('secondWindow', false);
    }
  }
});

// 打开Web会议
ipcMain.on('webviewShowWebMeeting', () => {
  if (webMeetingWindow) {
    return;
  }

  webMeetingWindow = new BrowserWindow({
    width,
    height,
    frame: true,
    icon,
    resizable: true,
  });
  webMeetingWindow.loadURL('https://cdn.xylink.com/webrtc/web/index.html');

  webMeetingWindow.on('close', () => {
    webMeetingWindow = null;
  });
});

// 打开会控弹窗
ipcMain.on('meetingControlWin', (event, arg) => {
  if (meetingControlWindow) {
    meetingControlWindow.close();
    meetingControlWindow = null;
  }

  if (arg && arg.url) {
    meetingControlWindow = new BrowserWindow({
      width,
      height,
      frame: true,
      title: arg.meetingNumber,
      icon,
    });

    meetingControlWindow.loadURL(arg.url);

    meetingControlWindow.on('close', () => {
      meetingControlWindow = null;
    });

    // 阻止本机窗口的标题更改
    meetingControlWindow.on('page-title-updated', (event) => {
      event.preventDefault();
    });
  }
});

/**
 * 计算区域共享弹窗位置的物理像素
 * @returns {Rectangle}
 */
function getContentWindowRect(isPhysicalRect = true) {
  let rect = { x: 0, y: 0, width: 0, height: 0 };
  if (screenRegionShareWindow) {
    const { x, y, width, height } = screenRegionShareWindow.getContentBounds();
    const regionDipRect = {
      x: Math.ceil(x + 4) + 1,
      y: Math.ceil(y + 24) + 1,
      width: Math.floor(width - 8) - 1,
      height: Math.floor(height - 28) - 1,
    };
    rect = isPhysicalRect
      ? screen.dipToScreenRect(null, regionDipRect)
      : regionDipRect;
  }
  return rect;
}

/**
 * 更新区域共享的位置信息
 */
function updateContentRegion() {
  mainWindow?.webContents.send('updateDisplayRegion', getContentWindowRect());
}

/**
 * screenRegionShare.html中用到，区域共享时监听鼠标是否在篮筐上，从而决定是否让弹窗可以点击穿透
 */
ipcMain.on('ignoreMouseEvent', (event, ignore) => {
  if (ignore) {
    screenRegionShareWindow?.setIgnoreMouseEvents(true, { forward: true });
  } else {
    screenRegionShareWindow?.setIgnoreMouseEvents(false);
  }
});

// 关闭区域共享
ipcMain.on('closeScreenRegionShare', (event, arg) => {
  screenRegionShareWindow?.close();
});

// 区域共享 / 全屏桌面共享
ipcMain.on('screenRegionShare', (event, arg) => {
  if (screenRegionShareWindow) {
    screenRegionShareWindow.close();
    screenRegionShareWindow = null;
  }

  const { type = 'area' } = arg || {};
  const isFullScreenShare = type === 'fullScreen';
  let point = { x: 0, y: 0 };

  if (isFullScreenShare) {
    point = screen.screenToDipPoint({
      x: arg.rect.x,
      y: arg.rect.y,
    });
  }

  const { workAreaSize } = screen.getPrimaryDisplay();
  console.log('workAreaSize ===> ', workAreaSize);

  screenRegionShareWindow = new BrowserWindow({
    width: isFullScreenShare ? undefined : 800,
    height: isFullScreenShare ? undefined : 600,
    x: isFullScreenShare ? point.x : undefined,
    y: isFullScreenShare ? point.y : undefined,
    frame: false,
    transparent: true,
    minHeight: Math.ceil(workAreaSize.height * 0.3),
    minWidth: Math.ceil(workAreaSize.width * 0.3),
    movable: !isFullScreenShare,
    resizable: !isFullScreenShare,
    minimizable: false,
    maximizable: false,
    fullscreenable: true,
    fullscreen: isFullScreenShare,
    closable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 否则页面无法用require
    },
  });

  screenRegionShareWindow?.setIgnoreMouseEvents(true, { forward: true });

  // 区域共享弹窗不显示在任务栏中，禁止用户手动关闭弹窗
  screenRegionShareWindow.setSkipTaskbar(true);

  // 区域共享弹窗始终在所有应用的最上层
  screenRegionShareWindow.setAlwaysOnTop(true, 'screen-saver');

  // 屏幕篮筐无法覆盖底部导航栏，需要focus
  setTimeout(() => {
    screenRegionShareWindow?.focus();
  }, 500);

  // screenRegionShareWindow.loadURL(resolveHtmlPath('index.html',`/screenRegionShare/${type}`));
  screenRegionShareWindow.loadURL(
    resolveHtmlPath(`screenRegionShare.html`, '', `?type=${type}`)
  );

  if (!isFullScreenShare) {
    mainWindow?.webContents.send('startRegionShare', getContentWindowRect());
  }

  screenRegionShareWindow.on('resized', () => {
    updateContentRegion();
  });

  screenRegionShareWindow.on('close', () => {
    screenRegionShareWindow = null;
    mainWindow?.webContents.send('regionSharingWindowLoaded', false);
  });

  screenRegionShareWindow.on('ready-to-show', () => {
    mainWindow?.webContents.send('regionSharingWindowLoaded', true);
  });

  // 移动之前，应该先把共享暂停，然后 moved 之后再
  screenRegionShareWindow.on('will-move', () => {
    mainWindow?.webContents.send('regionSharingWindowWillChange');
  });

  screenRegionShareWindow.on('will-resize', () => {
    mainWindow?.webContents.send('regionSharingWindowWillChange');
  });

  screenRegionShareWindow.on('moved', () => {
    updateContentRegion();
  });
});

// 接收主窗口批注状态：是否开始
ipcMain.on('AnnotationStatus', (event, visible) => {
  if (visible) {
    mainWindow?.minimize();
  }

  screenRegionShareWindow?.webContents.send('AnnotationStatus', visible);
});

// 接收来自content接收着发送的线条
ipcMain.on('AnnotationReceiveLine', (event, line) => {
  screenRegionShareWindow?.webContents.send('AnnotationReceiveLine', {
    ...line,
  });
});

// 接收来自content接收着清空批注的消息
ipcMain.on('AnnotationClean', (event) => {
  screenRegionShareWindow?.webContents.send('AnnotationClean');
});

// 点击批注工具关闭按钮，通知主窗口关闭批注
ipcMain.on('NoticeAnnotationStatus', (event, visible) => {
  mainWindow?.webContents.send('NoticeAnnotationStatus', visible);
});

// 保存批注图片，需要抓取画板所在桌面截图
ipcMain.on('captureScreenImg', async (event, isFullScreen) => {
  if (screenRegionShareWindow) {
    const { x, y, width, height } = screenRegionShareWindow.getBounds();
    const currentScreen = screen.getDisplayMatching({ x, y, width, height });

    desktopCapturer
      .getSources({
        types: ['screen'],
        thumbnailSize: {
          width: currentScreen.bounds.width,
          height: currentScreen.bounds.height,
        },
      })
      .then((sources) => {
        const source = sources.find(
          (item) => Number(item.display_id) === currentScreen.id
        );
        let thumbnail = source?.thumbnail;

        if (!isFullScreen) {
          const region = getContentWindowRect(false);
          const rect = {
            ...region,
            x: region.x - currentScreen.bounds.x,
            y: region.y - currentScreen.bounds.y,
          };

          // 区域共享需要裁剪
          thumbnail = thumbnail?.crop(rect);
        }

        screenRegionShareWindow?.webContents.send(
          'receiveCaptureScreenImg',
          thumbnail?.toPNG()
        );
      });
  }
});

function createMainWindow() {
  const window = new BrowserWindow({
    width,
    height,
    minHeight: height,
    minWidth: width,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // electron 20 以上默认开启了沙盒模式，js会报错
      sandbox: false,
    },
    title: '',
    center: true,
    frame: isShowFrame, // window 自定义操作栏
    // transparent: isWin,
    backgroundColor: '#00000000',
    resizable: true,
    show: false,
    icon,
    fullscreen: false,
    fullscreenable: false,
    acceptFirstMouse: true, // mac 属性
  });

  window.loadURL(resolveHtmlPath('index.html'));

  // 菜单
  const menuBuilder = new MenuBuilder(window);
  if (isMac) {
    menuBuilder.buildMenu();
  } else {
    // menuBuilder.buildTray();
  }

  if (isMac) {
    app.dock.setIcon(icon);
  }

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.on('ready-to-show', () => {
    if (!window) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      window.minimize();
    } else {
      window.show();
    }
  });

  window.on('closed', () => {
    externalWindow && externalWindow.close();
    externalWindow = null;

    meetingControlWindow && meetingControlWindow.close();
    meetingControlWindow = null;

    screenRegionShareWindow && screenRegionShareWindow.close();
    screenRegionShareWindow = null;

    webMeetingWindow && webMeetingWindow.close();
    webMeetingWindow = null;

    mainWindow = null;
  });

  // 设置为false , 否则共享全屏时，主窗口被覆盖，会失去响应
  window.webContents.setBackgroundThrottling(false);

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  // 注册快捷键
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const focusWin = BrowserWindow.getFocusedWindow();

    focusWin && focusWin.webContents.toggleDevTools();
  });

  // esc 退出全屏
  globalShortcut.register('ESC', () => {
    const focusWin = BrowserWindow.getFocusedWindow();

    if (focusWin && focusWin.isFullScreen()) {
      focusWin.setFullScreen(false);
    }
  });

  return window;
}

const appLock = app.requestSingleInstanceLock();

if (!appLock) {
  app.quit();
} else {
  // macOS 下通过协议URL启动时，主实例会通过 open-url 事件接收这个 URL
  app.on('open-url', (event, urlStr) => {
    handleUrl(urlStr);
  });

  // quit application when all windows are closed
  app.on('window-all-closed', () => {
    globalShortcut.unregister('CommandOrControl+Shift+I');

    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
      ipcMain.removeAllListeners();
      app.quit();
    }
  });

  app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
      mainWindow = createMainWindow();
    }
  });

  app.on('second-instance', (event, argv) => {
    if (isWin) {
      handleArgv(argv);
    }

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // create main BrowserWindow when electron is ready
  app.on('ready', () => {
    // app.setPath('crashDumps', '/path/to/crashes')
    mainWindow = createMainWindow();
  });

  // 监听崩溃
  app.on('render-process-gone', (event, webContents, details) => {
    log.error('render-process-gone', details);
  });

  // 监听崩溃
  app.on('child-process-gone', (event, details) => {
    log.error('child-process-gone', details);
  });

  // 系统休眠，需要退会，否则会崩溃
  powerMonitor.on('suspend', () => {
    mainWindow?.webContents.send('systemSuspend');
  });

  let tray = null;
  app
    .whenReady()
    .then(() => {
      if (isWin) {
        tray = new Tray(getAssetPath('logo256.ico'));

        Menu.setApplicationMenu(null);

        const contextMenu = Menu.buildFromTemplate([
          {
            label: '显示窗口',
            click: () => {
              if (mainWindow) {
                mainWindow.setSkipTaskbar(false);
                mainWindow.show();
              }
            },
          },
          {
            label: '退出',
            click: () => {
              mainWindow && mainWindow.close();
              externalWindow && externalWindow.close();
              meetingControlWindow && meetingControlWindow.close();
              app && app.quit();
            },
          },
        ]);
        tray.setToolTip('小鱼易连');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
          if (mainWindow) {
            mainWindow.setSkipTaskbar(false);
            mainWindow.show();
          }
        });
      }
    })
    .catch((error) => {
      console.log('whenReady error:', error);
    });
}

// 获取 userData 目录
ipcMain.on('getUserDataDir', () => {
  mainWindow?.webContents.send('getUserDataDir', app.getPath('userData'));
});

// 获取 assets 目录
ipcMain.on('getAssetsDir', () => {
  mainWindow?.webContents.send('getAssetsDir', getAssetPath());
});

