# 小鱼易连-electron sdk react demo

当前项目是基于 electron 官方推荐的 react 模板创建，详见[electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## Project setup
建议在 dev 前，将 yarn/npm 镜像切换到 taobao 镜像地址上，加速安装依赖。
### step1:
```bash
$ yarn
```
### step2:
安装完成后，
在windows上安装32位electron，版本随意

```
$ yarn add electron@13.6.9 -D
```

在mac上，注释.npmrc中内容
```
$ yarn add electron@13.6.9 -D
```

### step3:
```bash
$ yarn add @xylink/xy-electron-sdk@latest -D
```

## Starting Development
执行此命令，开始编译和打开electron：
```bash
yarn dev
```

## Packaging for Production

### Windows打包
```bash
yarn package
```

### Mac 打包
```bash
yarn package:mac
```

> 注意： 需在Mac电脑下Mac安装包；在windows电脑下构建windows安装包

构建完成后，在release/build目录下可得到对应的包。

## Docs

See our [xy electron sdk docs](https://openapi.xylink.com/common/meeting/doc/description?platform=electron)
