import {
  ContentCaptureType,
  IAppThumbnail,
  IModel,
  IMonitorInfo，
  IMonitorThumbnail,
  RecordStatus,
  TemplateModel,
  VideoBeautyStyle,
  VideoFilterStyle
} from "@xylink/xy-electron-sdk";
import { AnnotationKey, LocalLanguage, ShowLanguage , IVirtualBgType} from './enum';

/**
 * 静音状态
 *
 * @value mute 静音
 * @value unmute 取消静音
 */
export type IAudio = 'mute' | 'unmute';

/**
 * 设置内容Tab
 *
 * @value device 音视频信息
 * @value common 通用
 * @value feedback 反馈
 * @value about 关于
 */
export type TSettingType = 'device' | 'common' | 'feedback' | 'about' | 'video-effect';

/**
 * 设置信息
 *
 * @property { string } clientId
 * @property { string } clientSecret
 * @property { string } extId 企业ID
 * @property { string } proxy 服务器地址
 * @property { string } model 布局模式
 */
export interface ISettingInfo {
  clientId: string;
  clientSecret: string;
  extId: string;
  proxy: string;
  model: IModel;
}

/**
 * 登录Form 信息
 *
 * @property { string? } phone 手机号
 * @property { string? } password 密码
 * @property { string? } extID 三方企业ID
 * @property { string? } extUserId 三方用户信息
 * @property { string? } displayName 用户名称
 */
export interface ILoginData {
  phone?: string;
  password?: string;
  extID?: string;
  extUserId?: string;
  displayName?: string;
  authCode?: string;
  isTempUser?: boolean;
  channelId?: string;
  token?: string;
}

/**
 * layout切换布局模板对应文案
 * @property {TemplateModel} key 布局模板
 * @property {string} 对应的文案
 */
export interface ILayoutItem {
  key: TemplateModel;
  text: string;
}

/**
 * layout切换布局模板分类
 *
 * @property { ILayoutItem[][]} normal 无content常规布局模板
 * @property { ILayoutItem[][]} content 带content布局模板
 */
export interface ILayoutModelMap {
  normal: ILayoutItem[][];
  content: ILayoutItem[][];
}

/**
 * 同传字幕本地语言和展示语言
 */
export interface ILanguageList {
  local: {
    [key in LocalLanguage]: string;
  };
  show: {
    [key in ShowLanguage]: string;
  };
}

/**
 * 录制详情
 * 
 * @property recordStatus 录制状态
 * @property isSelfRecord 是否是本地录制
 */
export interface ICloudRecordInfo{
  recordStatus: RecordStatus;
  isSelfRecord: boolean;
}

export type IMonitor = IMonitorThumbnail & IMonitorInfo;

/**
 * 共享详情
 */
export interface IContentInfo {
  key: React.Key; // 是不是屏幕区域共享
  screenRegionSharing?: boolean;
  type: ContentCaptureType;
  info: IAppThumbnail | IMonitor;
  name: React.ReactNode;
}

/**
 * 虚拟背景配置
 * 
 * @property filename 文件名称，默认会在 app.getPath('userData') 处取数据
 * @property hash 存入 hash 主要是用来比较是否是同一个文件
 * @property id 唯一的 id
 * @property type 是自定义背景还是预置的
 */
export interface IVirtualBgInfo {
  filename: string;
  hash: string;
  id: string;
  type: IVirtualBgType;
}

export type IBeautyMap = Partial<Record<VideoBeautyStyle, { level: number }>>;
export type IFilterMap = Partial<Record<VideoFilterStyle, { level: number }>>;

/**
 * 选中的视频效果
 * 
 * @property virtualBg 选中的虚拟背景
 * @property beauty 选中的美颜
 * @property filter 选中的滤镜
 */
interface ISelectedVideoEffect {
  virtualBg?: { id: IVirtualBgInfo['id'] };
  beauty: { style: VideoBeautyStyle };
  filter: { style: VideoFilterStyle };
}

/**
 * 虚拟背景、美颜、滤镜数据
 * 
 * @property selected 选中的视频效果
 * @property beautyMap 美颜效果集合
 * @property filterMap 滤镜效果集合
 * @property virtualBg 虚拟背景列表
 */
export interface IVideoEffectStore {
  selected: ISelectedVideoEffect,

  beautyMap: IBeautyMap;
  filterMap: IFilterMap;

  virtualBg: {
    list: IVirtualBgInfo[];
  },
}


/**
 * 标注类型/文案
 */
export interface IAnnotationKey {
  key: AnnotationKey;
  text: string;
}

/**
 * 可绘制线条的批注类别
 */
export type IPencilAnnotationKey =
  | AnnotationKey.ERASE
  | AnnotationKey.PENCIL
  | AnnotationKey.HIGHLIGHTER;
