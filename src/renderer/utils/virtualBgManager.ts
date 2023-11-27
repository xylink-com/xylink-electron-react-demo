import log from 'electron-log';
import store from './videoEffectStore';
import { IVirtualBgInfo } from '@/type';
import { IVirtualBgType } from '@/type/enum';
import { VIRTUAL_BG_DIR } from '@/enum';
import { getHash, rm, readFile, writeFile, getChildrenFiles } from '@/utils/file';
import { createUserDataChildDir, getAssetsDir } from '@/utils/processCommunication';

import path from 'path';
import { randomUUID } from 'crypto';

export interface IBgFileData extends IVirtualBgInfo {
    url: string;
    filePath: string;
}

class BgManager {
    private userId = '';

    private filePathMap = new Map<string, string>();

    private customDirPath = VIRTUAL_BG_DIR;

    /**
     * 缓存读取的虚拟背景列表
    */
    private cacheData: IBgFileData[] = [];

    /**
     * 根据 filePath 获取到对应的数据
     * 
     * @param filePath 文件路径
     * @param type 虚拟背景类型
     */
    private async createFileConfig(filePath: string, type: IVirtualBgType): Promise<IBgFileData> {
        const { base } = path.parse(filePath);
        const buffer = await readFile(filePath);
        const hash = getHash(buffer);
        const url = URL.createObjectURL(new File([buffer], base));
        const id = randomUUID({ disableEntropyCache: true });
        return { url, hash, filePath, filename: base, id, type };
    }

    /**
     * IBgFileData 转 IVirtualBgInfo
     * 
     * @param bg 虚拟背景数据
    */
    private createIVirtualBgInfo(bg: IBgFileData) {
        const { id, hash, filename, type } = bg;
        return { id, hash, filename, type };
    }

    /**
     * 根据 bgFileList 生成 hash-filePath 字典
     * 
     * @param bgFileList 虚拟背景列表数据
    */
    private createFileHashMap(bgFileList: IBgFileData[]) {
        return bgFileList.reduce((acc, file) => {
            acc.set(file.hash, file.filePath);
            return acc;
        }, new Map<string, string>());
    }

    /**
     * 创建出虚拟背景列表数据
     * 
     * @param dirPath 图片所在的文件夹目录
     * @param type 虚拟背景图片类型
     */
    private async createBgList(dirPath: string, type: IVirtualBgType) {

        const bgList = store.virtualBgList.filter(item => item.type === type);
        const oldBgMap = bgList.reduce((acc, item) => acc.set(item.hash, item), new Map<string, IVirtualBgInfo>);
        const files = getChildrenFiles(dirPath);

        // 如果是自定义的配置
        if (type === IVirtualBgType.COSTOM) {
            const hashMap = new Map<string, { buffer: Buffer; filePath: string; }>();
            const customBgFiles: IBgFileData[] = [];

            await Promise.all(files.map(async ({ filePath }) => {
                const buffer = await readFile(filePath);
                const hash = getHash(buffer);
                // 如果没有匹配到 hash，则说明这个文件没有用了，需要删除
                hashMap.set(hash, { buffer, filePath });
            }));

            bgList.forEach((item) => {
                const { hash, id, type, filename } = item;
                const data = hashMap.get(hash);
                if (data) {
                    const { filePath, buffer } = data;
                    const url = URL.createObjectURL(new File([buffer], filename));
                    this.filePathMap.set(hash, filePath);
                    customBgFiles.push({ url, id, hash, type, filename, filePath });
                }
            });

            hashMap.forEach(({ filePath }, hash) => {
                if (!this.filePathMap.has(hash)) {
                    rm(filePath, 2).catch();
                }
            });

            return customBgFiles;
        }

        // 如果是预置的配置
        if (type === IVirtualBgType.PRESET) {
            const presetBgFiles: IBgFileData[] = [];

            await Promise.all(files.map(async ({ filePath }) => {
                const { name, base, dir } = path.parse(filePath);
                const isThumbImg = !base.includes('_hd.');
                if (isThumbImg) {
                    // 拿到大图的配置
                    const hdPath = `${dir}/${name}_hd.jpg`;
                    const newConfig = await this.createFileConfig(hdPath, type);
                    const oldConfig = oldBgMap.get(newConfig.hash);
                    this.filePathMap.set(newConfig.hash, newConfig.filePath);

                    presetBgFiles.push({
                        ...newConfig,
                        id: oldConfig?.id || newConfig.id,
                    });
                }
            }));
            // 排序，防止每次打开 app 时顺序都不一样
            return presetBgFiles.sort((a, b) => a.filePath.localeCompare(b.filePath));
        }
        return [];
    }

    /**
     * 获取缓存数据
     */
    public getCacheData() {
        return [...this.cacheData];
    }

