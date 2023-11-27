import path from 'path';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import { isExist, createDir } from './file';

/** 
 * 在 electron userData 目录下新增一个文件夹并返回文件路径
 * 
 * @param {string} dirname 要创建的子目录
 */
export function createUserDataChildDir(dirname: string) {
    return new Promise<string>((resolve, reject) => {
        ipcRenderer.send('getUserDataDir');
        ipcRenderer.once('getUserDataDir', async (_, userDataPath) => {
            const assetDir = path.resolve(userDataPath, dirname);
            // 如果没有这个文件夹，则创建文件夹
            try {
                log.info('getUserDataDir', userDataPath);

                const exist = await isExist(assetDir);
                
                if (!exist) {
                    await createDir(assetDir);
                }
                resolve(assetDir);
            } catch (error) {
                log.error('createUserDataChildDir error', error);

                reject(error);
            }
        });
    });
}

/**
 * 获取 userData 文件夹路径
 */
export function getAssetsDir() {
    return new Promise<string>((resolve) => {
        ipcRenderer.send('getAssetsDir');
        ipcRenderer.once('getAssetsDir', async (_, asset: string) => {
            log.info('getAssetsDir', asset);

            resolve(asset);
        });
    });
}
