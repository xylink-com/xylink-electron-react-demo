const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { currentTime } = require("./config/utils");
const pkg = require("./package.json");

const isProduction = process.env.NODE_ENV === "production" || false;
const banner = "jinghui-Luo\n";

module.exports = {
  entry: "./src/index.jsx",
  output: {
    filename: "[name].[hash].js",
    path: path.resolve(__dirname, "build"),
  },
  devServer: {
    open: true,
    historyApiFallback: true,
    contentBase: "./",
    quiet: false, //控制台中不输出打包的信息
    noInfo: false,
    hot: true, //开启热点
    inline: true, //开启页面自动刷新
    lazy: false, //不启动懒加载
    progress: false, //显示打包的进度
    watchOptions: {
      aggregateTimeout: 300,
    },
    port: "3000", //设置端口号
  },
  optimization: {
    minimize: isProduction,
    minimizer: [new TerserPlugin()],
    runtimeChunk: false,
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(sass|scss)$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif)(\?v=\d \.\d \.\d )?$/i,
        use: [{ loader: "url-loader", options: { limit: 10000 } }],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "url-loader",
            options: { limit: 10000, minetype: "image/svg+xml" },
          },
        ],
      },
      {
        test: /\.ts$/,
        loader: "string-replace-loader",
        options: {
          search: "_BUILDVERSION_",
          replace: pkg.version + " - build on " + currentTime(),
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin({ banner }),
    new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].[hash].css",
      chunkFilename: "[id].css",
      ignoreOrder: false,
    }),
    new HtmlWebPackPlugin({
      template: "./public/index.html",
      filename: "index.html",
    }),
  ],
};
