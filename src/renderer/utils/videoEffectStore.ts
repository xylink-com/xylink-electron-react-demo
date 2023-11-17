import log from 'electron-log';
import Store from 'electron-store';
import cloneDeep from 'clone-deep';
import { DEFAULT_VIDEO_EFFECT_CONFIG } from '@/enum';
import { IVideoEffectStore, IVirtualBgInfo } from '@/type';
import { VideoBeautyStyle, VideoFilterStyle } from '@xylink/xy-electron-sdk';

/**
 * 根据用户唯一标识创建 electron store
 * 
 * @param user 用户唯一标识
 */
const getElectronStore = (user?: string) => {
    const storeName = `${user ? user + '-' : ''}video-effect-config`;

    log.info('video effect store getElectronStore', { storeName });

    const store = new Store<IVideoEffectStore>({
        watch: true,
        name: storeName,
        encryptionKey: 'Buffer',
        defaults: DEFAULT_VIDEO_EFFECT_CONFIG,
    });
    return store;
}

class VideoEffectStore {
    /** 单例 */
    private static instance: VideoEffectStore;

    /** electron store */
    private electronStore = getElectronStore();

    /**
     * 获取实例
     */
    static getInstance() {
        if (!VideoEffectStore.instance) {
            VideoEffectStore.instance = new VideoEffectStore();
        }
        return VideoEffectStore.instance;
    }

    private store = cloneDeep(this.electronStore.store);

    private constructor() {}

    /**
     * 获取美颜效果级别
     */
    private getBeautyLevel(style: VideoBeautyStyle) {
        // 默认取 25
        const defaultVal = style === VideoBeautyStyle.SMOOTH ? 25 : 0;
        return this.store.beautyMap[style]?.level ?? defaultVal;
    }

    /**
     * 获取滤镜效果级别
     */
    private getFilterLevel(style: VideoFilterStyle) {
        // 默认取 50
        const defaultVal = style === VideoFilterStyle.RETRO ? 100 : 60;
        return this.store.filterMap[style]?.level ?? defaultVal;
    }

    /**
     * 设置用户 id，更新 store
     */
    public setUser(userId: string) {
        const newStore = getElectronStore(userId);
        this.electronStore = newStore;
        this.store = cloneDeep(newStore.store);

        log.info('video effect store setUser', { userId });
    }

    /**
     * 重新设置虚拟背景列表
    */
    public resetVirtualBgList(list: IVirtualBgInfo[]) {
        this.store.virtualBg.list = list;
    }

    /**
     * 删除某个虚拟列表
    */
    public delVirtualBgById(id: IVirtualBgInfo['id']) {
        const list = this.store.virtualBg.list || [];
        const newList = list.filter(item => item.id !== id);
        this.resetVirtualBgList(newList);
        this.save();

        log.info('video effect store deleteVirtualBg', { id });
    }

    /**
     * 添加自定义虚拟列表数据
    */
    public addVirtualBg(data: IVirtualBgInfo) {
        const virtualBgConf = this.store.virtualBg;
        const { list } = virtualBgConf;

        // 在最前面插入
        list.unshift(data);
        virtualBgConf.list = list;
        this.store.virtualBg = virtualBgConf;

        log.info('video effect store addVirtualBg', data);
    }

    /**
     * 根据虚拟背景 id 获取对应的数据
    */
    public getVirtualBgById(id: IVirtualBgInfo['id']) {
        return this.virtualBgList.find(item => item.id === id);
    }

    /**
     * 更新选中的背景图
    */
    public updateSelectedVirtualBg(id: IVirtualBgInfo['id']) {
        this.store.selected.virtualBg = { id };
    }

    /**
     * 更新选中的美颜
    */
    public updateSelectedBeauty(style: VideoBeautyStyle) {
        this.store.selected.beauty.style = style;
    }

    /**
     * 更新选中的滤镜
    */
    public updateSelectedFilter(style: VideoFilterStyle) {
        this.store.selected.filter.style = style;
    }

    /**
     * 更新美颜配置，如果不传 style，则会找选中的 style 更新 level
    */
    public updateBeautyLevel(level: number, style?: VideoBeautyStyle) {
        const s = style ?? this.selectedBeauty.style;
        this.store.beautyMap[s] = { level };

        log.info('updateBeautyLevel', { level, style: s });
        return { level, style: s };
    }

    /**
     * 更新滤镜配置，如果不传 style，则会找选中的 style 更新 level
    */
    public updateFilterLevel(level: number, style?: VideoFilterStyle) {
        const s = style ?? this.selectedFilter.style;
        this.store.filterMap[s] = { level };

        log.info('updateFilterLevel', { level, style: s });
        return { level, style: s };
    }

    /** 
     * 根据 style 获取美颜的 level 配置，不传 style 会找 selectedStyle
     */
    public getBeautyConfig(style?: VideoBeautyStyle) {
        const s = style ?? this.selectedBeauty.style;
        const level = this.getBeautyLevel(s);
        return { style: s, level };
    }

    /** 
     * 根据 style 获取滤镜的 level 配置，不传 style 会找 selectedStyle
     */
    public getFilterConfig(style?: VideoFilterStyle) {
        const s = style ?? this.selectedFilter.style;
        // 获取 level，默认取中间值
        const level = this.getFilterLevel(s);
        return { style: s, level };
    }

    /**
     * 保存配置到 store 中
     */
    public save() {
        log.info('video effect store save()');

        this.electronStore.set(this.store);
    }

    /**
     * 获取自定义的虚拟列表数据
    */
    public get virtualBgList() {
        return this.store.virtualBg.list || [];
    }

    /**
     * 获取选中的虚拟背景 id
    */
    public get selectedVirtualBg() {
        return this.store.selected.virtualBg;
    }

    /** 
     * 获取美颜配置
     */
    public get selectedBeauty() {
        return this.store.selected.beauty;
    }

    /** 
     * 获取滤镜配置
     */
    public get selectedFilter() {
        return this.store.selected.filter;
    }

    /** 
     * 获取美颜效果的列表
     */
    public get beautyEffectList() {
        const beautyMap = this.store.beautyMap;
        const effects: { style: VideoBeautyStyle, level: number }[] = [];

        Object.keys(beautyMap).forEach(k => {
            const level = this.getBeautyLevel(k as unknown as keyof typeof beautyMap);
            effects.push({ style: Number(k) as VideoBeautyStyle, level });
        });

        log.info('get beautyEffectList', effects);

        return effects;
    }
}

export default VideoEffectStore.getInstance();
