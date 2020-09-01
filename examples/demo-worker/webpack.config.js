const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

module.exports = [
  {
    entry: {
      main: "./src/main.ts",
    },
    plugins: [
      ...(process.env.BUNDLE_ANALYZER === "1"
        ? [new BundleAnalyzerPlugin()]
        : []),
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
      extensions: [".ts", ".js"],
    },
    target: "web",
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "public/js"),
    },
  },
  {
    entry: {
      main: "./src/worker.ts",
    },
    plugins: [],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    target: "webworker",
    node: {
      fs: "empty",
    },
    output: {
      filename: "worker.js",
      path: path.resolve(__dirname, "public/js"),
    },
  },
];
