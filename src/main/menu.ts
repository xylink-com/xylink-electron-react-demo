import {
  app,
  Menu,
  BrowserWindow,
  MenuItemConstructorOptions,
  Tray,
} from 'electron';
import pkg from '../../package.json';
import { getAssetPath, isDevelopment, isMac } from './util';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (isDevelopment || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment();
    }

    const template = isMac
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    app.setAboutPanelOptions({
      applicationName: '小鱼易连',
      applicationVersion: pkg.version,
      version: '',
      iconPath: getAssetPath('logo@4x.png'),
      copyright:
        'CopyRight ©2022 北京小鱼易连科技有限公司, All rights reserved',
    });

    return menu;
  }

  buildTray(): Tray {
    const tray = new Tray(getAssetPath('logo.png'));

    Menu.setApplicationMenu(null);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.mainWindow && this.mainWindow.show();
        },
      },
      {
        label: '退出',
        click: () => {
          this.mainWindow && this.mainWindow.close();

          app && app.quit();
        },
      },
    ]);
    tray.setToolTip('小鱼易连');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      this.mainWindow && this.mainWindow.show();
    });

    return tray;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: '小鱼易连',
      submenu: [
        {
          label: '关于小鱼易连',
          selector: 'orderFrontStandardAboutPanel:',
        },
        {
          label: '编辑',
          submenu: [
            { label: '复制', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
            { label: '粘贴', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          ],
        },
        {
          label: '退出小鱼易连',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };

    return [subMenuAbout];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '显示窗口',
        click: () => {
          this.mainWindow && this.mainWindow.show();
        },
      },
      {
        label: '退出',
        click: () => {
          this.mainWindow.close();
          app && app.quit();
        },
      },
    ];

    return templateDefault;
  }
}
