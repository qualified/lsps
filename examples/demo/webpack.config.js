const webpack = require("webpack");
const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

module.exports = {
  mode: "development",
  entry: {
    main: "./src/main.ts",
  },
  plugins: [
    ...(process.env.BUNDLE_ANALYZER === "1"
      ? [new BundleAnalyzerPlugin()]
      : []),
    new webpack.DefinePlugin({
      ROOT_URI: JSON.stringify(`file://${__dirname}/workspace/`),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  target: "web",
  node: {
    net: "mock",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public/js"),
  },
};
