# 小鱼易连-electron sdk react demo

当前项目是基于 electron 官方推荐的 react 模板创建，详见[electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## 准备工作

在开始系统集成开发之前，您需要完成相应的 [准备工作](https://openapi.xylink.com/common/meeting/doc/ready_work?platform=electron)，包括开通云视讯 API 服务、注册应用，了解系统架构。

上述操作完成后，将获取到的`extId`、`clientId`、`clientSecret`配置到 [src/renderer/config/index.ts](src/renderer/config/index.ts) 文件中

```js
export const ACCOUNT = {
  extId: '',
  clientId: '',
  clientSecret: '',
};
```

## 集成开发

### 第一步

安装依赖之前，检查`.npmrc`中配置

windows 环境下配置如下

```bash
arch=ia32
platform=win32
```

mac 环境下，需要注释掉上述配置

```bash
# arch=ia32
# platform=win32
```

### 第二步

安装依赖

```bash
# 安装依赖
$ yarn
```

### 第三步

electron 包安装，版本随意，此处演示

```bash
# window 安装32位electron
$ yarn add electron@13.6.9 --arch=ia32

# mac平台
$ yarn add electron@13.6.9
```

### 第四步

#### 开发环境（只需 windows 环境配置，mac 环境忽略）

进入项目 `根目录 -> node_modules -> @xylink -> xy-electron-sdk -> dll` 文件夹下，将`I420ToARGB.cso`文件复制到 `node_modules\electron\dist` 目录下

> 注意：步骤四是解决本地开发时，调用摄像头采集 crash 的问题，打正式包时，此步骤不需要。

#### 正式打包

改写打包配置

windows 环境配置如下

```bash
{
  from: "node_modules/@xylink/xy-electron-sdk/dll",
  to: "./dll",
  filter: ["**/*"],
},
{
  from: "node_modules/@xylink/xy-electron-sdk/dll/I420ToARGB.cso",
  to: "./",
  filter: ["**/*"],
}
```

mac 环境配置如下

```bash
 {
  from: "node_modules/@xylink/xy-electron-sdk/dll",
  to: "./Frameworks",
  filter: ["**/*"]
},
```

## 本地开发

```
$ yarn dev
```

> 注意： 在 Mac 电脑下只能运行 Mac 应用程序；在 windows 电脑下只能运行 windows 应用程序

### 构建

```bash
# windows
$ yarn package

# mac
$ yarn package:mac
```

> 注意： 需在 Mac 电脑下构建 Mac 安装包；在 windows 电脑下构建 windows 安装包

构建完成后，在 release/build 目录下可得到对应的包。

## 文档

See our [xy electron sdk docs](https://openapi.xylink.com/common/meeting/doc/description?platform=electron)
