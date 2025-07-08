const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    
    // Set the mode to 'production' for optimized builds, or 'development' for faster local builds
    mode: 'development', // Change to 'production' for final builds

    // Source maps help with debugging your original TypeScript code in the browser
    devtool: 'inline-source-map',

    // Output configuration: where to put the bundled files
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Clean dist folder before each build
        publicPath: '', // Crucial for relative paths in the generated HTML
    },

    // How Webpack resolves modules (e.g., allowing you to import .ts files)
    resolve: {
        extensions: ['.ts', '.js'],
    },

    // Rules for how different file types are handled
    module: {
        rules: [
            {
                test: /\.ts$/,  // Apply this rule to files ending in .ts
                use: 'ts-loader',   // Use ts-loader to transpile TypeScript to JavaScript
                exclude: /node_modules/,    // Don't process files in node_modules
            },
            // If you have image assets, you might need a rule like this:
            // {
            //     test: /\.(png|jpg|jpeg|gif)$/,
            //     type: 'asset/resource',  // Webpack 5 way to handle assets
            // }
        ],
    },
    
    // Plugins for additional build tasks
    plugins: [
        // HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles
        // It injects the bundled JavaScript into your HTML template
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'),    // Path to your source HTML template (in the project root)
            filename: 'index.html', // The name of the output HTML file (will be placed in 'dist/')
            // HtmlWebpackPlugin automatically injects the script tag for 'main.js' relative to the output HTML.
            // So, if your template has <script src="dist/main.js"></script>, it will be corrected.
            // If it has <script src="main.js"></script>, it's already correct for the output.
            chunks: ['main'],   // Specify which chunk to inject (matches 'entry' key if named, or 'main' by default)
            inject: 'body', // Inject scripts into the body (default behavior)
        }),
        // CopyWebpackPlugin copies individual files or entire directories to the build directory.
        // Useful for assets that don't need to be processed by Webpack (like your sprite sheet).
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public', // Source directory for your assets
                    to: '.',  // Destination directory in your output (e.g., 'dist/assets/')
                },
            ],
        }),
    ],

    // Webpack Dev Server configuration (for `npm start`)
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 3000,
        open: true, // Automatically open browser
        hot: true,  // Hot module replacement
    },
};