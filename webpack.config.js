const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    module: {
        rules: [
        {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Clean dist folder before each build
    },
    plugins: [
        new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        }),
        new CopyWebpackPlugin({
        patterns: [
            {
            from: 'public',
            to: '.',
            },
        ],
        }),
    ],
    devServer: {
        static: {
        directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 3000,
        open: true, // Automatically open browser
        hot: true,  // Hot module replacement
    },
  mode: 'development', // Change to 'production' for final builds
};