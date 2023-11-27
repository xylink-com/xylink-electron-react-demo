import log from 'electron-log';
import store from './videoEffectStore';
import { VIRTUAL_BG } from '@/enum';
import { bgManager } from './virtualBgManager';
import { VideoBeautyStyle, VirtualBgMode } from '@xylink/xy-electron-sdk';
import xyRTC from './xyRTC';

const { VIRTUALIZATION } = VIRTUAL_BG;

class InitVideoEffect {

    /** 是否已经初始化设置过 */
    private hasBeenSet = false;

    /**
     * 初始化虚拟背景
     */
    private initVirtualBg() {
        return bgManager.init().then(({ selectedFilePath, selectedId }) => {
            if (selectedFilePath) {
                xyRTC.setVirtualBgMode(VirtualBgMode.BG_IMAGE);
                xyRTC.setVirtualBgImage(selectedFilePath);
            }
    
            else if (selectedId === VIRTUALIZATION) {
                xyRTC.setVirtualBgMode(VirtualBgMode.BG_BLUR);
            } else {
                xyRTC.setVirtualBgMode(VirtualBgMode.NONE);
            }
    
            log.info('InitVideoEffect.initVirtualBg', { selectedFilePath, selectedId });
        });
    }

    /**
     * 初始化滤镜
     */
    private initFilter() {
        const { style: filterStyle, level: filterLevel } = store.getFilterConfig();
        xyRTC.setVideoFilterEffect(filterStyle, filterLevel);

        log.info('InitVideoEffect.initFilter', { filterStyle, filterLevel });
    }

    /**
     * 初始化美颜
     */
    private initBeauty() {
        const { style: beautyStyle } = store.selectedBeauty;

        log.info('InitVideoEffect.initBeauty.style', { beautyStyle });

        if (beautyStyle !== VideoBeautyStyle.NONE) {
            const beautyList = store.beautyEffectList;
            beautyList.forEach(effect => {
                xyRTC.setVideoBeautyEffect(effect.style, effect.level);
            });
            log.info('InitVideoEffect.initBeauty.list', { beautyList });
        } else {
            xyRTC.setVideoBeautyEffect(VideoBeautyStyle.NONE, 100);
        }
    }

    /**
     * 初始化虚拟背景、美颜、滤镜
     */
    public init() {
        const { hasBeenSet } = this;

        log.info('init video effect', { hasBeenSet });

        if(hasBeenSet) return;

        this.initVirtualBg().then(() => {
            this.hasBeenSet = true;
        });
        this.initBeauty();
        this.initFilter();
    }

    /**
     * 重置状态，比如账号绑定时，如果退出登录了，则需要重置，
     * 因为有可能切换别的账号
     */
    public reset() {
        this.hasBeenSet = false;
    }
}

export const initVideoEffect = new InitVideoEffect();
