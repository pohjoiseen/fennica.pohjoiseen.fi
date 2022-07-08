import * as webpack from 'webpack';
import * as path from 'path';

const config: webpack.Configuration = {

    mode: 'development',

    watch: true,

    entry: path.resolve(__dirname, './main.ts'),

    output: {
        path: path.resolve(__dirname, '../../build/static'),
        filename: 'bundle.js',
    },

    devtool: 'inline-source-map',

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
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