    /**
     * 初始化，返回虚拟背景数据、当前选中的虚拟背景ID和文件路径
     */
    public async init() {
        if (this.cacheData.length) {    // 有缓存就直接使用缓存
            this.filePathMap = this.createFileHashMap(this.cacheData);

            log.info('virtual bg manager init', 'use cache', this.cacheData);

            return { bgFileList: this.cacheData, ...this.selectedInfo };
        }

        log.info('virtual bg manager init', 'no cache', {
            customDirPath: this.customDirPath
        });

        let newBgFileList = this.cacheData;

        try {
            /** 获取到自定义背景图文件目录 */
            const presetBgDir = path.resolve(await getAssetsDir(), VIRTUAL_BG_DIR);
            /** 获取到自定义背景图的为文件目录 */
            const customBgDir = await createUserDataChildDir(this.customDirPath);

            const presetBgFileList = await this.createBgList(presetBgDir, IVirtualBgType.PRESET);
            const customBgFileList = await this.createBgList(customBgDir, IVirtualBgType.COSTOM);

            /** merge */
            newBgFileList = [...presetBgFileList, ...customBgFileList];

            /** 更新 cacheData */
            this.cacheData = newBgFileList;
            this.customDirPath = customBgDir;

            log.info('virtual bg manager init', {
                customBgDir,
                presetBgDir,
                cacheData: newBgFileList,
            });

        } catch (error) {
            log.error('virtual bg manager init error', error);
        }

        return { bgFileList: newBgFileList, ...this.selectedInfo };
    }

    /**
     * 设置 userId，更新存储位置，登录时应该调用这个函数
     * 
     * @param userId 用户唯一标识
     */
    public setUser(userId = '') {
        this.customDirPath = `${VIRTUAL_BG_DIR}/${userId}`;

        log.info('bgManager setUser', {
            userId,
            prevUserId: this.userId,
            dirPath: this.customDirPath
        });

        /** 如果跟上一次的 userId 比较发现不一样了，则需要清除 cache */
        if (userId !== this.userId) {
            this.cacheData.forEach(item => {
                URL.revokeObjectURL(item.url);
            });

            this.cacheData = [];
            this.userId = userId;
        }
    }

    /**
     * 把 File 对象写入目录
     * 先计算出 hash，看 fileHashMap 中是否可以找到对应的文件
     * 如果找到了就直接返回，找不到则存入文件，更新 fileHashMap
     * 
     * @param file File 对象
    */
    public async createNewBgByFile(file: File): Promise<IBgFileData> {
        const { name } = file;
        const buffer = await file.arrayBuffer();
        const uint8Arr = new Uint8Array(buffer);
        const hash = getHash(uint8Arr);
        const url = URL.createObjectURL(file);

        let filePath = this.filePathMap.get(hash);

        const config = {
            hash,
            url,
            type: IVirtualBgType.COSTOM,
            id: `${Date.now()}`,
            filename: name,
        };

        const ext = path.extname(name);

        if (filePath) {
            store.addVirtualBg(config);
            const data = { ...config, filePath };

            log.info('createNewBgByFile, has filePath', data);

            return data;
        }

        // 往图片目录下存入文件
        filePath = `${this.customDirPath}/${hash}${ext}`;
        await writeFile(filePath, uint8Arr);
        this.filePathMap.set(hash, filePath);
        store.addVirtualBg(config);
        const data = { ...config, filePath };

        log.info('createNewBgByFile', data);

        return data;
    }

    /**
     * 删除某个背景图配置，并根据 hash 匹配背景图配置，
     * 如果只匹配到一个配置，则把图片文件也删除掉
     * 
     * @param bg 要被删除的背景图数据
    */
    public deleteBg(bg: IBgFileData) {
        const { hash, filePath } = bg;
        const bgList = store.virtualBgList;
        const sameHashBg = bgList.filter(item => item.hash === hash);

        log.info('del virtual bg', bg);

        // 删除对应的文件
        if (sameHashBg.length < 2 && filePath) {
            rm(filePath, 2).catch();
            this.filePathMap.delete(hash);
        }
        store.delVirtualBgById(bg.id);
    }

    public get selectedInfo () {
        /** 当前选中的 id */
        let selectedId = store.selectedVirtualBg?.id || '';
        /** 选中的 filePath */
        let selectedFilePath = '';
        /** 根据 id 获取到对应的配置 */
        const selectedBg = selectedId ? store.getVirtualBgById(selectedId) : null;

        if (selectedBg) {
            const { hash } = selectedBg;
            const filePath = this.filePathMap.get(hash);

            if (filePath) {
                selectedFilePath = filePath;
            } else {
                selectedId = '';    // 没有找到对应的 filePath 就把 selectedId 设置为空
            }
        }

        return { selectedId, selectedFilePath };
    }

    /**
     * 更新选中的背景图
     * 
     * @param selectedId 更新选中的背景
     * @param newList 更新列表，不传则不更新
     */
    public updateBg(selectedId: IBgFileData['id'], newList?: IBgFileData[]) {
        store.updateSelectedVirtualBg(selectedId);
        newList && this.updateBgList(newList);
        this.save();
    }

    /**
     * 更新虚拟背景列表
     * 
     * @param list 更新虚拟背景列表
     */
    public updateBgList(list: IBgFileData[]) {
        const bgList = list.map(item => this.createIVirtualBgInfo(item));
        this.cacheData = list;
        store.resetVirtualBgList(bgList);
    }

    /**
     * 保存 store 配置
     */
    public save() {
        store.save();
    }
}

export const bgManager = new BgManager();
