import {
  app,
  screen,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  Tray,
  desktopCapturer
} from 'electron';
import Store from 'electron-store';
import MenuBuilder from './menu';
import {
  checkCameraAccess,
  checkDeviceAccessPrivilege,
  checkMicrophoneAccess,
  getAssetPath,
  isMac,
  isWin,
  resolveHtmlPath,
  isDevelopment,
  handleUrl,
  handleArgv,
} from './util';
import log from 'electron-log';
import { release } from 'os';

Store.initRenderer();

// 主进程日志文件路径
// on Linux: ~/.config/{app name}/logs/{process type}.log
// on macOS: ~/Library/Logs/{app name}/{process type}.log
// on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log

log.info('process info:', {
  electron: process.versions.electron,
  architecture: process.env.PROCESSOR_ARCHITECTURE,
  node: process.versions.node,
  chrome: process.versions.chrome,
  userData: app.getPath('userData'),
  appData: app.getPath('appData'),
  temp: app.getPath('temp'),
  exe: app.getPath('exe'),
  logs: app.getPath('logs'),
  app: app.getAppPath(),
});

const width = 960;
const height = 600;

// 主窗口引用
let mainWindow: BrowserWindow | null = null;
// 会控窗口
let meetingControlWindow: BrowserWindow | null = null;
// 区域共享弹窗
let screenRegionShareWindow: BrowserWindow | null = null;

const icon = getAssetPath('logo512.png');

// 即使GPU奔溃，仍然可以使用webgl api
app.disableDomainBlockingFor3DAPIs();

// electron 的硬件加速功能，在 win7 或者 Linux 系统上，容易出现黑屏或者卡死
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// 缩小窗口
ipcMain.on('window-minus', () => {
  if (mainWindow && !mainWindow.isMinimized()) {
    mainWindow.minimize();
  }
});

// 关闭窗口
ipcMain.on('window-close', () => {
  if (mainWindow && !isMac) {
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

    mainWindow.setContentSize(960, 628);

    mainWindow.center();
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

// 申请摄像头权限
ipcMain.on('check-camera-access', async () => {
  await checkCameraAccess();

  mainWindow && mainWindow.webContents.send('check-camera-finished', true);
});

// 申请麦克风权限
ipcMain.on('check-microphone-access', async () => {
  await checkMicrophoneAccess();

  mainWindow && mainWindow.webContents.send('check-microphone-finished', true);
});

// 重新打开窗口
ipcMain.on('relaunch', () => {
  app.relaunch();
  app.exit(0);
});

// 打开会控弹窗
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

// 创建主窗口
function createMainWindow() {
  const window = new BrowserWindow({
    width: 960,
    height: 628,
    minHeight: 628,
    minWidth: 960,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // electron 20 以上默认开启了沙盒模式，js会报错
      sandbox: false,
    },
    title: '',
    center: true,
    frame: isMac,
    transparent: !isMac,
    backgroundColor: '#00000000',
    resizable: false,
    show: false,
    icon,
    fullscreen: false,
    fullscreenable: false,
    acceptFirstMouse: true,
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
    mainWindow = null;
    meetingControlWindow && meetingControlWindow.close();
    meetingControlWindow = null;
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

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
} else {
  // macOS 下通过Scheme启动时，主实例会通过open-url事件接收URL
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
    mainWindow = createMainWindow();
  });

  let tray = null;
  app
    .whenReady()
    .then(() => {
      if (!isMac) {
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
              meetingControlWindow && meetingControlWindow.close();
              app && app.quit();
            },
          },
        ]);
        tray.setToolTip('小鱼云视频');
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
