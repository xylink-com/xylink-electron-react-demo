# 小鱼易连-electron sdk react demo

当前项目是基于 electron 官方推荐的 react 模板创建，详见[electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## Project setup
建议在 dev 前，将 yarn/npm 镜像切换到 toabao 镜像地址上，加速安装依赖。
### step1:
```bash
$ yarn
```
### step2:
安装完成后，安装32位electron，版本随意

```
$ yarn add electron@5.0.13 -D
```

### step3:
```bash
$ yarn add @xylink/xy-electron-sdk@latest -D
```

### step4:
使用 yarn 或 npm 安装完成  `@xylink/xy-electron-sdk` 后，在项目根目录：node_modules -> @xylink -> xy-electron-sdk -> dll 文件夹下，将所有的文件复制到当前项目的根目录上；

### step5:
执行完步骤四，项目根目录会存在一个 `I420ToARGB.cso` 文件，将此文件复制到：node_modules\electron\dist 目录下；

> 注意：步骤四是解决本地开发时，调用摄像头采集crash的问题，打正式包时，此步骤不需要，会自动copy此文件。

### step6:
编译一次，分别执行
```bash
$ yarn build-dll

$ yarn build
```

## Starting Development
执行此命令，开始编译和打开electron：
```bash
yarn dev
```

## Packaging for Production

To package apps for the local win 32 platform:

```bash
yarn package-win
```

build successfully, go to /release folder get app.

## Docs

See our [xy electron sdk docs](https://www.yuque.com/jinghui/xylink/gbi9i5)
