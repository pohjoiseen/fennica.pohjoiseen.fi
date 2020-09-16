import * as webpack from 'webpack';
import * as path from 'path';
import TerserJSPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const config: webpack.Configuration = {

    mode: 'production',

    entry: path.resolve(__dirname, './main.tsx'),

    output: {
        path: path.resolve(__dirname, '../../build/static'),
        filename: 'bundle.[hash].js',
    },

    devtool: 'source-map',
    
    optimization: {
        minimizer: [new TerserJSPlugin()]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.[hash].css',
        })
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif|woff)$/,
                use: 'file-loader',
            }
        ]
    },

    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },

}

export default config;
