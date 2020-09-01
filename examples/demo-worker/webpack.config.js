const path = require("path");

module.exports = [
  {
    mode: "development",
    entry: {
      main: "./src/main.ts",
    },
    plugins: [],
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
    mode: "development",
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
