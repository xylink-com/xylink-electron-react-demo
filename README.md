# 小鱼易连-electron sdk react demo

当前项目是基于 electron 官方推荐的 react 模板创建，详见[electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## Starting Development

建议在 dev 前，将 yarn/npm 镜像切换到 toabao 镜像地址上，加速安装依赖。

1. 安装依赖

```bash
$ yarn

# 安装完成后，安装32位electron，版本随意
$ yarn add electron@5.0.13 -D --arch=ia32
```

2. 项目根目录：node_modules -> @xylink -> xy-electron-sdk -> dll 文件夹下，将所有的 \*.dll 文件复制到项目的根目录上；

3. 执行编译

```bash
$ yarn build-dll

$ yarn build
```

4. dev

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
