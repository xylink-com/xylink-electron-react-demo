import cn from 'classnames';
import log from 'electron-log';
import { Tooltip, message, Modal } from 'antd';
import { useEffect, useMemo, useState, useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import xyRTC from '@/utils/xyRTC';
import { VIRTUAL_BG } from '@/enum';
import { IVirtualBgType } from '@/type/enum';
import { isJPEG, isPNG } from '@/utils/file';
import { VirtualBgMode } from '@xylink/xy-electron-sdk';
import { bgManager, IBgFileData } from '@/utils/virtualBgManager';
import UnsetEffect from '../UnsetEffect';

import closeIcon from '../assets/icons/close.png';
// 背景虚化的图片
import bg_01 from '../assets/virtual-bg/vb_01.png';

import './index.scss';

const { VIRTUALIZATION, MAX_IMG_SIZE, ALLOW_MIME, MAX_CUSTOM_NUM } = VIRTUAL_BG;

export interface IVirtualBgProps {
    onChange?: (mode: VirtualBgMode,filePath?: string) => void;
}

const VirtualBg = (props: IVirtualBgProps) => {
    const { onChange } = props;

    const [bgImgList, setBgImgList] = useState<IBgFileData[]>(bgManager.getCacheData());
    const [selectedId, setSelectedId] = useState<string>(bgManager.selectedInfo.selectedId);
    const bgImgListRef = useRef({ bgImgList, selectedId });

    useEffect(() => {
        bgManager.init().then((data) => {
            const { bgFileList, selectedId, selectedFilePath } = data;
            const mode = getMode(selectedId);
            setBgImgList(bgFileList);
            setSelectedId(selectedId);
            onChange?.(mode, selectedFilePath);
        });

        // 组件卸载的时候保存配置
        return () => {
            const { selectedId, bgImgList } = bgImgListRef.current;
            bgManager.updateBg(selectedId, bgImgList);
        }
    }, []);

    // 更新 store 和 selected
    useEffect(() => {
        bgImgListRef.current = {bgImgList, selectedId};
    }, [bgImgList, selectedId]);

    const getMode = (id: string) => {
        let mode = VirtualBgMode.BG_IMAGE;
        if (!id) {
            mode = VirtualBgMode.NONE;
        } else if (id === VIRTUALIZATION) {
            mode = VirtualBgMode.BG_BLUR;
        }
        return mode;
    }

    /** 设置虚拟背景图 */
    const setVirtualBg = (id: string, path: string) => {
        const mode = getMode(id);
        xyRTC.setVirtualBgMode(mode);
        path && xyRTC.setVirtualBgImage(path);

        setSelectedId(id);
        onChange?.(mode, path);
    }

    const handleSelectBg = ({ id, filePath }: IBgFileData) => {
        setVirtualBg(id, filePath);
    }

    /** 自定义虚拟背景的数量 */
    const customNum = useMemo(() => {
        return bgImgList.filter(i => i.type === IVirtualBgType.COSTOM).length;
    }, [bgImgList]);

    /**
     * 添加图片
     * 1. 判断自定义图片是否已经满了，满了则给提示不让再添加
     * 2. 可以添加时，则把这个图片生成对应的 IBgFileData 数据
     * 3. 把新生成的图片保存到本地，把生成的文件路径和 IBgFileData 一块保存到 electron-store 中
    */
    const addNewBg = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        // 清除数据，不然下次再打开相同的文件不会触发 change 事件
        event.target.value = '';

        if (file) {
            const buffer = new Uint8Array(await file.arrayBuffer());
            const isPngOrJpg = isJPEG(buffer) || isPNG(buffer);

            log.info('add new virtual bg', {
                isPngOrJpg,
                fileSize: file.size,
                filePath: file.path,
            });

            if (!isPngOrJpg) {
                return message.error('检测到该图片不是png或jpg格式');
            }

            // 检查大小
            if ((file.size / 1024 / 1024) > MAX_IMG_SIZE) {
                return message.error(`文件过大，仅支持${MAX_IMG_SIZE}MB以下的图片`);
            }

            try {
                const config = await bgManager.createNewBgByFile(file);
                // 更新状态
                setBgImgList(prev => [...prev, config]);
            } catch (error) {
                message.error('异常，请重试');

                log.error('addNewBg error', error);
            }
        }
    }

    /**
     * 删除背景图，如果当前是选中状态，则不能被删除
     */
    const handleDelBg = (bg: IBgFileData) => {
        // 二次确认
        Modal.confirm({
            title: '删除图片',
            icon: null,
            centered: true,
            okText: '确定',
            closable: false,
            cancelText: '取消',
            content: '背景图片删除后需要重新上传，确定删除此图片？',
            onOk: async () => {
                const { id, url } = bg;

                setBgImgList((prev) => prev.filter(i => i.id !== id));
                URL.revokeObjectURL(url);

                if (id === selectedId) {
                    // 删除当前使用的背景图时，需要重新设置背景图状态
                    setVirtualBg('', '');
                }
                bgManager.deleteBg(bg); // 更新 store，并删除图片文件
            }
        });
    }

    return (
        <div className='virtual-bg'>
            {/* 不设置虚拟背景 */}
            <UnsetEffect
                onClick={() => setVirtualBg('', '')}
                className={cn('virtual-bg-item', !selectedId && 'selected-item')}
            />

            {/* 背景虚化 */}
            <div
                onClick={() => setVirtualBg(VIRTUALIZATION, '')}
                className={cn('virtual-bg-item', selectedId === VIRTUALIZATION  && 'selected-item')}
            >
                <img src={bg_01} />
            </div>

            {
                bgImgList.map(bg => {
                    const { id, url, type } = bg;
                    const isPresetImg = type === IVirtualBgType.PRESET;

                    return (
                        <div
                            key={id}
                            onClick={() => handleSelectBg(bg)}
                            className={cn('virtual-bg-item', id === selectedId && 'selected-item')}
                        >
                            {!isPresetImg && (
                                <img src={closeIcon} onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelBg(bg);
                                }} className='close-icon'/>
                            )}
                            <img src={url}/>
                        </div>
                    )
                })
            }

            {
                customNum < MAX_CUSTOM_NUM && (
                    <Tooltip overlayClassName='virtual-bg-add-item-tooltip' title="上传16:9比例图片效果最佳">
                        <label className='virtual-bg-item add-item'>
                            <input
                                hidden
                                type='file'
                                accept={ALLOW_MIME}
                                onChange={addNewBg}
                            />
                            <PlusOutlined />
                            <div>添加图片</div>
                        </label>
                    </Tooltip>
                )
            }
        </div>
    );
}

export default VirtualBg;
