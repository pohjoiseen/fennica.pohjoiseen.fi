/**
 * Generator entry point.
 * Two modes:
 * - watch: load everything, write out images and JSONs, serve HTMLs, run webpack-dev-server for client-side stuff
 * - generate: load everything, write out static HTMLs and make production webpack build
 */
import * as fs from 'fs';
import chalk from 'chalk';
import {getBuildDir} from './paths';
import {initStaticDir} from './staticDir';
import {initImages} from './images';
import {initContent} from './content';
import {runServer, setupWatcher} from './server';
import {runGenerator} from './generator';
import {MAIN_TITLE} from '../const';

const watchMode = process.argv.includes('dev');

console.log(chalk.greenBright(`${MAIN_TITLE} generator/devserver - ${watchMode ? 'devserver' : 'build'} mode`));

// sanity check
try {
    fs.mkdirSync(getBuildDir(), {recursive: true});
    fs.writeFileSync(getBuildDir() + '/.test', 'test', {encoding: 'utf8'});
    fs.unlinkSync(getBuildDir() + '/.test');
} catch (e) {
    throw new Error('Looks like build dir is not writable.  Please check');
}

// Set up watcher before actually building anything to catch possible changes DURING the build
let watcher = null;
if (watchMode) {
    watcher = setupWatcher();
}

// Copy static dir
initStaticDir();

// Build images, this is async so the rest is in a promise
initImages().then(() => {

    // Load/build content
    initContent();

    console.log(chalk.greenBright('Loading/asset initialization complete'));

    if (watchMode) {
        runServer();
    } else {
        runGenerator();
    }

}).catch((e) => {
    console.log(e);
    process.exit(-1);
});
